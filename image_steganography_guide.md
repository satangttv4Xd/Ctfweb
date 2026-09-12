# 🚩 คู่มือและเทคนิคการค้นหา Flag จากรูปภาพ (CTF Image Steganography Guide)

คู่มือนี้สรุปขั้นตอนและเทคนิคมาตรฐานในการแกะหา **Flag ของจริงที่ซ่อนอยู่ในรูปภาพ** เพื่อใช้เป็นพิมพ์เขียว (Blueprint) ในการปรับแต่ง AI Agent (`StegHunter` / `ForensicX`) และการประมวลผลของระบบ

---

## 🛠️ 1. ขั้นตอนการตรวจสอบและสกัด Flag จากรูปภาพ (Step-by-Step Methodology)

```mermaid
flowchart TD
    A["📷 รูปภาพโจทย์ (PNG / JPG / BMP)"] --> B{"1. EXIF Metadata Inspection"}
    B -- พบ Flag --> Z["🚩 ได้รับ Flag"]
    B -- ไม่พบ --> C{"2. Check Appended Data (EOF Marker)"}
    C -- พบ Zip / Hidden File --> Z
    C -- ไม่พบ --> D{"3. LSB (Least Significant Bit) Analysis"}
    D -- พบ Text Stream --> Z
    D -- ไม่พบ --> E{"4. Steghide / Passphrase Extraction"}
    E -- พบ Flag --> Z
    E -- ไม่พบ --> F{"5. Bit Plane & Color Channel Inspection"}
    F -- พบ Visual Flag --> Z
    F -- ไม่พบ --> G["❌ ภาพปกติ ไม่พบ Flag (Clean Image)"]
```

---

## 🔬 2. รายละเอียดแต่ละเทคนิค (Techniques Breakdown)

### เทคนิคที่ 1: EXIF Metadata & Chunk Analysis
- **หลักการ:** ซ่อนข้อความไว้ในแอตทริบิวต์ของภาพ เช่น `UserComment`, `Artist`, `Copyright`, `Software` หรือ Chunk พิเศษของ PNG (`tEXt`, `zTXt`)
- **คำสั่ง / โค้ดสำหรับสกัด:**
  ```bash
  # ตรวจสอบ EXIF ทั้งหมด
  exiftool challenge.png

  # สกัดสตริงก์ข้อความจากไฟล์ภาพ
  strings -n 6 challenge.jpg | grep -iE "flag|ctf|\{"
  ```
- **การสอน AI:** สั่งให้ Agent อ่าน `EXIF` และ `tEXt` chunks ทุกครั้งก่อนวิเคราะห์พิกเซล

---

### เทคนิคที่ 2: Check Appended Data (Carving / EOF Hiding)
- **หลักการ:** ต่อท้ายไฟล์ภาพด้วยไฟล์ซิป หรือข้อความลับหลังจุดสิ้นสุดของภาพ (EOF Marker)
  - PNG EOF: `49 45 4E 44 AE 42 60 82` (`IEND`)
  - JPEG EOF: `FF D9`
- **คำสั่ง / โค้ดสำหรับสกัด:**
  ```bash
  # สแกนหาไฟล์ที่ซ่อนอยู่ภายในภาพ (เช่น ZIP, TAR, ELF)
  binwalk -e challenge.png

  # สกัดด้วย foremost
  foremost -i challenge.jpg
  ```
- **การสอน AI:** สั่งให้ Agent ตรวจสอบขนาดไฟล์เทียบกับความยาวปกติ หากมีข้อมูลเกินหลัง EOF ให้สกัดไฟล์ที่ซ่อนออกมา

---

