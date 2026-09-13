import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 7788;

// Embedded Stego Solver Script to ensure 100% standalone execution without external dependencies
const PYTHON_STEGO_SOLVER_CODE = `import os
import sys
import re
from PIL import Image

def find_flag_in_image(image_path):
    print(f"\\n==========================================")
    print(f" [*] STANDALONE CTF SWARM PYTHON AGENT ENGINE")
    print(f" File: {image_path}")
    print(f"==========================================\\n")

    if not os.path.exists(image_path):
        print(f"[-] Error: File '{image_path}' not found.")
        return

    found_flags = set()
    flag_regex = r'(flag\\{[A-Za-z0-9_\\-]{3,80}\\}|ctf\\{[A-Za-z0-9_\\-]{3,80}\\}|ELEC\\{[A-Za-z0-9_\\-]{3,80}\\}|[a-zA-Z0-9_-]{3,15}\\{[A-Za-z0-9_\\-]{3,80}\\})'

    print("[1/4] Checking Raw Bytes & Metadata Strings...")
    with open(image_path, 'rb') as f:
        data = f.read()

    text = data.decode('latin-1', errors='ignore')
    raw_matches = re.findall(flag_regex, text, re.IGNORECASE)
    for m in raw_matches:
        if len(m) < 80 and all(32 <= ord(c) <= 126 for c in m):
            found_flags.add(m)
            print(f"  [+] Raw String Match Found: {m}")

    print("\\n[2/4] Inspecting EXIF Metadata & PNG Chunks...")
    try:
        img = Image.open(image_path)
        print(f"  Format: {img.format}, Size: {img.size}, Mode: {img.mode}")
        if img.info:
            for k, v in img.info.items():
                v_str = str(v)
                matches = re.findall(flag_regex, v_str, re.IGNORECASE)
                for m in matches:
                    if all(32 <= ord(c) <= 126 for c in m):
                        found_flags.add(m)
                        print(f"  [+] EXIF Flag Found: {m}")
    except Exception as e:
        print(f"  PIL Info: {e}")

    print("\\n[3/4] Checking Appended Data (EOF Markers)...")
    if image_path.lower().endswith('.png'):
        iend_pos = data.find(b'IEND')
        if iend_pos != -1 and iend_pos + 8 < len(data):
            extra = data[iend_pos + 8:]
            print(f"  [!] Detected {len(extra)} bytes appended after PNG IEND marker!")
            extra_text = extra.decode('latin-1', errors='ignore')
            matches = re.findall(flag_regex, extra_text, re.IGNORECASE)
            for m in matches:
                if all(32 <= ord(c) <= 126 for c in m):
                    found_flags.add(m)
                    print(f"  [+] Appended Data Flag Found: {m}")
    elif image_path.lower().endswith(('.jpg', '.jpeg')):
        eoi_pos = data.rfind(b'\\xff\\xd9')
        if eoi_pos != -1 and eoi_pos + 2 < len(data):
            extra = data[eoi_pos + 2:]
            print(f"  [!] Detected {len(extra)} bytes appended after JPEG EOI marker!")
            extra_text = extra.decode('latin-1', errors='ignore')
            matches = re.findall(flag_regex, extra_text, re.IGNORECASE)
            for m in matches:
                if all(32 <= ord(c) <= 126 for c in m):
                    found_flags.add(m)
                    print(f"  [+] Appended Data Flag Found: {m}")

    print("\\n[4/4] Running Pixel LSB Bit Plane Analysis...")
    if image_path.lower().endswith(('.png', '.bmp')):
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
                        if len(m) < 80 and all(32 <= ord(c) <= 126 for c in m):
                            prefix_match = re.match(r'^([a-zA-Z0-9_-]+)\\{', m)
                            if prefix_match:
                                prefix = prefix_match.group(1).lower()
                                if len(prefix) >= 3 or prefix in ['flag', 'ctf', 'elec']:
                                    found_flags.add(m)
                                    print(f"  [+] LSB {channel_name} Channel Flag Found: {m}")
        except Exception as e:
            print(f"  LSB Warning: {e}")

    print("\\n==========================================")
    if found_flags:
        print(" [!] FINAL FLAGS DISCOVERED:")
        for flag in found_flags:
            print(f"  --> {flag}")
    else:
        print(" [i] RESULT: No Flag Found in this image")
    print("==========================================\\n")

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else 'test.png'
    find_flag_in_image(target)
`;

