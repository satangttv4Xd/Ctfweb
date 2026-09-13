import http.server
import socketserver
import socket
import json
import re
import tempfile
import os
import sys
import base64
import shutil
import zipfile
import subprocess
import tarfile
import gzip
import bz2
import lzma

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

PORT = 7788
FLAG_REGEX = re.compile(
    r'(?:flag|ctf|elec|picoctf|thm|htb|sec)[a-z0-9_-]*\{[a-zA-Z0-9_!@#$%^&*()+=~-]{3,100}\}|[a-zA-Z0-9_-]{3,15}\{[a-zA-Z0-9_!@#$%^&*()+=~-]{3,100}\}',
    re.IGNORECASE
)

COMMON_PASSWORDS = [
    "aq4cp79d",
    "",
    "password",
    "123456",
    "admin",
    "secret",
    "root",
    "toor",
    "flag",
    "ctf"
]

NOTE_FILENAMES = {
    'note.txt', 'notes.txt', 'password.txt', 'passwords.txt', 'pass.txt', 'pwd.txt',
    'hint.txt', 'hints.txt', 'key.txt', 'keys.txt', 'secret.txt', 'secrets.txt',
    'readme.txt', 'read_me.txt', 'readme.md', 'next.txt', 'info.txt', 'token.txt'
}

ARCHIVE_EXTENSIONS = {
    '.zip', '.tar', '.gz', '.tgz', '.bz2', '.tbz2', '.xz', '.txz',
    '.7z', '.rar', '.apk', '.jar', '.iso'
}

def is_archive_file(filepath: str) -> bool:
    if not os.path.isfile(filepath):
        return False
    ext = os.path.splitext(filepath)[1].lower()
    if ext in ARCHIVE_EXTENSIONS:
        return True
    try:
        with open(filepath, 'rb') as f:
            magic = f.read(16)
        if magic.startswith(b'PK\x03\x04') or magic.startswith(b'PK\x05\x06'):
            return True
        if magic.startswith(b'7z\xbc\xaf\x27\x1c'):
            return True
        if magic.startswith(b'Rar!\x1a\x07'):
            return True
        if magic.startswith(b'\x1f\x8b'):
            return True
        if magic.startswith(b'BZh'):
            return True
        if magic.startswith(b'\xfd7zXZ\x00'):
            return True
        if len(magic) >= 512 and b'ustar' in magic:
            return True
    except Exception:
        pass
    return False

def try_7z_extract(archive_path: str, dest_dir: str, password: str = None) -> bool:
    cmd = ["7z", "x", archive_path, f"-o{dest_dir}", "-y"]
    if password is not None and password != "":
        cmd.append(f"-p{password}")
    else:
        cmd.append("-p")
    try:
        res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=30)
        return res.returncode == 0
    except Exception:
        return False

def extract_single_archive(archive_path: str, dest_dir: str, passwords_to_try: list):
    os.makedirs(dest_dir, exist_ok=True)
    is_zip = False
    try:
        with open(archive_path, 'rb') as f:
            header = f.read(4)
        if header == b'PK\x03\x04' or archive_path.lower().endswith('.zip'):
            is_zip = True
    except Exception:
        pass

    # 1. Try Python zipfile
    if is_zip:
        for pwd in passwords_to_try:
            try:
                with zipfile.ZipFile(archive_path, 'r') as z:
                    pwd_bytes = pwd.encode('utf-8') if pwd else None
                    z.extractall(path=dest_dir, pwd=pwd_bytes)
                extracted = [os.path.join(dest_dir, f) for f in os.listdir(dest_dir)]
                if extracted:
                    return True, pwd, extracted
            except Exception:
                pass

    # 2. Try tarfile
    try:
        if tarfile.is_tarfile(archive_path):
            with tarfile.open(archive_path, 'r:*') as t:
                t.extractall(path=dest_dir)
            extracted = [os.path.join(dest_dir, f) for f in os.listdir(dest_dir)]
            if extracted:
                return True, "", extracted
    except Exception:
        pass

    # 3. Try 7z CLI
    for pwd in passwords_to_try:
        temp_layer = tempfile.mkdtemp(prefix="7z_layer_")
        try:
            if try_7z_extract(archive_path, temp_layer, password=pwd):
                files = os.listdir(temp_layer)
                if files:
                    for item in files:
                        s = os.path.join(temp_layer, item)
                        d = os.path.join(dest_dir, item)
                        if os.path.isdir(s):
                            shutil.copytree(s, d, dirs_exist_ok=True)
                        else:
                            shutil.copy2(s, d)
                    extracted = [os.path.join(dest_dir, f) for f in os.listdir(dest_dir)]
                    return True, pwd, extracted
        finally:
            shutil.rmtree(temp_layer, ignore_errors=True)

    # 4. Single file decompressors
    base_name = os.path.basename(archive_path)
    out_name = os.path.splitext(base_name)[0]
    if out_name == base_name:
        out_name += ".out"
    out_file = os.path.join(dest_dir, out_name)

    try:
        with gzip.open(archive_path, 'rb') as f_in:
            data = f_in.read()
            if len(data) > 0:
                with open(out_file, 'wb') as f_out:
                    f_out.write(data)
                return True, "", [out_file]
    except Exception:
        pass

    try:
        with bz2.open(archive_path, 'rb') as f_in:
            data = f_in.read()
            if len(data) > 0:
                with open(out_file, 'wb') as f_out:
                    f_out.write(data)
                return True, "", [out_file]
    except Exception:
        pass

    try:
        with lzma.open(archive_path, 'rb') as f_in:
            data = f_in.read()
            if len(data) > 0:
                with open(out_file, 'wb') as f_out:
                    f_out.write(data)
                return True, "", [out_file]
    except Exception:
        pass

    return False, None, []

