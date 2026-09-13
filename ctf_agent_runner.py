import http.server, socketserver, json, re, tempfile, os, sys, base64, shutil, zipfile, subprocess

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception: pass

PORT = 7788
REG = re.compile(r'(?:flag|ctf|elec|picoctf|thm|htb|sec)[a-z0-9_-]*\\{[a-zA-Z0-9_!@#$%^&*()+=~-]{3,100}\\}|[a-zA-Z0-9_-]{3,15}\\{[a-zA-Z0-9_!@#$%^&*()+=~-]{3,100}\\}', re.IGNORECASE)
COMMON_PWDS = ["aq4cp79d", "", "password", "123456", "admin", "secret", "root", "flag", "ctf"]
NOTE_NAMES = {'note.txt', 'password.txt', 'pass.txt', 'pwd.txt', 'hint.txt', 'key.txt', 'readme.txt', 'secret.txt', 'next.txt'}

def solve_archive(file_path, init_pwd=None):
    log = ["[*] CTF Recursive Nested Archive Solver Engine"]
    found_flags = set()
    pwds = [init_pwd] if init_pwd else []
    for p in COMMON_PWDS:
        if p not in pwds: pwds.append(p)
    work_dir = tempfile.mkdtemp(prefix="ctf_unzip_")
    curr = file_path
    layer = 1
    chain = []
    while layer <= 100:
        ldir = os.path.join(work_dir, f"layer_{layer}")
        os.makedirs(ldir, exist_ok=True)
        arch_name = os.path.basename(curr)
        log.append(f"[Layer {layer}] Unpacking '{arch_name}'...")
        success = False
        used_p = None
        for p in pwds:
            try:
                with zipfile.ZipFile(curr, 'r') as z:
                    z.extractall(ldir, pwd=p.encode('utf-8') if p else None)
                success = True
                used_p = p
                break
            except Exception: pass
        if not success:
            for p in pwds:
                cmd = ["7z", "x", curr, f"-o{ldir}", "-y"]
                if p: cmd.append(f"-p{p}")
                else: cmd.append("-p")
                try:
                    if subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0:
                        success = True
                        used_p = p
                        break
                except Exception: pass
        if not success:
            log.append(f"  [-] Failed to extract at Layer {layer}")
            break
        p_disp = f"'{used_p}'" if used_p else "None"
        log.append(f"  [+] Layer {layer} extracted! Password used: {p_disp}")
        if used_p: chain.append(used_p)
        extracted_files = []
        new_pwds = []
        for r, _, fl in os.walk(ldir):
            for f in fl:
                fp = os.path.join(r, f)
                extracted_files.append(fp)
                try:
                    with open(fp, 'rb') as xf: raw = xf.read()
                    txt = raw.decode('latin-1', errors='ignore')
                    for m in REG.findall(txt): found_flags.add(m)
                    if f.lower() in NOTE_NAMES or f.lower().endswith('.txt'):
                        for pat in [r'(?:password|pass|key|pwd)\\s*[:=]\\s*(\\S+)', r'is\\s*[:=]\\s*(\\S+)']:
                            for match in re.findall(pat, txt, re.I):
                                clean_p = match.strip('",;: ').strip("'")
                                if clean_p and clean_p not in new_pwds: new_pwds.append(clean_p)
                        st = txt.strip()
                        if st and len(st) <= 64 and st not in new_pwds:
                            new_pwds.append(st)
                except Exception: pass
        if new_pwds:
            log.append(f"  [KEY] Discovered next password candidates: {new_pwds}")
            for np in reversed(new_pwds):
                if np in pwds: pwds.remove(np)
                pwds.insert(0, np)
        nxt = [f for f in extracted_files if f.lower().endswith(('.zip', '.tar', '.gz', '.bz2', '.xz', '.7z', '.rar')) and f != curr]
        if not nxt:
            log.append(f"[+] Reached innermost layer at Layer {layer}!")
            break
        curr = nxt[0]
        layer += 1
    log.append(f"[*] Summary: Unpacked {layer} layers | Password chain: {' -> '.join(chain)}")
    if found_flags:
        log.append(f"[!] FLAGS DISCOVERED ({len(found_flags)}):")
        for f in found_flags: log.append(f"  --> {f}")
    return "\\n".join(log), found_flags

class H(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', '*')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()
    def do_GET(self):
        if self.path in ('/health', '/'):
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "agent": "CTF Swarm Python Desktop Agent v2.0 (Stego + Matryoshka ZIP)"}).encode())
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
                m = re.search(r'(?:รหัส|password|pass|key|pwd)\\s*[:=]?\\s*([a-zA-Z0-9_!@#$%^&*()+=~-]+)', ch_text, re.I)
                if m: init_pwd = m.group(1).strip()
            ext = os.path.splitext(file_name)[1].lower()
            if b"PK\\x03\\x04" in buf or ext in ('.zip', '.tar', '.gz', '.bz2', '.xz', '.7z', '.rar'):
                temp_arch = tempfile.NamedTemporaryFile(delete=False, suffix=ext or '.zip')
                temp_arch.write(buf)
                temp_arch.close()
                out_txt, arch_flags = solve_archive(temp_arch.name, init_pwd=init_pwd)
                log_lines.append(out_txt)
                found.update(arch_flags)
                try: os.unlink(temp_arch.name)
                except Exception: pass
            else:
                log_lines.append(f"[Stego Engine] Analyzing {file_name}...")
                text = buf.decode('latin-1', errors='ignore')
                for m in REG.findall(text): found.add(m)
                iend_pos = buf.find(b'IEND')
                if iend_pos != -1 and iend_pos + 8 < len(buf):
                    for m in REG.findall(buf[iend_pos+8:].decode('latin-1', errors='ignore')): found.add(m)
                try:
                    from PIL import Image
                    temp = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
                    temp.write(buf)
                    temp.close()
                    img = Image.open(temp.name)
                    if img.info:
                        for k, v in img.info.items():
                            for m in REG.findall(str(v)): found.add(m)
                    if img.mode in ('RGB', 'RGBA'):
                        px = list(img.get_flattened_data() if hasattr(img, 'get_flattened_data') else img.getdata())
                        for c in range(min(len(px[0]) if isinstance(px[0], (tuple, list)) else 3, 3)):
                            bits = [str((p[c] if isinstance(p, (tuple, list)) else p) & 1) for p in px]
                            barr = bytearray([int("".join(bits[i:i+8]), 2) for i in range(0, len(bits)-7, 8)])
                            for m in REG.findall(barr.decode('latin-1', errors='ignore')): found.add(m)
                    os.unlink(temp.name)
                except Exception: pass
                if found:
                    log_lines.append(f"[!] FLAGS DISCOVERED ({len(found)}):")
                    for f in found: log_lines.append(f"  -> {f}")
                else: log_lines.append("[i] Result: No flag found in Stego/Metadata.")
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "stdout": "\\n".join(log_lines), "flags": list(found)}).encode())

print("============================================================")
print("  🤖 CTF SWARM DESKTOP AGENT (ONLINE http://localhost:7788)")
print("============================================================")
with socketserver.TCPServer(("", PORT), H) as httpd:
    httpd.allow_reuse_address = True
    httpd.serve_forever()
