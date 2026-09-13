import os
import sys
import re
import shutil
import tempfile
import zipfile
import tarfile
import gzip
import bz2
import lzma
import subprocess
from typing import List, Set, Dict, Optional, Tuple

if sys.platform == 'win32':
    try:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        if hasattr(sys.stderr, 'reconfigure'):
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

FLAG_REGEX = re.compile(
    r'(?:flag|ctf|elec|picoctf|thm|htb|sec)[a-z0-9_-]*\{[A-Za-z0-9_\-!@#$%^&*()+=~]{3,100}\}|[a-zA-Z0-9_-]{3,15}\{[A-Za-z0-9_\-!@#$%^&*()+=~]{3,100}\}',
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
    """Check if a file is an archive based on extension or magic bytes."""
    if not os.path.isfile(filepath):
        return False
    
    ext = os.path.splitext(filepath)[1].lower()
    if ext in ARCHIVE_EXTENSIONS:
        return True

    try:
        with open(filepath, 'rb') as f:
            magic = f.read(16)
        if magic.startswith(b'PK\x03\x04') or magic.startswith(b'PK\x05\x06'): # ZIP
            return True
        if magic.startswith(b'7z\xbc\xaf\x27\x1c'): # 7-Zip
            return True
        if magic.startswith(b'Rar!\x1a\x07'): # RAR
            return True
        if magic.startswith(b'\x1f\x8b'): # GZIP
            return True
        if magic.startswith(b'BZh'): # BZIP2
            return True
        if magic.startswith(b'\xfd7zXZ\x00'): # XZ
            return True
        if len(magic) >= 512 and b'ustar' in magic: # TAR
            return True
    except Exception:
        pass
    return False

def try_7z_extract(archive_path: str, dest_dir: str, password: Optional[str] = None) -> bool:
    """Attempt extraction using system 7z CLI (supports AES-256, RAR, 7z, etc.)."""
    cmd = ["7z", "x", archive_path, f"-o{dest_dir}", "-y"]
    if password is not None and password != "":
        cmd.append(f"-p{password}")
    else:
        cmd.append("-p") # empty password
    
    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
        return res.returncode == 0
    except Exception:
        return False

def extract_single_archive(archive_path: str, dest_dir: str, passwords_to_try: List[str]) -> Tuple[bool, Optional[str], List[str]]:
    """
    Attempts to extract an archive using a list of candidate passwords.
    Returns: (success: bool, used_password: Optional[str], extracted_files: List[str])
    """
    os.makedirs(dest_dir, exist_ok=True)
    
    # Check if archive is a standard zip
    is_zip = False
    try:
        with open(archive_path, 'rb') as f:
            header = f.read(4)
        if header == b'PK\x03\x04' or archive_path.lower().endswith('.zip'):
            is_zip = True
    except Exception:
        pass

    # 1. Try Python zipfile if it is a ZIP
    if is_zip:
        for pwd in passwords_to_try:
            try:
                with zipfile.ZipFile(archive_path, 'r') as z:
                    pwd_bytes = pwd.encode('utf-8') if pwd else None
                    z.extractall(path=dest_dir, pwd=pwd_bytes)
                extracted = [os.path.join(dest_dir, f) for f in os.listdir(dest_dir)]
                if extracted:
                    return True, pwd, extracted
            except (RuntimeError, zipfile.BadZipFile, zipfile.LargeZipFile):
                # Password incorrect or AES/unsupported compression
                pass
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

    # 3. Try 7z CLI (supports AES-256 encrypted zips, RAR, 7z)
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

    # 4. Try single file decompressors (gzip, bz2, lzma)
    base_name = os.path.basename(archive_path)
    out_name = os.path.splitext(base_name)[0]
    if out_name == base_name:
        out_name += ".out"
    out_file = os.path.join(dest_dir, out_name)

    # Gzip
    try:
        with gzip.open(archive_path, 'rb') as f_in:
            data = f_in.read()
            if len(data) > 0:
                with open(out_file, 'wb') as f_out:
                    f_out.write(data)
                return True, "", [out_file]
    except Exception:
        pass

    # Bz2
    try:
        with bz2.open(archive_path, 'rb') as f_in:
            data = f_in.read()
            if len(data) > 0:
                with open(out_file, 'wb') as f_out:
                    f_out.write(data)
                return True, "", [out_file]
    except Exception:
        pass

    # Lzma
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

def extract_password_from_text(content: str) -> List[str]:
    """Parse potential password tokens from a text string."""
    candidates = []
    
    # 1. Look for explicit password prefix patterns like "Password for next layer: abc123"
    patterns = [
        r'(?:password|pass|pwd|key|code|secret)(?:\s+for\s+[a-z0-9_\s]+)?\s*[:=]\s*["\']?([A-Za-z0-9_\-!@#$%^&*+=~]+)',
        r'is\s*[:=]\s*["\']?([A-Za-z0-9_\-!@#$%^&*+=~]+)',
        r'next\s*[:=]\s*["\']?([A-Za-z0-9_\-!@#$%^&*+=~]+)'
    ]
    for p in patterns:
        matches = re.findall(p, content, re.IGNORECASE)
        for m in matches:
            if m.strip():
                candidates.append(m.strip())

    # 2. Add single stripped lines if short
    for line in content.splitlines():
        line = line.strip()
        if line and len(line) <= 64:
            # strip common wrappers
            clean = re.sub(r'^(?:password|pass|key|pwd)\s*[:=]\s*', '', line, flags=re.IGNORECASE).strip()
            if clean and clean not in candidates:
                candidates.append(clean)

    # 3. Add full stripped content if short
    full_strip = content.strip()
    if full_strip and len(full_strip) <= 64 and full_strip not in candidates:
        candidates.append(full_strip)

    return candidates

def find_passwords_and_flags_in_folder(folder_path: str) -> Tuple[List[str], Set[str], List[str]]:
    """
    Scans a folder for note files, extracts password candidates, and checks for CTF flags.
    Returns: (password_candidates, found_flags, all_files_found)
    """
    password_candidates: List[str] = []
    found_flags: Set[str] = set()
    all_files: List[str] = []

    for root, _, files in os.walk(folder_path):
        for f in files:
            full_path = os.path.join(root, f)
            all_files.append(full_path)
            fname_lower = f.lower()

            try:
                with open(full_path, 'rb') as fp:
                    raw_data = fp.read()
                
                # Check for flags in all files
                text = raw_data.decode('latin-1', errors='ignore')
                matches = FLAG_REGEX.findall(text)
                for m in matches:
                    if all(32 <= ord(c) <= 126 for c in m):
                        found_flags.add(m)

                # If this is a note or text file, extract potential passwords
                if fname_lower in NOTE_FILENAMES or fname_lower.endswith(('.txt', '.md', '.log', '.json')):
                    pwds = extract_password_from_text(text)
                    for p in pwds:
                        if p not in password_candidates:
                            password_candidates.append(p)
            except Exception:
                pass

    return password_candidates, found_flags, all_files

def check_zip_comment_for_clues(archive_path: str) -> List[str]:
    """Inspect zip comment for clues or passwords."""
    candidates = []
    try:
        with zipfile.ZipFile(archive_path, 'r') as z:
            if z.comment:
                comment_str = z.comment.decode('latin-1', errors='ignore')
                candidates.extend(extract_password_from_text(comment_str))
    except Exception:
        pass
    return candidates

def solve_matryoshka_archive(
    archive_path: str,
    initial_password: Optional[str] = None,
    max_layers: int = 100
) -> Dict:
    """
    Recursively unpacks nested archives layer by layer.
    Extracts passwords from note.txt or clues in each layer,
    and searches for CTF flags until the innermost layer.
    """
    print(f"\n============================================================")
    print(f" [*] CTF RECURSIVE NESTED ARCHIVE SOLVER ENGINE")
    print(f" File: {archive_path}")
    if initial_password:
        print(f" Initial Password Hint: '{initial_password}'")
    print(f"============================================================\n")

    if not os.path.exists(archive_path):
        print(f"[-] Error: File '{archive_path}' not found.")
        return {"success": False, "error": f"File not found: {archive_path}", "flags": []}

    work_base = tempfile.mkdtemp(prefix="ctf_matryoshka_")
    current_archive = os.path.abspath(archive_path)
    current_layer = 1
    
    all_discovered_flags: Set[str] = set()
    passwords_used_chain: List[str] = []
    
    # Priority password list
    base_stem = os.path.splitext(os.path.basename(archive_path))[0]
    known_passwords: List[str] = []
    if initial_password:
        known_passwords.append(initial_password)
    known_passwords.append("aq4cp79d") # Default CTF clue password
    if base_stem not in known_passwords:
        known_passwords.append(base_stem)
    for p in COMMON_PASSWORDS:
        if p not in known_passwords:
            known_passwords.append(p)

    try:
        while current_layer <= max_layers:
            layer_dir = os.path.join(work_base, f"layer_{current_layer}")
            archive_name = os.path.basename(current_archive)
            print(f"[Layer {current_layer}] Unpacking '{archive_name}'...")

            # Also check zip comment for clues
            comment_hints = check_zip_comment_for_clues(current_archive)
            candidates = comment_hints + known_passwords

            success, used_pwd, extracted_files = extract_single_archive(current_archive, layer_dir, candidates)
            
            if not success:
                print(f"  [-] Failed to extract '{archive_name}' at Layer {current_layer}.")
                print(f"  [i] Passwords attempted: {candidates[:6]}")
                break

            pwd_disp = f"'{used_pwd}'" if used_pwd else "(None / Unencrypted)"
            print(f"  [+] Layer {current_layer} Extracted successfully! Password used: {pwd_disp}")
            if used_pwd:
                passwords_used_chain.append(used_pwd)

            # Analyze extracted folder for passwords and flags
            layer_passwords, layer_flags, all_layer_files = find_passwords_and_flags_in_folder(layer_dir)
            
            if layer_flags:
                for f in layer_flags:
                    all_discovered_flags.add(f)
                    print(f"  [FLAG] DISCOVERED in Layer {current_layer}: {f}")

            # Print extracted items summary
            relative_extracted = [os.path.relpath(f, layer_dir) for f in all_layer_files if os.path.isfile(f)]
            print(f"  [i] Files extracted ({len(relative_extracted)}): {', '.join(relative_extracted[:6])}")

            if layer_passwords:
                print(f"  [KEY] Discovered next password candidates: {layer_passwords}")

                # Insert newly found passwords at the top for next layer
                for p in reversed(layer_passwords):
                    if p not in known_passwords:
                        known_passwords.insert(0, p)
                    else:
                        known_passwords.remove(p)
                        known_passwords.insert(0, p)

            # Find next nested archive inside extracted files
            nested_archives = [f for f in all_layer_files if is_archive_file(f) and f != current_archive]
            
            if not nested_archives:
                print(f"\n[+] Innermost layer reached at Layer {current_layer}! No further nested archives.")
                break

            # Prioritize archive if there's one that matches next layer pattern
            nested_archives.sort(key=lambda x: (
                0 if 'layer' in os.path.basename(x).lower() or os.path.splitext(x)[1].lower() == '.zip' else 1,
                len(x)
            ))
            current_archive = nested_archives[0]
            current_layer += 1

        print(f"\n============================================================")
        print(f" [*] EXTRACTION SUMMARY:")
        print(f" Total Layers Unpacked : {current_layer}")
        print(f" Passwords Chain Used  : {' -> '.join(passwords_used_chain) if passwords_used_chain else 'None'}")
        if all_discovered_flags:
            print(f" [!] FINAL FLAGS DISCOVERED ({len(all_discovered_flags)}):")
            for flag in all_discovered_flags:
                print(f"  --> {flag}")
        else:
            print(f" [i] No standard flag format found in the unpacked files.")
            print(f" Check extracted files in: {work_base}")
        print(f"============================================================\n")

        return {
            "success": True,
            "layers_unpacked": current_layer,
            "passwords_used": passwords_used_chain,
            "flags": list(all_discovered_flags),
            "output_dir": work_base
        }

    finally:
        # We can keep work_base or clean it up if needed; let's keep it in temp for user inspection
        pass

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else 'scratch/matryoshka.zip'
    initial_pwd = sys.argv[2] if len(sys.argv) > 2 else 'aq4cp79d'
    solve_matryoshka_archive(target, initial_pwd)