def extract_password_from_text(content: str) -> list:
    candidates = []
    patterns = [
        r'(?:password|pass|pwd|key|code|secret)(?:\s+for\s+[a-z0-9_\s]+)?\s*[:=]\s*["\']?([a-zA-Z0-9_!@#$%^&*()+=~-]+)',
        r'is\s*[:=]\s*["\']?([a-zA-Z0-9_!@#$%^&*()+=~-]+)',
        r'next\s*[:=]\s*["\']?([a-zA-Z0-9_!@#$%^&*()+=~-]+)'
    ]
    for p in patterns:
        for m in re.findall(p, content, re.IGNORECASE):
            clean = m.strip('",;: \t\r\n').strip("'")
            if clean and clean not in candidates:
                candidates.append(clean)

    for line in content.splitlines():
        line = line.strip()
        if line and len(line) <= 64:
            clean = re.sub(r'^(?:password(?:\s+for\s+[a-z0-9_\s]+)?|pass|key|pwd)\s*[:=]\s*', '', line, flags=re.IGNORECASE).strip('",;: \t\r\n').strip("'")
            if clean and clean not in candidates:
                candidates.append(clean)

    full = content.strip().strip('",;: \t\r\n').strip("'")
    if full and len(full) <= 64 and full not in candidates:
        candidates.append(full)

    return candidates

def find_passwords_and_flags_in_folder(folder_path: str):
    pwds = []
    flags = set()
    all_files = []
    for root, _, files in os.walk(folder_path):
        for f in files:
            full_path = os.path.join(root, f)
            all_files.append(full_path)
            fname_lower = f.lower()
            try:
                with open(full_path, 'rb') as fp:
                    raw_data = fp.read()
                text = raw_data.decode('latin-1', errors='ignore')
                for m in FLAG_REGEX.findall(text):
                    if all(32 <= ord(c) <= 126 for c in m):
                        flags.add(m)
                if fname_lower in NOTE_FILENAMES or fname_lower.endswith(('.txt', '.md', '.log', '.json')):
                    for p in extract_password_from_text(text):
                        if p not in pwds:
                            pwds.append(p)
            except Exception:
                pass
    return pwds, flags, all_files

def check_zip_comment_for_clues(archive_path: str) -> list:
    candidates = []
    try:
        with zipfile.ZipFile(archive_path, 'r') as z:
            if z.comment:
                comment_str = z.comment.decode('latin-1', errors='ignore')
                candidates.extend(extract_password_from_text(comment_str))
    except Exception:
        pass
    return candidates