### เทคนิคที่ 3: LSB (Least Significant Bit) Steganography
- **หลักการ:** ซ่อนบิตข้อความไว้ที่ Bit 0 (บิตที่มีนัยสำคัญน้อยที่สุด) ของช่องสี Red, Green, Blue หรือ Alpha
- **คำสั่ง / โค้ดสำหรับสกัด:**
  ```bash
  # ใช้ zsteg สำหรับไฟล์ PNG/BMP
  zsteg -a challenge.png

  # สกัด LSB ด้วย Python
  python3 -c "
  from PIL import Image
  img = Image.open('challenge.png')
  pixels = list(img.getdata())
  binary = ''.join([str(p[0] & 1) for p in pixels])
  bytes_data = [int(binary[i:i+8], 2) for i in range(0, len(binary), 8)]
  print(''.join([chr(b) for b in bytes_data if 32 <= b <= 126]))
  "
  ```
- **การสอน AI:** สั่งให้ Agent สแกน LSB ในลำดับ RGB, BGR, Alpha และเปลี่ยนทิศทาง Row-first / Column-first

---

### เทคนิคที่ 4: Steghide (JPEG / BMP Encryption)
- **หลักการ:** เข้ารหัสข้อความและซ่อนไว้ในไฟล์ JPEG/BMP โดยใช้รหัสผ่าน (Passphrase)
- **คำสั่ง / โค้ดสำหรับสกัด:**
  ```bash
  # สกัดด้วยรหัสผ่านว่าง (Empty Password)
  steghide extract -sf challenge.jpg -p ""

  # Brute-force รหัสผ่านด้วย stegseek / stegcracker
  stegseek challenge.jpg rockyou.txt
  ```
- **การสอน AI:** สั่งให้ Agent ทดลองรหัสผ่านว่าง `""`, `123456`, `password` หรือใช้ชื่อไฟล์เป็นรหัสผ่าน

---

### เทคนิคที่ 5: Bit Plane & Color Channel Visual Inspection
- **หลักการ:** ซ่อนข้อความหรือ QR Code ไว้ในระนาบบิตเฉพาะ (เช่น Red Plane 0, Green Plane 0) หรือปรับความสว่าง/ความต่างสี (Brightness/Contrast)
- **คำสั่ง / โค้ดสำหรับสกัด:**
  - สลับระนาบสีด้วย **StegSolve** (Red Plane 0, Green Plane 0, Blue Plane 0, Random Color Map)
  - หรือใช้ Python (Pillow / OpenCV):
  ```python
  from PIL import Image

  img = Image.open('challenge.png')
  r, g, b = img.split()
  # ดึง Red Plane 0
  r_bit0 = r.point(lambda p: (p & 1) * 255)
  r_bit0.save('red_bit0.png')
  ```
- **การสอน AI:** หากใช้โมเดล Vision (เช่น Gemini Multimodal) สั่งให้ทำ Image Processing สกัด Bit Plane 0 และส่งภาพ Bit Plane เข้าสู่ Vision OCR เพื่ออ่านข้อความ Flag

---

## 🤖 3. ข้อความตัวอย่างสำหรับสั่งให้ AI Agent ทำงานและแกะ Flag (Prompt Template)

สามารถนำ Prompt นี้ไปใช้ใน `StegHunter` หรือระบบ AI เพื่อให้แกะหา Flag ในรูปภาพได้อย่างแม่นยำ:

```text
[SYSTEM INSTRUCTION FOR STEGANOGRAPHY ANALYSIS]
You are a World-Class Steganography Specialist. When provided with an image:

1. METADATA SCAN: Inspect EXIF data, tEXt chunks, comments, and strings.
2. EOF CHECK: Check for appended files or data after PNG IEND (49 45 4E 44 AE 42 60 82) or JPEG EOI (FF D9).
3. LSB EXTRACTION: Perform LSB bit plane extraction on Red, Green, Blue, Alpha channels (Bit 0).
4. STEGHIDE TRY: Test steghide extraction with empty password "".
5. VISUAL INSPECTION: Inspect Red/Green/Blue Bit Plane 0 for hidden text or QR codes.

CRITICAL ACCURACY RULE:
- If a valid flag string (e.g. flag{...}, CTF{...}) is found, return it under Primary Flag.
- If NO hidden flag or payload is found after all checks, report: "[ไม่พบข้อมูล Flag ในรูปภาพนี้]" with 0% confidence.
- NEVER fabricate, invent, or output dummy/placeholder flags.
```
