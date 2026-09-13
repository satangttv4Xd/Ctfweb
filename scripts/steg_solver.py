import os
import sys
import re

if sys.platform == 'win32':
    try:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        if hasattr(sys.stderr, 'reconfigure'):
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

try:
    from PIL import Image
except ImportError:
    Image = None

from archive_solver import solve_matryoshka_archive, is_archive_file

def find_flag_in_image(image_path):
    print(f"\n==========================================")
    print(f" [*] AUTOMATED CTF IMAGE STEGO SOLVER")
    print(f" File: {image_path}")
    print(f"==========================================\n")

    if not os.path.exists(image_path):
        print(f"[-] Error: File '{image_path}' not found.")
        return

    found_flags = set()
    # Strict Flag Regex: must have 3+ valid chars inside {...}
    flag_regex = r'(flag\{[A-Za-z0-9_\-]{3,80}\}|ctf\{[A-Za-z0-9_\-]{3,80}\}|ELEC\{[A-Za-z0-9_\-]{3,80}\}|[a-zA-Z0-9_-]{3,15}\{[A-Za-z0-9_\-]{3,80}\})'

    # --- 1. Raw Binary & String Regex Search ---
    print("[1/5] Checking Raw Bytes & Metadata Strings...")
    with open(image_path, 'rb') as f:
        data = f.read()

    text = data.decode('latin-1', errors='ignore')
    raw_matches = re.findall(flag_regex, text, re.IGNORECASE)
    for m in raw_matches:
        if len(m) < 80 and all(ord(c) < 128 for c in m):
            found_flags.add(m)
            print(f"  [+] Raw String Match Found: {m}")

    # --- 2. EXIF Metadata Inspection ---
    print("\n[2/5] Inspecting EXIF Metadata & PNG Chunks...")
    if Image:
        try:
            img = Image.open(image_path)
            print(f"  Format: {img.format}, Size: {img.size}, Mode: {img.mode}")
            if img.info:
                for k, v in img.info.items():
                    v_str = str(v)
                    print(f"  Metadata [{k}]: {v_str[:120]}")
                    matches = re.findall(flag_regex, v_str, re.IGNORECASE)
                    for m in matches:
                        found_flags.add(m)
                        print(f"  [+] EXIF Flag Found: {m}")
        except Exception as e:
            print(f"  PIL Warning: {e}")

    # --- 3. EOF Appended Data Check ---
    print("\n[3/5] Checking Appended Data (EOF Markers)...")
    if image_path.lower().endswith('.png'):
        iend_pos = data.find(b'IEND')
        if iend_pos != -1 and iend_pos + 8 < len(data):
            extra = data[iend_pos + 8:]
            print(f"  [!] Detected {len(extra)} bytes appended after PNG IEND marker!")
            extra_text = extra.decode('latin-1', errors='ignore')
            matches = re.findall(flag_regex, extra_text, re.IGNORECASE)
            for m in matches:
                found_flags.add(m)
                print(f"  [+] Appended Data Flag Found: {m}")
    elif image_path.lower().endswith(('.jpg', '.jpeg')):
        eoi_pos = data.rfind(b'\xff\xd9')
        if eoi_pos != -1 and eoi_pos + 2 < len(data):
            extra = data[eoi_pos + 2:]
            print(f"  [!] Detected {len(extra)} bytes appended after JPEG EOI marker!")
            extra_text = extra.decode('latin-1', errors='ignore')
            matches = re.findall(flag_regex, extra_text, re.IGNORECASE)
            for m in matches:
                found_flags.add(m)
                print(f"  [+] Appended Data Flag Found: {m}")

    # --- 4. LSB Bit Plane Analysis (PNG / BMP Lossless formats only) ---
    print("\n[4/5] Running LSB (Least Significant Bit) Bit Plane Analysis...")
    if image_path.lower().endswith(('.png', '.bmp')) and Image:
        try:
            img = Image.open(image_path)
            if img.mode in ('RGB', 'RGBA'):
                pixels = list(img.get_flattened_data() if hasattr(img, 'get_flattened_data') else img.getdata())
                for channel_idx, channel_name in enumerate(['Red', 'Green', 'Blue']):
                    bits = [str(p[channel_idx] & 1) for p in (pixels if isinstance(pixels[0], (tuple, list)) else [pixels[i:i+3] for i in range(0, len(pixels), 3)])]
                    bit_str = ''.join(bits)
                    
                    byte_arr = bytearray()
                    for i in range(0, len(bit_str), 8):
                        b = int(bit_str[i:i+8], 2)
                        byte_arr.append(b)
                    
                    lsb_text = byte_arr.decode('latin-1', errors='ignore')
                    matches = re.findall(flag_regex, lsb_text, re.IGNORECASE)
                    for m in matches:
                        if len(m) < 80 and all(ord(c) < 128 for c in m):
                            found_flags.add(m)
                            print(f"  [+] LSB {channel_name} Channel Flag Found: {m}")
        except Exception as e:
            print(f"  LSB Warning: {e}")
    else:
        print("  [i] Skipping Pixel LSB on JPEG (JPEG uses lossy DCT compression, pixel LSB is invalid).")

    # --- 5. Summary & Results ---
    print("\n==========================================")
    if found_flags:
        print(" [!] FINAL FLAGS DISCOVERED:")
        for flag in found_flags:
            print(f"  --> {flag}")
    else:
        print(" [i] RESULT: No Flag Found in this image (Clean Image)")
    print("==========================================\n")

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else 'scratch/matryoshka.zip'
    initial_pwd = sys.argv[2] if len(sys.argv) > 2 else 'aq4cp79d'

    if is_archive_file(target):
        solve_matryoshka_archive(target, initial_password=initial_pwd)
    else:
        find_flag_in_image(target)