def solve_matryoshka_archive(archive_path: str, initial_password: str = None, max_layers: int = 100):
    logs = [
        "============================================================",
        " [*] CTF RECURSIVE NESTED ARCHIVE SOLVER ENGINE",
        f" File: {archive_path}"
    ]
    if initial_password:
        logs.append(f" Initial Password Hint: '{initial_password}'")
    logs.append("============================================================\n")

    if not os.path.exists(archive_path):
        logs.append(f"[-] Error: File '{archive_path}' not found.")
        return "\n".join(logs), []

    work_base = tempfile.mkdtemp(prefix="ctf_matryoshka_")
    current_archive = os.path.abspath(archive_path)
    current_layer = 1
    all_discovered_flags = set()
    passwords_used_chain = []

    base_stem = os.path.splitext(os.path.basename(archive_path))[0]
    known_passwords = []
    if initial_password:
        known_passwords.append(initial_password)
    known_passwords.append("aq4cp79d")
    if base_stem not in known_passwords:
        known_passwords.append(base_stem)
    for p in COMMON_PASSWORDS:
        if p not in known_passwords:
            known_passwords.append(p)

    try:
        while current_layer <= max_layers:
            layer_dir = os.path.join(work_base, f"layer_{current_layer}")
            archive_name = os.path.basename(current_archive)
            logs.append(f"[Layer {current_layer}] Unpacking '{archive_name}'...")

            comment_hints = check_zip_comment_for_clues(current_archive)
            candidates = comment_hints + known_passwords

            success, used_pwd, extracted_files = extract_single_archive(current_archive, layer_dir, candidates)
            if not success:
                logs.append(f"  [-] Failed to extract '{archive_name}' at Layer {current_layer}.")
                logs.append(f"  [i] Passwords attempted: {candidates[:6]}")
                break

            pwd_disp = f"'{used_pwd}'" if used_pwd else "(None / Unencrypted)"
            logs.append(f"  [+] Layer {current_layer} Extracted successfully! Password used: {pwd_disp}")
            if used_pwd:
                passwords_used_chain.append(used_pwd)

            layer_passwords, layer_flags, all_layer_files = find_passwords_and_flags_in_folder(layer_dir)
            if layer_flags:
                for f in layer_flags:
                    all_discovered_flags.add(f)
                    logs.append(f"  [FLAG] DISCOVERED in Layer {current_layer}: {f}")

            rel_files = [os.path.relpath(f, layer_dir) for f in all_layer_files if os.path.isfile(f)]
            logs.append(f"  [i] Files extracted ({len(rel_files)}): {', '.join(rel_files[:6])}")

            if layer_passwords:
                logs.append(f"  [KEY] Discovered next password candidates: {layer_passwords}")
                for p in reversed(layer_passwords):
                    if p not in known_passwords:
                        known_passwords.insert(0, p)
                    else:
                        known_passwords.remove(p)
                        known_passwords.insert(0, p)

            nested_archives = [f for f in all_layer_files if is_archive_file(f) and f != current_archive]
            if not nested_archives:
                logs.append(f"\n[+] Innermost layer reached at Layer {current_layer}! No further nested archives.")
                break

            nested_archives.sort(key=lambda x: (
                0 if 'layer' in os.path.basename(x).lower() or os.path.splitext(x)[1].lower() == '.zip' else 1,
                len(x)
            ))
            current_archive = nested_archives[0]
            current_layer += 1

        logs.append("\n============================================================")
        logs.append(" [*] EXTRACTION SUMMARY:")
        logs.append(f" Total Layers Unpacked : {current_layer}")
        logs.append(f" Passwords Chain Used  : {' -> '.join(passwords_used_chain) if passwords_used_chain else 'None'}")
        if all_discovered_flags:
            logs.append(f" [!] FINAL FLAGS DISCOVERED ({len(all_discovered_flags)}):")
            for flag in all_discovered_flags:
                logs.append(f"  --> {flag}")
        else:
            logs.append(" [i] No standard flag format found in the unpacked files.")
        logs.append("============================================================\n")

        return "\n".join(logs), list(all_discovered_flags)
    finally:
        pass

class ThreadingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Allow-Private-Network', 'true')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_GET(self):
        if self.path in ('/health', '/'):
            resp = json.dumps({
                "status": "ok",
                "agent": "CTF Swarm Python Desktop Agent v2.0 (Stego + 20-Layer Recursive Matryoshka ZIP Engine)",
                "port": PORT
            }).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(resp)))
            self.send_header('Connection', 'close')
            self.end_headers()
            self.wfile.write(resp)
        else:
            self.send_response(404)
            self.send_header('Content-Length', '0')
            self.end_headers()

    def do_POST(self):
        if self.path in ('/api/analyze-stego', '/api/analyze-archive', '/api/analyze-file'):
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length).decode('utf-8'))
            file_name = body.get('fileName', 'file')
            b64 = body.get('fileBase64', '').split(',')[-1]
            buf = base64.b64decode(b64)
            found = set()
            log_lines = []

            init_pwd = body.get('initialPassword') or body.get('password')
            ch_text = body.get('challengeText', '')
            if not init_pwd and ch_text:
                m = re.search(r'(?:รหัส(?:ผ่าน|ชั้น[^=:\s]+)?|password(?:\s+for\s+[^=:\s]+)?|pass|key|pwd)\s*[:=]?\s*([a-zA-Z0-9_!@#$%^&*()+=~-]+)', ch_text, re.I)
                if m:
                    init_pwd = m.group(1).strip()

            ext = os.path.splitext(file_name)[1].lower()
            is_zip_magic = buf.startswith(b'PK\x03\x04') or buf.startswith(b'7z\xbc\xaf\x27\x1c') or buf.startswith(b'Rar!')
            if is_zip_magic or ext in ('.zip', '.tar', '.gz', '.bz2', '.xz', '.7z', '.rar'):
                temp_arch = tempfile.NamedTemporaryFile(delete=False, suffix=ext or '.zip')
                temp_arch.write(buf)
                temp_arch.close()
                out_txt, arch_flags = solve_matryoshka_archive(temp_arch.name, initial_password=init_pwd)
                log_lines.append(out_txt)
                found.update(arch_flags)
                try:
                    os.unlink(temp_arch.name)
                except Exception:
                    pass
            else:
                log_lines.append(f"[Stego Engine] Analyzing {file_name}...")
                text = buf.decode('latin-1', errors='ignore')
                for m in FLAG_REGEX.findall(text):
                    found.add(m)
                iend_pos = buf.find(b'IEND')
                if iend_pos != -1 and iend_pos + 8 < len(buf):
                    for m in FLAG_REGEX.findall(buf[iend_pos+8:].decode('latin-1', errors='ignore')):
                        found.add(m)
                try:
                    from PIL import Image
                    temp = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
                    temp.write(buf)
                    temp.close()
                    img = Image.open(temp.name)
                    if img.info:
                        for k, v in img.info.items():
                            for m in FLAG_REGEX.findall(str(v)):
                                found.add(m)
                    if img.mode in ('RGB', 'RGBA'):
                        px = list(img.get_flattened_data() if hasattr(img, 'get_flattened_data') else img.getdata())
                        for c in range(min(len(px[0]) if isinstance(px[0], (tuple, list)) else 3, 3)):
                            bits = [str((p[c] if isinstance(p, (tuple, list)) else p) & 1) for p in px]
                            barr = bytearray([int("".join(bits[i:i+8]), 2) for i in range(0, len(bits)-7, 8)])
                            for m in FLAG_REGEX.findall(barr.decode('latin-1', errors='ignore')):
                                found.add(m)
                    os.unlink(temp.name)
                except Exception:
                    pass
                if found:
                    log_lines.append(f"[!] FLAGS DISCOVERED ({len(found)}):")
                    for f in found:
                        log_lines.append(f"  -> {f}")
                else:
                    log_lines.append("[i] Result: No flag found in Stego/Metadata.")

            resp = json.dumps({"success": True, "stdout": "\n".join(log_lines), "flags": list(found)}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(resp)))
            self.send_header('Connection', 'close')
            self.end_headers()
            self.wfile.write(resp)

try:
    class DualStackServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
        address_family = getattr(socket, 'AF_INET6', socket.AF_INET)
        daemon_threads = True
        allow_reuse_address = True
        def server_bind(self):
            try:
                self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
            except Exception:
                pass
            super().server_bind()
    httpd = DualStackServer(("", PORT), H)
except Exception:
    httpd = ThreadingServer(("", PORT), H)

if __name__ == '__main__':
    print("============================================================")
    print("  🤖 CTF SWARM DESKTOP AGENT (ONLINE http://localhost:7788)")
    print("============================================================")
    print("[✓] Server is active and listening on port 7788.")
    print("[i] Features: Image Stego + Recursive 20-Layer Matryoshka ZIP Engine")
    print("[i] Keep this window OPEN while using CTF Swarm in your browser.")
    print("[*] Ready for incoming CTF challenges & files...")
    with httpd:
        httpd.serve_forever()
