import type { ChallengePreset } from '../types';

export const CTF_PRESETS: ChallengePreset[] = [
  {
    id: 'web-sqli-jwt',
    title: 'Secret Portal (Web Exploitation)',
    titleThai: 'โจทย์เว็บ: ประตูมิติความลับ (SQLi & JWT None Algorithm)',
    category: 'Web',
    difficulty: 'Medium',
    descriptionThai: 'วิเคราะห์โค้ด backend Node.js/Express ที่มี endpoint เข้าสู่ระบบและตรวจสอบสิทธิ์ด้วย JWT Token',
    suggestedAgentIds: ['webx', 'cryptobreaker'],
    flagAnswer: 'flag{sql_un10n_and_jwt_n0n3_4lg0r1thm_byp4ss}',
    content: `[CHALLENGE TITLE: Secret Portal]
Target URL: http://portal.ctf.local:3000
Technology: Node.js Express + SQLite

Backend Source Code Snippet:
\`\`\`javascript
const express = require('express');
const sqlite3 = require('sqlite3');
const jwt = require('jsonwebtoken');
const app = express();
const db = new sqlite3.Database('./db.sqlite');

app.use(express.json());

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  // Query executed directly
  const query = \`SELECT id, username, role FROM users WHERE username = '\${username}' AND password = '\${password}'\`;
  
  db.get(query, (err, row) => {
    if (err || !row) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Signs JWT
    const token = jwt.sign({ user: row.username, role: row.role }, "super_secret_ctf_key_2026", { algorithm: 'HS256' });
    res.json({ token, role: row.role });
  });
});

app.get('/api/admin/flag', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ error: 'No token provided' });
  
  const token = authHeader.split(' ')[1];
  try {
    // Vulnerable decoding: accepts algorithm 'none'
    const decoded = jwt.decode(token);
    if (decoded && decoded.role === 'admin') {
      res.json({ flag: "flag{sql_un10n_and_jwt_n0n3_4lg0r1thm_byp4ss}" });
    } else {
      res.status(403).json({ error: 'Access denied: Requires admin' });
    }
  } catch(e) {
    res.status(500).json({ error: 'Token validation error' });
  }
});
\`\`\`

จงวิเคราะห์หาช่องโหว่ ขั้นตอนการเจาะระบบ (Exploit) และ Payload เพื่อดึง Flag ออกมา`
  },
  {
    id: 'crypto-multi-layer',
    title: 'Mysterious Cipher Stream (Cryptography)',
    titleThai: 'โจทย์ถอดรหัส: ลำดับชั้นการเข้ารหัสซ้อนหลายมิติ (Multi-layer Crypto)',
    category: 'Cryptography',
    difficulty: 'Easy',
    descriptionThai: 'ข้อความเข้ารหัสซ้อนกันหลายชั้น (ROT13 -> Hex -> Base64) พร้อมเงื่อนไขการแกะรหัส',
    suggestedAgentIds: ['cryptobreaker', 'puzzlemind'],
    flagAnswer: 'flag{cr7pt0_l4y3rs_p33l3d_succ3ssfully_2026}',
    content: `[CHALLENGE TITLE: Layer Cake]
We intercepted an encoded transmission from an underground hacker group.
The communication channel uses multi-layer encoding to evade basic IDS filters.

ENCODED CIPHERTEXT:
\`\`\`text
TTEzYVhwbWFYUTlhRFZsTlNBd1pXUnZabVpsYkd4bFlXNHdkVEV5TXpNeE5qYzFOalV5
\`\`\`

HINT FROM INTERCEPTOR:
- The outermost layer looks like standard Base64.
- Once decoded, inspect the character distribution.
- Can you peel the layers and retrieve the flag in format flag{...}?`
  },
  {
    id: 'stego-lsb-spec',
    title: 'Secret Shadow Image (Steganography)',
    titleThai: 'โจทย์สเตกานอกราฟี: ภาพลึกลับซ่อนข้อความ (PNG Chunks & LSB)',
    category: 'Steganography',
    difficulty: 'Medium',
    descriptionThai: 'วิเคราะห์โครงสร้างไฟล์ภาพ PNG และการซ่อนข้อมูลด้วย LSB ใน Red Channel พร้อม Metadata',
    suggestedAgentIds: ['steghunter', 'forensicx'],
    flagAnswer: 'flag{lsb_r3d_pl4n3_h1dd3n_m3ss4g3_f0und}',
    content: `[CHALLENGE TITLE: Mona Lisa's Whisper]
We acquired an innocent-looking 800x600 PNG image named "mona_whisper.png".
File size is slightly larger than expected: 1,489,120 bytes instead of typical 300KB.

Image Metadata (exiftool excerpt):
- File Type: PNG
- Image Width: 800
- Image Height: 600
- Bit Depth: 8
- Color Type: RGB with Alpha (RGBA)
- Comment (tEXt chunk): "Look into the least significant bit of the Red plane, starting at pixel (0,0) row-first."
- PNG Structure: Valid IHDR, multiple IDAT chunks, and non-standard data trailing after IEND.

Extracted Hex bytes from Red LSB stream:
\`\`\`hex
66 6c 61 67 7b 6c 73 62 5f 72 33 64 5f 70 6c 34 6e 33 5f 68 31 64 64 33 6e 5f 6d 33 73 73 34 67 33 5f 66 30 75 6e 64 7d
\`\`\`

จงวิเคราะห์เทคนิคที่ใช้และคำนวณถอดรหัสข้อความลับที่ซ่อนอยู่`
  },
  {
    id: 'rev-c-xor',
    title: 'Vault Key Validator (Reverse Engineering)',
    titleThai: 'โจทย์วิศวกรรมย้อนกลับ: ตรวจสอบรหัสผ่านตู้เซฟ (C Decompiled Logic)',
    category: 'Reverse Engineering',
    difficulty: 'Medium',
    descriptionThai: 'วิเคราะห์โค้ดฟังก์ชัน validate_flag() ในโปรแกรม C ที่ถูก Decompile จาก Ghidra',
    suggestedAgentIds: ['reveng', 'cryptobreaker'],
    flagAnswer: 'flag{r3v3rs3_x0r_k3y_m4st3r_99}',
    content: `[CHALLENGE TITLE: SafeCracker v2.1]
Target Architecture: Linux x86_64 ELF binary
Protections: NX enabled, PIE enabled, Canary enabled

Ghidra Decompiled Output of main() and check_password():
\`\`\`c
bool check_password(char *input) {
    size_t len = strlen(input);
    if (len != 31) {
        return false;
    }
    
    // Expected encrypted array
    unsigned char expected[31] = {
        0x35, 0x3f, 0x32, 0x34, 0x28, 0x21, 0x60, 0x25, 0x66, 0x21, 
        0x60, 0x0c, 0x2b, 0x63, 0x21, 0x0c, 0x38, 0x60, 0x2a, 0x0c, 
        0x3e, 0x67, 0x20, 0x27, 0x66, 0x21, 0x0c, 0x6a, 0x6a, 0x2e, 0x00
    };
    
    unsigned char xor_key = 0x53; // 'S'
    
    for (int i = 0; i < 30; i++) {
        if ((input[i] ^ xor_key) != expected[i]) {
            return false;
        }
    }
    return true;
}
\`\`\`

จงแกะการทำงานของอัลกอริทึมและย้อนกลับ (Reverse) ค่า expected array ด้วย XOR key เพื่อหาอินพุต Flag ที่ถูกต้อง`
  },
  {
    id: 'forensics-pcap-exif',
    title: 'Exfiltration Packet Capture (Forensics)',
    titleThai: 'โจทย์นิติวิทยาศาสตร์: ดักจับข้อมูลรั่วไหลในเครือข่าย (PCAP & DNS Tunneling)',
    category: 'Forensics',
    difficulty: 'Medium',
    descriptionThai: 'วิเคราะห์ไฟล์บันทึกการส่งข้อมูลผ่าน DNS Query Subdomains ที่ถูกแปลงเป็น Hex',
    suggestedAgentIds: ['forensicx', 'cryptobreaker', 'webx'],
    flagAnswer: 'flag{dns_c0v3rt_ch4nn3l_3xf1ltr4t10n}',
    content: `[CHALLENGE TITLE: Suspicious DNS Traffic]
SOC Analyst alerted on anomalous high-frequency DNS queries to an external nameserver (ns1.evil-corp.xyz).

Sample DNS Query Logs extracted from PCAP:
\`\`\`text
Timestamp: 2026-09-12 14:20:01 | Query: 666c61677b.data.evil-corp.xyz A
Timestamp: 2026-09-12 14:20:02 | Query: 646e735f63.data.evil-corp.xyz A
Timestamp: 2026-09-12 14:20:03 | Query: 3076337274.data.evil-corp.xyz A
Timestamp: 2026-09-12 14:20:04 | Query: 5f6368346e.data.evil-corp.xyz A
Timestamp: 2026-09-12 14:20:05 | Query: 6e336c5f33.data.evil-corp.xyz A
Timestamp: 2026-09-12 14:20:06 | Query: 7866316c74.data.evil-corp.xyz A
Timestamp: 2026-09-12 14:20:07 | Query: 7234743130.data.evil-corp.xyz A
Timestamp: 2026-09-12 14:20:08 | Query: 6e7d.data.evil-corp.xyz A
\`\`\`

จงวิเคราะห์ว่าข้อมูลใดถูกแอบส่งออกนอกองค์กรผ่าน DNS Tunneling และถอดรหัส Flag ออกมา`
  },
  {
    id: 'misc-brainfuck-puzzle',
    title: 'Esoteric Signal (Misc / Esoteric Language)',
    titleThai: 'โจทย์ปริศนาพิศวง: ภาษา Brainfuck ลึกลับ',
    category: 'Misc / Esoteric',
    difficulty: 'Easy',
    descriptionThai: 'โค้ดภาษา Brainfuck สั้นๆ ที่ทำงานพิมพ์ข้อความผลลัพธ์ออกมาเป็น Flag',
    suggestedAgentIds: ['puzzlemind', 'reveng'],
    flagAnswer: 'flag{bf_ok}',
    content: `[CHALLENGE TITLE: Ancient Compiler]
We recovered a punch tape containing 8 symbols repeatedly.
Can you execute or trace this esoteric logic to extract the flag?

CODE:
\`\`\`text
++++++++++[>+>+++>+++++++>++++++++++<<<<-]>>>++.>+.+++++++..+++.<<++.>+++++++++++++++.>.+++.------.--------.<<+.<.
\`\`\`

จงจำลองการทำงานและถอดค่าที่ได้ออกมาเป็นข้อความ Flag`
  },
  {
    id: 'mobile-apk-reversing',
    title: 'BankApp Insecure Secret (Mobile / Android APK)',
    titleThai: 'โจทย์โมบายล์: เจาะแอป Android ถอดรหัส Hardcoded Secret (APK Reverse)',
    category: 'Mobile / Android',
    difficulty: 'Medium',
    descriptionThai: 'วิเคราะห์โครงสร้างไฟล์ APK, AndroidManifest.xml และโค้ด Java/Smali ที่ Decompile ได้จาก classes.dex',
    suggestedAgentIds: ['mobilex', 'reveng', 'cryptobreaker'],
    flagAnswer: 'flag{andr01d_h4rdc0d3d_k3y_1n_sm4l1_2026}',
    content: `[CHALLENGE TITLE: SecureBank Mobile v1.0.apk]
Package: com.ctf.securebank
Target OS: Android 13 (API 33)
Decompiled via: JADX / Apktool

Extracted AndroidManifest.xml:
\`\`\`xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.ctf.securebank">
    <uses-permission android:name="android.permission.INTERNET" />
    <application android:allowBackup="true" android:label="SecureBank">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        <activity android:name=".FlagVaultActivity" android:exported="true" />
    </application>
</manifest>
\`\`\`

Decompiled Java from classes.dex (FlagVaultActivity.java):
\`\`\`java
package com.ctf.securebank;

import android.os.Bundle;
import android.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;

public class FlagVaultActivity extends AppCompatActivity {
    // Hidden key in string pool
    private static final String OBFUSCATED_KEY = "YW5kcm9pZF9zZWNyZXQx"; // Base64
    private static final byte[] ENCRYPTED_VAULT = new byte[]{
        -84, 115, 34, -45, -112, 59, 12, 88, -21, 102, -87, 44, -19, 73, -90, 110,
        -77, 85, 41, -50, -120, 48, 22, 94, -30, 115, -95, 33, -10, 81, -85, 121
    };

    public static String getFlag(String userPass) {
        try {
            byte[] keyBytes = Base64.decode(OBFUSCATED_KEY, Base64.DEFAULT); // 16 bytes: "android_secret1"
            SecretKeySpec key = new SecretKeySpec(keyBytes, "AES");
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, key);
            byte[] decrypted = cipher.doFinal(ENCRYPTED_VAULT);
            return new String(decrypted);
        } catch (Exception e) {
            return "Incorrect!";
        }
    }
}
\`\`\`

จงวิเคราะห์โครงสร้าง APK, ความปลอดภัยของ FlagVaultActivity (exported=true) และถอดรหัส AES เพื่อหาข้อความ Flag ออกมา`
  }
];
