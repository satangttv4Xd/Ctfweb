import type { AgentId } from '../types';

export interface OpenRouterCallOptions {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  imageBase64?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export async function callOpenRouter(options: OpenRouterCallOptions): Promise<string> {
  const { apiKey, model, systemPrompt, userPrompt, imageBase64, temperature = 0.2, maxTokens = 4000, signal } = options;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('กรุณากรอก OpenRouter API Key ในหน้าการตั้งค่า หรือเปิด "โหมดจำลองสถานการณ์ (Simulation Mode)" เพื่อทดลองใช้งาน');
  }

  // Handle multimodal content if image is provided
  type MessageContent = string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  let userMessageContent: MessageContent = userPrompt;

  if (imageBase64) {
    userMessageContent = [
      { type: 'text', text: userPrompt || 'วิเคราะห์ข้อมูลและภาพนี้เพื่อค้นหา Flag สำหรับการแข่งขัน CTF:' },
      {
        type: 'image_url',
        image_url: {
          url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`
        }
      }
    ];
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ctf-swarm-ai.local',
      'X-Title': 'CTF Swarm AI'
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userMessageContent
        }
      ]
    })
  });

  if (!response.ok) {
    let errorMsg = `OpenRouter API Error (${response.status} ${response.statusText})`;
    try {
      const errData = await response.json();
      if (errData?.error?.message) {
        errorMsg = `OpenRouter: ${errData.error.message}`;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('ไม่พบข้อมูลตอบกลับ (Empty completion choices returned by model)');
  }

  return content;
}

/**
 * Verify OpenRouter API Key
 */
export async function testOpenRouterKey(apiKey: string): Promise<{ valid: boolean; label?: string; usage?: number; limit?: number; error?: string }> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`
      }
    });

    if (!res.ok) {
      return { valid: false, error: `รหัส API Key ไม่ถูกต้อง หรือหมดอายุ (Status ${res.status})` };
    }

    const data = await res.json();
    return {
      valid: true,
      label: data?.data?.label || 'Active Key',
      usage: data?.data?.usage,
      limit: data?.data?.limit
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { valid: false, error: `ไม่สามารถเชื่อมต่อไปยัง OpenRouter ได้: ${message}` };
  }
}

/**
 * Realistic Simulation / Mock Generator when testing without API key
 */
export async function simulateAgentResponse(agentId: AgentId, challengeInput: string): Promise<string> {
  // Simulate natural delay (600ms - 1800ms)
  const delay = Math.floor(Math.random() * 1000) + 700;
  await new Promise(r => setTimeout(r, delay));

  const lowerInput = challengeInput.toLowerCase();

  const hasDetectedFlag = Boolean(
    challengeInput.match(/(?:flag|ctf|elec|picoctf)[a-z0-9_-]*\{[A-Za-z0-9_\-!@#$%^&*()+=~]{3,100}\}/i) ||
    lowerInput.includes('matryoshka') ||
    lowerInput.includes('layer_20') ||
    lowerInput.includes('20 ชั้น') ||
    lowerInput.includes('aq4cp79d') ||
    lowerInput.includes('layer cake') ||
    lowerInput.includes('safecracker') ||
    lowerInput.includes('mona')
  );

  const isNoFlag = !hasDetectedFlag && (
    lowerInput.includes('ไม่มีข้อมูลของ flag ในไฟล์นี้') ||
    lowerInput.includes('ไม่พบข้อมูล flag ในรูปภาพ/ไฟล์นี้') ||
    lowerInput.includes('flag status: ℹ️ ไม่มีข้อมูลของ flag')
  );

  // Flag Assembler synthesis simulation
  if (agentId === 'flagassembler') {
    let detectedFlag: string | null = null;
    let challengeType = 'General File / Image Analysis';

    // Scan for any extracted flag candidates in the prompt/file context FIRST
    const inputFlagMatch = challengeInput.match(/(?:flag|ctf|elec|picoctf)[a-z0-9_-]*\{[A-Za-z0-9_\-!@#$%^&*()+=~./?]{3,100}\}/gi);
    if (inputFlagMatch && inputFlagMatch.length > 0) {
      detectedFlag = inputFlagMatch[0];
      challengeType = 'Extracted Flag Analysis';
    } else if (lowerInput.includes('layer cake') || (lowerInput.includes('base64') && lowerInput.includes('crypto'))) {
      detectedFlag = 'flag{cr7pt0_l4y3rs_p33l3d_succ3ssfully_2026}';
      challengeType = 'Multi-layer Cryptography';
    } else if (lowerInput.includes('mona') || lowerInput.includes('lsb') || lowerInput.includes('red plane')) {
      detectedFlag = 'flag{lsb_r3d_pl4n3_h1dd3n_m3ss4g3_f0und}';
      challengeType = 'Image Steganography';
    } else if (lowerInput.includes('safecracker') || lowerInput.includes('xor_key')) {
      detectedFlag = 'flag{r3v3rs3_x0r_k3y_m4st3r_99}';
      challengeType = 'Reverse Engineering';
    } else if (lowerInput.includes('dns') || lowerInput.includes('pcap')) {
      detectedFlag = 'flag{dns_c0v3rt_ch4nn3l_3xf1ltr4t10n}';
      challengeType = 'Network & Protocol Forensics';
    } else if (lowerInput.includes('brainfuck') || lowerInput.includes('+++++')) {
      detectedFlag = 'flag{bf_ok}';
      challengeType = 'Esoteric Language';
    } else if (lowerInput.includes('sql') || lowerInput.includes('jwt')) {
      detectedFlag = 'flag{sql_un10n_and_jwt_n0n3_4lg0r1thm_byp4ss}';
    } else if (lowerInput.includes('matryoshka') || lowerInput.includes('layer_20') || lowerInput.includes('20 ชั้น') || lowerInput.includes('ชั้นในสุด') || lowerInput.includes('aq4cp79d')) {
      detectedFlag = 'flag{m4try0shk4_20_l4y3rs_z1p_cr4ck3d_succ3ssfu11y}';
      challengeType = 'Forensics / Nested Matryoshka Archive Unpacking';
    }

    if (!detectedFlag) {
      return `### ℹ️ FLAG REPORT — ไม่พบข้อมูล Flag ในรูปภาพ/ไฟล์นี้

**Challenge / File Type**: General Image / Non-flag File (รูปภาพทั่วไป / ไม่พบ Flag ซ่อนอยู่)

**Primary Flag**:
\`\`\`
[ไม่พบข้อมูล Flag ในรูปภาพ/ไฟล์นี้]
\`\`\`
**Confidence**: 0%

**Alternative Candidates**:
- ไม่พบสตริงก์หรือข้อมูลที่เข้าข่าย Flag (เช่น flag{...}, ctf{...}) ในรูปภาพ/ไฟล์นี้

**Solution Summary & ข้อมูลผลการตรวจสอบ**:
จากการสแกนและตรวจสอบโครงสร้างไฟล์ดิบ, Bit planes, EXIF Metadata และ LSB Data Stream:
1. **สถานะ Flag**: ไม่พบสตริงก์ Flag ซ่อนอยู่ในภาพหรือไฟล์นี้
2. **การวิเคราะห์รูปภาพ/ไฟล์**: เป็นรูปภาพหรือไฟล์ทั่วไปที่ไม่มี Payload หรือข้อความความลับซ่อนอยู่ (Clean File)
3. **การตรวจสอบเพิ่มเติม**: สแกน Bit planes 0-7, Red/Green/Blue planes และ Strings ไม่พบข้อมูลผิดปกติ

**Agent Contributions**:
| Agent | Finding | Useful? |
|-------|---------|---------|
| StegHunter | ตรวจสอบ Bit plane, LSB และ EXIF Metadata | ⚠️ ไม่พบ Flag ซ่อนอยู่ |
| ForensicX | ตรวจสอบ Header, Magic Bytes และ SHA-256 | ✅ |
| CryptoBreaker | สแกนหาค่าคีย์และการเข้ารหัสที่ซ่อนอยู่ | ⚠️ ไม่พบ Flag |

**Recommendations**:
- ตรวจสอบว่ารูปภาพที่แนบเป็นรูปภาพโจทย์ CTF ที่ถูกต้องหรือไม่
- หากเป็นรูปภาพโจทย์ที่มีรหัสผ่านซ่อน (Steghide) ให้ระบุคำใบ้หรือรหัสผ่านเพิ่มเติมในกล่องรายละเอียดโจทย์`;
    }

    return `### 🏴 FLAG REPORT

**Challenge Type**: ${challengeType}

**Primary Flag**:
\`\`\`
${detectedFlag}
\`\`\`
**Confidence**: 98%

**Alternative Candidates**:
1. \`${detectedFlag.toUpperCase()}\` — Case variation check — 40%

**Solution Summary**:
จากการประมวลผลและเชื่อมโยงผลการวิเคราะห์ร่วมกันของ Specialist Agents พบว่า:
1. Agent ฝ่ายเทคนิคค้นพบช่องโหว่และรูปแบบการเข้ารหัส/ความผิดปกติในโจทย์อย่างชัดเจน
2. ผลลัพธ์จากการ Decrypt / Exploit ถูกแปลงค่ากลับมาเป็นรูปแบบ ASCII มาตรฐาน
3. โครงสร้าง Flag ตรงตามเงื่อนไขที่โจทย์กำหนดทุกประการ พร้อมค่าตรวจสอบ Integrity

**Agent Contributions**:
| Agent | Finding | Useful? |
|-------|---------|---------|
| WebX | วิเคราะห์ API endpoint และ JWT algorithm | ✅ |
| CryptoBreaker | ถอดรหัส Base64, Hex และคำนวณ XOR inverse | ✅ |
| StegHunter | ตรวจสอบ Bit plane และ LSB data stream | ✅ |
| RevEng | Reverse อัลกอริทึมการคำนวณและค่า Key | ✅ |
| ForensicX | แกะ Magic bytes และ Timeline การรั่วไหล | ✅ |
| PuzzleMind | แปลงข้อความสัญลักษณ์และโครงสร้างภาษาพิเศษ | ✅ |

**Recommendations**:
- นำ Flag ข้างต้นไปส่งในระบบเพื่อรับคะแนน
- หากเป็นระบบที่มี Case-sensitive ให้ส่งตามตัวอักษรพิมพ์เล็กตรงตามรูปแบบมาตรฐาน`;
  }

  // If general file / no flag detected, return realistic forensic breakdown of internal content
  if (isNoFlag) {
    switch (agentId) {
      case 'mobilex':
        return `**[MOBILE FORENSIC ANALYSIS]**
- ตรวจสอบโครงสร้างแพ็กเกจ Android APK
- สถานะ Flag: **ไม่มีข้อมูลของ Flag ในสตริงก์โดยตรงของไฟล์นี้** (ไม่พบฮาร์ดโค้ดสตริงก์ Flag มาตรฐาน)
- ข้อมูลโครงสร้างภายในที่พบ:
  * โครงสร้าง Archive: classes.dex, AndroidManifest.xml และโฟลเดอร์ res/
  * สิทธิ์และแพ็กเกจ: ตรวจพบรายการ Permissions และ Package Name ตามรายละเอียดที่ระบุ
- คำแนะนำ: หากเป็นโจทย์ CTF Mobile Reverse Engineering ตัว Flag มักถูกสร้างขึ้นจากการกดปุ่ม (Button OnClick) หรือเข้ารหัส AES/XOR ไว้ในโค้ด ต้องทำการ Decompile dex เพื่อแกะ Logic ต่อไป`;
      case 'forensicx':
        return `**[FILE FORENSIC INSPECTION]**
- ตรวจสอบ Header, Magic Bytes และโครงสร้างไฟล์ดิบ
- สถานะ Flag: **ไม่มีข้อมูลของ Flag ในไฟล์นี้**
- ข้อมูลโครงสร้างภายในที่พบ:
  * ความสมบูรณ์ของไฟล์: Magic Bytes และ SHA-256 ถูกต้องตามมาตรฐาน
  * สกัดสตริงก์และ Hex Header เรียบร้อยแล้ว (สามารถเปิดดูได้ในแท็บเนื้อหาและ Hex Dump)
- สรุป: เป็นไฟล์ข้อมูลทั่วไปหรือ Binary ที่ไม่มี Plaintext Flag ฝังอยู่`;
      case 'reveng':
        return `**[REVERSE ENGINEERING TRIAGE]**
- ตรวจสอบสัญลักษณ์และโครงสร้างโค้ด
- สถานะ Flag: **ไม่มีข้อมูลของ Flag ในสตริงก์โดยตรงของไฟล์นี้**
- ข้อมูลโครงสร้างภายใน:
  * ไม่พบสตริงก์รูปแบบ \`flag{...}\` แบบ Hardcoded
  * รายชื่อฟังก์ชันและคำสั่งภายในไฟล์ได้รับการสกัดออกมาตรวจสอบแล้ว
- คำแนะนำ: ทำการวิเคราะห์ Disassembly / Decompilation เพื่อดู Control Flow กิจกรรมการตรวจสอบ Input`;
      default:
        return `**[SPECIALIST AGENT FINDINGS]**
- สถานะ Flag: **ไม่มีข้อมูลของ Flag ในไฟล์นี้**
- ข้อมูลภายใน: ได้ทำการตรวจสอบข้อความ สัญลักษณ์ และข้อมูลไบนารีแล้ว ยืนยันเป็นไฟล์ทั่วไปหรือโจทย์ที่ต้องรันการประมวลผลต่อ`;
    }
  }

  // Specialized agent mock responses
  switch (agentId) {
    case 'webx':
      return `**[ANALYSIS]**
- ตรวจพบเป้าหมายเป็น Node.js Express ร่วมกับ SQLite
- Endpoint \`/api/login\` มีการต่อ String SQL query โดยตรง ทำให้เกิด SQL Injection ชัดเจน
- Endpoint \`/api/admin/flag\` ใช้ \`jwt.decode()\` โดยไม่ได้ verify signature ทำให้สามารถใช้ None Algorithm Attack หรือสวมรอย role admin ได้

**[VULNERABILITY]**
- SQL Injection (High severity, CVSS 9.1): Direct string concatenation in SQL queries
- Broken Authentication & Insecure JWT Validation (Critical severity): Unverified JWT decode allows arbitrary payload modification

**[EXPLOIT]**
1. เจาะระบบบายพาส Login:
   \`\`\`json
   { "username": "admin' OR 1=1--", "password": "any" }
   \`\`\`
2. หรือสร้าง JWT Token ปลอมแปลงด้วย None algorithm:
   Header: \`{"alg":"none","typ":"JWT"}\` -> \`eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0\`
   Payload: \`{"user":"admin","role":"admin"}\` -> \`eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4ifQ\`
   Token: \`eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4ifQ.\`

**[FLAG]**
\`flag{sql_un10n_and_jwt_n0n3_4lg0r1thm_byp4ss}\`

**[CONFIDENCE]**
98%`;

    case 'cryptobreaker':
      if (lowerInput.includes('matryoshka') || lowerInput.includes('layer_20') || lowerInput.includes('20 ชั้น') || lowerInput.includes('aq4cp79d')) {
        return `**[CRYPTOGRAPHIC ARCHIVE UNPACKING]**
- ประเภทการเข้ารหัส: ZipCrypto Traditional PKZIP Encryption
- การวิเคราะห์คีย์: คีย์ถูกส่งต่อเป็นลูกโซ่ในแต่ละชั้น (Chained Passwords in \`note.txt\`)
- การประมวลผล: ระบบรัน Recursive Extraction Engine ปลดล็อคครบ 20 ชั้นสำเร็จ
- ผลลัพธ์ Plaintext:
  \`flag{m4try0shk4_20_l4y3rs_z1p_cr4ck3d_succ3ssfu11y}\`

**[FLAG]**
\`flag{m4try0shk4_20_l4y3rs_z1p_cr4ck3d_succ3ssfu11y}\`

**[CONFIDENCE]**
100%`;
      }
      return `**[IDENTIFICATION]**
ตรวจพบการเข้ารหัสแบบ Multi-layer Encoding:
- Layer 1: Base64 String
- Layer 2: Hex Encoded Stream
- Layer 3: ROT13 / Plaintext

**[ANALYSIS]**
- ความยาวสตริงสอดคล้องกับ Base64 (padding '=')
- เมื่อถอด Base64 รอบแรกได้ Hex sequence: \`66 6c 61 67 7b ...\`
- แปลง Hex bytes กลับเป็น ASCII string พบรูปแบบ \`flag{...}\` โดยตรง

**[DECRYPTION STEPS]**
1. \`base64 -d\` บนข้อความเริ่มต้น
2. \`xxd -r -p\` หรือ Hex to ASCII decoding
3. ข้อความที่ได้จัดรูปแบบเป็น Flag สมบูรณ์

**[DECODED/DECRYPTED]**
Plaintext result: \`flag{cr7pt0_l4y3rs_p33l3d_succ3ssfully_2026}\`

**[FLAG]**
\`flag{cr7pt0_l4y3rs_p33l3d_succ3ssfully_2026}\`

**[CONFIDENCE]**
100%`;

    case 'steghunter':
      return `**[VISUAL ANALYSIS]**
- ไฟล์ภาพโครงสร้าง PNG 800x600 ขนาด 1.48 MB (มีขนาดใหญ่กว่าปกติสำหรับภาพความละเอียดนี้)
- มีการระบุคำใบ้ใน Metadata tEXt chunk ชัดเจนเกี่ยวกับ Red Plane LSB

**[TECHNIQUE DETECTED]**
- LSB (Least Significant Bit) Steganography ใน Red Channel
- ข้อมูลเริ่มต้นจัดเรียงแบบ Row-first เริ่มต้นที่พิกเซล (0,0)

**[EXTRACTION METHOD]**
คำสั่งสำหรับดึงข้อมูล:
\`\`\`bash
zsteg -a image.png
# หรือใช้ Python PIL:
# bits = [r & 1 for r, g, b, a in img.getdata()]
\`\`\`

**[HIDDEN DATA]**
Hex stream: \`666c61677b6c73625f7233645f706c346e335f68316464336e5f6d3373733467335f6630756e647d\`
ถอดเป็นข้อความ: \`flag{lsb_r3d_pl4n3_h1dd3n_m3ss4g3_f0und}\`

**[FLAG]**
\`flag{lsb_r3d_pl4n3_h1dd3n_m3ss4g3_f0und}\`

**[CONFIDENCE]**
96%`;

    case 'reveng':
      return `**[BINARY INFO]**
- Architecture: Linux x86_64 ELF
- Protections: Canary: Yes | NX: Yes | PIE: Yes
- ฟังก์ชันเป้าหมาย: \`check_password()\` ความยาวสตริง 31 ตัวอักษร

**[KEY FUNCTIONS]**
- ฟังก์ชันทำ Single-byte XOR ระหว่าง \`input[i]\` กับคงที่ \`0x53\` ('S')
- ตรวจสอบค่ากับอาเรย์ \`expected[31]\`

**[ALGORITHM]**
- อัลกอริทึมสมมาตร: \`input[i] = expected[i] ^ 0x53\`

**[SOLUTION]**
\`\`\`python
expected = [
    0x35, 0x3f, 0x32, 0x34, 0x28, 0x21, 0x60, 0x25, 0x66, 0x21, 
    0x60, 0x0c, 0x2b, 0x63, 0x21, 0x0c, 0x38, 0x60, 0x2a, 0x0c, 
    0x3e, 0x67, 0x20, 0x27, 0x66, 0x21, 0x0c, 0x6a, 0x6a, 0x2e
]
flag = ''.join(chr(b ^ 0x53) for b in expected)
print(flag)
\`\`\`

**[FLAG]**
\`flag{r3v3rs3_x0r_k3y_m4st3r_99}\`

**[CONFIDENCE]**
100%`;

    case 'forensicx':
      if (lowerInput.includes('matryoshka') || lowerInput.includes('layer_20') || lowerInput.includes('20 ชั้น') || lowerInput.includes('aq4cp79d')) {
        return `**[RECURSIVE ARCHIVE FORENSIC ANALYSIS]**
- ตรวจสอบไฟล์เป้าหมาย: **matryoshka.zip** (โครงสร้าง Nested Archive ซ้อน 20 ชั้น)
- ผลการ Unpack: ถอดรหัสแตกไฟล์ผ่านระบบ Recursive Unpack Engine สำเร็จครบ 20 ชั้น
- ห่วงโซ่รหัสผ่าน (Password Chain): \`aq4cp79d\` -> อ่าน note.txt แต่ละชั้นตามลำดับ -> ปลดล็อคชั้นที่ 20
- ไฟล์ในชั้นในสุด (Layer 20): \`flag.txt\`
- **FLAG FOUND**: \`flag{m4try0shk4_20_l4y3rs_z1p_cr4ck3d_succ3ssfu11y}\`

**[CONFIDENCE]**
100%`;
      }
      return `**[FILE ANALYSIS]**
- ตรวจพบไฟล์การบันทึกทราฟฟิก PCAP / DNS Tunneling Exfiltration
- Subdomain ทุกรายการลงท้ายด้วย \`.data.evil-corp.xyz\` โดยมี Hex payload อยู่ส่วนหน้า

**[FINDINGS]**
- ทราฟฟิกถูกแบ่งออกเป็นชิ้นส่วน (Chunks) ส่งเรียงตาม Timestamp
- นำ Hex หน้า Subdomain มารวมกัน:
  \`666c61677b646e735f6330763372745f6368346e6e336c5f337866316c7472347431306e7d\`

**[EXTRACTION]**
1. สกัด Subdomain ด้วย tshark:
   \`tshark -r capture.pcap -Y "dns.flags.response == 0" -T fields -e dns.qry.name\`
2. ตัดเฉพาะ Hex prefix แล้ว Decode เป็น ASCII

**[EVIDENCE]**
- Data exfiltration ยืนยันสมบูรณ์ ข้อมูลที่สกัดได้คือข้อความ Flag

**[FLAG]**
\`flag{dns_c0v3rt_ch4nn3l_3xf1ltr4t10n}\`

**[CONFIDENCE]**
95%`;

    case 'pwnmaster':
      return `**[BINARY PROTECTIONS]**
- Arch: x86_64
- CANARY: Yes
- NX: Yes
- PIE: No (Fixed addresses)
- RELRO: Partial

**[VULNERABILITY]**
- Buffer overflow / Format String leak ในฟังก์ชันรับอินพุต
- สามารถ leak Canary และ libc base ได้

**[EXPLOIT STRATEGY]**
1. ส่ง payload format string \`%15$p\` เพื่อ leak stack canary
2. คำนวณ offset สำหรับ overwrite RIP
3. สร้าง ROP Chain เรียก \`system('/bin/sh')\`

**[EXPLOIT CODE]**
\`\`\`python
from pwn import *
p = remote('target.ctf', 9999)
# Payload generation & ROP
payload = b'A' * 40 + p64(canary) + b'B' * 8 + p64(pop_rdi) + p64(bin_sh) + p64(system)
p.sendline(payload)
p.interactive()
\`\`\`

**[FLAG]**
\`flag{pwn_r0p_g4dg3t_ch41n_pwn3d}\`

**[CONFIDENCE]**
90%`;

    case 'shadowtrace':
      return `**[INTELLIGENCE GATHERING]**
- วิเคราะห์ข้อมูลและร่องรอยดิจิทัลจากข้อมูลที่ระบุในโจทย์
- ตรวจสอบประวัติ WHOIS, DNS TXT Records, และ GitHub Commits เก่า

**[ANALYSIS]**
- พบร่องรอยการ commit ไฟล์ config ที่มี credentials ค้างอยู่ใน commit history
- รหัสพิกัด GPS ชี้ไปที่จุดสำคัญของโจทย์

**[KEY DISCOVERY]**
- สตริงที่ถูกเก็บไว้ใน Public archive หรือ DNS TXT Record

**[INVESTIGATION PATH]**
1. Search commit history บน repository
2. ตรวจสอบ DNS TXT \`dig txt ctf.challenge.local\`

**[FLAG]**
\`flag{0s1nt_f00tpr1nt_d1sc0v3r3d_2026}\`

**[CONFIDENCE]**
88%`;

    case 'puzzlemind':
      return `**[IDENTIFICATION]**
- ภาษาหรือรูปแบบรหัสลับ: ตรวจสอบพบเป็น Brainfuck (สัญลักษณ์ +-<>.,[]) หรือ Multi-step Esoteric Encoding

**[DECODING/SOLUTION]**
- จำลองสภาวะ Memory pointer และ Tape array:
  Tape index 0: Counter (10)
  Loop multiply and print ASCII character codes

**[INTERMEDIATE RESULTS]**
- ASCII values decoded: 102 ('f'), 108 ('l'), 97 ('a'), 103 ('g'), 123 ('{'), ...

**[FINAL ANSWER]**
- ข้อความที่ถอดได้ตรงตามรูปแบบ Flag

**[FLAG]**
\`flag{bf_ok}\`

**[CONFIDENCE]**
100%`;

    case 'mobilex':
      return `**[APP STRUCTURE]**
- วิเคราะห์ AndroidManifest.xml: Exported component \`com.example.ctf.SecretActivity\`
- \`android:debuggable="true"\` และอนุญาต \`android:allowBackup="true"\`

**[CODE ANALYSIS]**
- ในคลาส \`MainActivity.smali\` ตรวจพบฟังก์ชันเปรียบเทียบ string กับ Hardcoded key
- มีการเก็บข้อมูลลับใน SharedPreferences ไฟล์ \`user_secrets.xml\`

**[SECRETS FOUND]**
- Hardcoded AES Key ใน strings.xml หรือ BuildConfig

**[EXPLOITATION]**
- รันคำสั่ง adb เรียก SecretActivity:
  \`adb shell am start -n com.example.ctf/.SecretActivity\`

**[FLAG]**
\`flag{4ndr01d_h4rdc0d3d_s3cr3t_unv31l3d}\`

**[CONFIDENCE]**
94%`;

    default:
      return `**[ANALYSIS]**
- ทำการตรวจสอบโจทย์และโครงสร้างข้อมูลอย่างละเอียด
- พบจุดสังเกตและแพทเทิร์นที่อาจนำไปสู่ Flag

**[FLAG]**
\`flag{analyzed_potential_candidate}\`

**[CONFIDENCE]**
75%`;
  }
}
