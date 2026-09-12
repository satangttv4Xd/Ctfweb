from PIL import Image
import re
import os

width, height = 450, 220
img = Image.new('RGB', (width, height), color=(10, 20, 35))

flag = "CTF{stego_lsb_quantum_cipher_318659}"
print(f"Embedding Flag: {flag}")

flag_bytes = flag.encode('utf-8')
binary_bits = "".join(f"{b:08b}" for b in flag_bytes)

pixels = list(img.getdata())
rgb_pixels = []
bit_idx = 0

for pixel in pixels:
    r, g, b = pixel
    if bit_idx < len(binary_bits):
        r = (r & ~1) | int(binary_bits[bit_idx]); bit_idx += 1
    if bit_idx < len(binary_bits):
        g = (g & ~1) | int(binary_bits[bit_idx]); bit_idx += 1
    if bit_idx < len(binary_bits):
        b = (b & ~1) | int(binary_bits[bit_idx]); bit_idx += 1
    rgb_pixels.append((r, g, b))

stego_img = Image.new('RGB', (width, height))
stego_img.putdata(rgb_pixels)

os.makedirs('example', exist_ok=True)
out_path = 'example/stego_quantum_318659.png'
stego_img.save(out_path)
print(f"Saved stego image to: {out_path}")

# Verify decoding
raw_check = list(stego_img.getdata())
extracted_bits = []
for p in raw_check:
    for c in range(3):
        extracted_bits.append(str(p[c] & 1))

extracted_bytes = bytearray([int("".join(extracted_bits[i:i+8]), 2) for i in range(0, len(extracted_bits), 8)])
decoded_text = extracted_bytes.decode('latin-1', errors='ignore')
matches = re.findall(r"CTF\{[A-Za-z0-9_-]+\}", decoded_text)
print(f"Verified Decoded Flags: {matches}")