// Locate steg_solver.py in current directory or fallback
const localScriptPath = path.join(__dirname, 'steg_solver.py');
const tempScriptPath = fs.existsSync(localScriptPath)
  ? localScriptPath
  : path.join(os.tmpdir(), 'ctf_swarm_steg_solver.py');

if (!fs.existsSync(localScriptPath) && !fs.existsSync(tempScriptPath)) {
  fs.writeFileSync(tempScriptPath, PYTHON_STEGO_SOLVER_CODE);
}

const server = http.createServer((req, res) => {
  // Allow Vercel Web app to connect
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if ((req.url === '/health' || req.url === '/') && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      agent: 'CTF Swarm Desktop Agent Engine v2.0 (Stego + Recursive ZIP Solver)'
    }));
    return;
  }

  if ((req.url === '/api/analyze-stego' || req.url === '/api/analyze-archive' || req.url === '/api/analyze-file') && req.method === 'POST') {
    let bodyChunks = [];
    req.on('data', chunk => bodyChunks.push(chunk));
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(bodyChunks).toString());
        const { fileName, fileBase64, initialPassword, password, challengeText } = body;

        if (!fileBase64) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing fileBase64' }));
          return;
        }

        let chosenPwd = initialPassword || password;
        if (!chosenPwd && challengeText) {
          const m = challengeText.match(/(?:รหัส|password|pass|key|pwd)\s*[:=]?\s*([a-zA-Z0-9_\-!@#$%^&*+=~]+)/i);
          if (m) chosenPwd = m[1].trim();
        }

        const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = path.extname(fileName || 'file') || (buffer.slice(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])) ? '.zip' : '.png');
        const tempFilePath = path.join(os.tmpdir(), `ctf_upload_${Date.now()}_${path.basename(fileName || 'file', ext)}${ext}`);
        fs.writeFileSync(tempFilePath, buffer);

        // Run python with solver
        const pythonArgs = [tempScriptPath, tempFilePath];
        if (chosenPwd) {
          pythonArgs.push(chosenPwd);
        }
        const pythonProcess = spawn('python', pythonArgs);

        let stdoutData = '';
        let stderrData = '';

        pythonProcess.stdout.on('data', d => { stdoutData += d.toString(); });
        pythonProcess.stderr.on('data', d => { stderrData += d.toString(); });

        pythonProcess.on('close', code => {
          try { if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); } catch {}

          const flagRegex = /(?:flag|ctf|elec|picoctf|thm|htb|sec)[a-z0-9_-]*\{[A-Za-z0-9_\-!@#$%^&*()+=~]{3,100}\}|[a-zA-Z0-9_-]{3,15}\{[A-Za-z0-9_\-!@#$%^&*()+=~]{3,100}\}/gi;
          const matches = stdoutData.match(flagRegex) || [];

          // Clean strict 7-bit ASCII filtering
          const uniqueFlags = Array.from(new Set(matches)).filter(m => {
            for (let i = 0; i < m.length; i++) {
              if (m.charCodeAt(i) < 32 || m.charCodeAt(i) > 126) return false;
            }
            const prefixMatch = m.match(/^([a-zA-Z0-9_-]+)\{/);
            if (prefixMatch) {
              const p = prefixMatch[1].toLowerCase();
              if (p.length < 3 && !['flag', 'ctf', 'elec'].includes(p)) return false;
            }
            return true;
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: code === 0,
            stdout: stdoutData,
            stderr: stderrData,
            flags: uniqueFlags,
            agentSource: 'Standalone User Machine Python Agent (Stego + Recursive ZIP Engine)'
          }));
        });

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: msg }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`
============================================================
  🤖 CTF SWARM STANDALONE DESKTOP AGENT (ONLINE)
============================================================
  🌐 Bridge Status : Connected & Listening on http://localhost:${PORT}
  ⚡ Engine Status : Ready to run Stego & Recursive ZIP Solvers!
  
  👉 Open https://ctfweb.vercel.app/ in your browser.
  The web app will automatically route image steganography and
  nested zip archives to run on YOUR COMPUTER'S PYTHON ENGINE!
============================================================
`);
});

