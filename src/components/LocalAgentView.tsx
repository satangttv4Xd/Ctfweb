import React, { useState, useEffect } from 'react';
import { Terminal, CheckCircle2, XCircle, RefreshCw, Download, Cpu, Activity, ShieldAlert, Copy, Check, Zap } from 'lucide-react';

export const LocalAgentView: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  const checkHealth = async () => {
    setStatus('checking');
    const start = Date.now();
    const tryPing = async (url: string) => {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 1500);
      try {
        const res = await fetch(url, { method: 'GET', cache: 'no-store', signal: ctrl.signal });
        return res.ok;
      } catch {
        return false;
      } finally {
        clearTimeout(tid);
      }
    };

    try {
      const ok = (await tryPing('http://127.0.0.1:7788/health')) || (await tryPing('http://localhost:7788/health'));
      if (ok) {
        const duration = Date.now() - start;
        setLatency(duration);
        setStatus('connected');
      } else {
        setStatus('disconnected');
        setLatency(null);
      }
    } catch {
      setStatus('disconnected');
      setLatency(null);
    } finally {
      setLastCheckTime(new Date().toLocaleTimeString('th-TH'));
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 3000);
    return () => clearInterval(interval);
  }, []);

  const downloadCmdLauncher = () => {
    const rawPy = `import http.server, socketserver, socket, json, re, tempfile, os, sys, base64, shutil, zipfile, subprocess

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

class ThreadingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args): pass
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
            resp = json.dumps({"status": "ok", "agent": "CTF Swarm Python Desktop Agent v2.0 (Stego + Matryoshka ZIP)"}).encode('utf-8')
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
            resp = json.dumps({"success": True, "stdout": "\\n".join(log_lines), "flags": list(found)}).encode('utf-8')
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
            except Exception: pass
            super().server_bind()
    httpd = DualStackServer(("", PORT), H)
except Exception:
    httpd = ThreadingServer(("", PORT), H)

print("============================================================")
print("  🤖 CTF SWARM DESKTOP AGENT (ONLINE http://localhost:7788)")
print("============================================================")
print("[✓] Server is active and listening on port 7788.")
print("[i] Keep this window OPEN while using CTF Swarm in your browser.")
print("[*] Ready for incoming CTF challenges & files...")
with httpd:
    httpd.serve_forever()
`;

    const b64Runner = btoa(unescape(encodeURIComponent(rawPy)));
    const cmdLines = [
      '@echo off',
      ':: ============================================================',
      ':: 🤖 CTF SWARM STANDALONE WINDOWS AGENT LAUNCHER',
      ':: ============================================================',
      'title CTF Swarm Local Agent Engine (Windows Executable)',
      'color 0A',
      'cls',
      'echo.',
      'echo ============================================================',
      'echo   🤖 CTF SWARM DESKTOP AGENT ENGINE (RUNNING ON YOUR PC)',
      'echo ============================================================',
      'echo   Status : Ready ^& Listening on http://localhost:7788',
      'echo   Features: Image Stego + Recursive Nested Matryoshka ZIP Engine',
      'echo   Connect: Open https://ctfweb.vercel.app/ in your browser',
      'echo ============================================================',
      'echo.',
      ':: Extract python runner script from base64 to avoid cmd escaping issues',
      `python -c "import base64; open('ctf_agent_runner.py', 'wb').write(base64.b64decode('${b64Runner}'))"`,
      'if not exist ctf_agent_runner.py (',
      '    echo [!] Error: Python was not found on your system PATH.',
      '    echo Please install Python 3.10+ from https://www.python.org/',
      '    pause',
      '    exit /b 1',
      ')',
      'echo [!] Starting Python Agent Server on port 7788...',
      'python ctf_agent_runner.py',
      'pause'
    ];
    const blob = new Blob([cmdLines.join('\r\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CTF-Swarm-Agent-Launcher.cmd';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyScriptToClipboard = () => {
    const rawPy = `import http.server, socketserver, socket, json, re, tempfile, os, sys, base64, shutil, zipfile, subprocess

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception: pass

PORT = 7788
REG = re.compile(r'(?:flag|ctf|elec|picoctf|thm|htb|sec)[a-z0-9_-]*\{[a-zA-Z0-9_!@#$%^&*()+=~-]{3,100}\}|[a-zA-Z0-9_-]{3,15}\{[a-zA-Z0-9_!@#$%^&*()+=~-]{3,100}\}', re.IGNORECASE)
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

class ThreadingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args): pass
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
            resp = json.dumps({"status": "ok", "agent": "CTF Swarm Python Desktop Agent v2.0"}).encode('utf-8')
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
                m = re.search(r'(?:รหัส|password|pass|key|pwd)\s*[:=]?\s*([a-zA-Z0-9_!@#$%^&*()+=~-]+)', ch_text, re.I)
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
            resp = json.dumps({"success": True, "stdout": "\\n".join(log_lines), "flags": list(found)}).encode('utf-8')
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
            except Exception: pass
            super().server_bind()
    httpd = DualStackServer(("", PORT), H)
except Exception:
    httpd = ThreadingServer(("", PORT), H)

print("============================================================")
print("  🤖 CTF SWARM DESKTOP AGENT (ONLINE http://localhost:7788)")
print("============================================================")
print("[✓] Server is active and listening on port 7788.")
print("[i] Keep this window OPEN while using CTF Swarm in your browser.")
print("[*] Ready for incoming CTF challenges & files...")
with httpd:
    httpd.serve_forever()
`;
    navigator.clipboard.writeText(rawPy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '1rem',
        padding: '1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: status === 'connected'
              ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
              : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: status === 'connected' ? '0 0 20px rgba(16, 185, 129, 0.4)' : '0 0 20px rgba(239, 68, 68, 0.4)',
            transition: 'all 0.3s ease'
          }}>
            <Terminal size={30} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Local Python Agent Engine
              </h2>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}>
                Bridge Mode (v1.0.4)
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8' }}>
              ระบบเชื่อมต่อเพื่อรันสคริปต์ Python และถอดรหัสไฟล์ Steganography/Forensics บนเครื่องคอมพิวเตอร์ของคุณเองโดยตรง
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={checkHealth}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.1rem' }}
        >
          <RefreshCw size={16} className={status === 'checking' ? 'animate-spin' : ''} />
          <span>{status === 'checking' ? 'กำลังตรวจสอบ...' : 'ตรวจสอบสถานะ'}</span>
        </button>
      </div>

      {/* Main Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {/* Status Card */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          border: status === 'connected' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8' }}>สถานะการเชื่อมต่อ</span>
            <Activity size={18} color={status === 'connected' ? '#10b981' : '#ef4444'} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            {status === 'connected' ? (
              <>
                <CheckCircle2 size={32} color="#10b981" />
                <div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399', display: 'block' }}>
                    เชื่อมต่อสำเร็จ (Connected)
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Agent พร้อมทำงานบน PC ของคุณ
                  </span>
                </div>
              </>
            ) : status === 'checking' ? (
              <>
                <RefreshCw size={32} color="#38bdf8" className="animate-spin" />
                <div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8', display: 'block' }}>
                    กำลังตรวจสอบ...
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    กำลังส่งคำขอไปยัง localhost:7788
                  </span>
                </div>
              </>
            ) : (
              <>
                <XCircle size={32} color="#ef4444" />
                <div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f87171', display: 'block' }}>
                    ยังไม่ได้เชื่อมต่อ (Disconnected)
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    กรุณาดาวน์โหลดแอปและเปิดรันบน PC
                  </span>
                </div>
              </>
            )}
          </div>

          <div style={{
            fontSize: '0.75rem',
            color: '#64748b',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '0.75rem',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>ตรวจสอบล่าสุด: {lastCheckTime || '-'}</span>
            {latency !== null && (
              <span style={{ color: '#34d399', fontWeight: 600 }}>Latency: {latency} ms</span>
            )}
          </div>
        </div>

        {/* Server Endpoint Card */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8' }}>พอร์ต & Endpoint</span>
            <Cpu size={18} color="#0284c7" />
          </div>
          <div style={{
            fontFamily: 'var(--font-mono, monospace)',
            backgroundColor: '#020617',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.85rem',
            color: '#38bdf8',
            marginBottom: '0.75rem'
          }}>
            http://localhost:7788
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <div>• <strong>Health Check:</strong> <code>GET /health</code></div>
            <div>• <strong>Stego Engine:</strong> <code>POST /api/analyze-stego</code></div>
            <div>• <strong>CORS Support:</strong> <code>Access-Control-Allow-Origin: *</code></div>
          </div>
        </div>

        {/* Download Launcher Card */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#38bdf8' }}>ดาวน์โหลดแอปตัวกลาง</span>
              <Zap size={18} color="#f59e0b" />
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '1rem' }}>
              ดาวน์โหลดไฟล์ executable <code>.cmd</code> ไปดับเบิ้ลคลิกรันบนเครื่อง Windows ได้ทันทีโดยไม่ต้องตั้งค่าเพิ่มเติม
            </p>
          </div>

          <button
            type="button"
            onClick={downloadCmdLauncher}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Download size={18} color="#ffffff" />
            <span>โหลดแอป Windows Executable (.cmd)</span>
          </button>
        </div>
      </div>

      {/* Instructions & Usage Steps */}
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '0.75rem',
        padding: '1.5rem'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={20} color="#38bdf8" />
          <span>ขั้นตอนการใช้งาน Local Python Agent</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Step 1 */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.875rem',
              flexShrink: 0
            }}>
              1
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9' }}>
                ดาวน์โหลดไฟล์ <code>CTF-Swarm-Agent-Launcher.cmd</code>
              </h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                กดปุ่มดาวน์โหลดด้านบน แล้วบันทึกไฟล์ไว้ที่โฟลเดอร์ใดก็ได้บนเครื่อง Windows ของคุณ
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.875rem',
              flexShrink: 0
            }}>
              2
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9' }}>
                ดับเบิ้ลคลิกรันไฟล์ <code>.cmd</code>
              </h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                หน้าต่าง Command Prompt จะเปิดขึ้นและสร้าง Python Agent Server บนพอร์ต 7788 โดยอัตโนมัติ (ต้องมี Python ติดตั้งบนเครื่อง)
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.875rem',
              flexShrink: 0
            }}>
              3
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9' }}>
                ทดสอบอัปโหลดไฟล์ภาพ Steganography บนเว็บ
              </h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                กลับไปที่แดชบอร์ด Swarm แล้วเลือกเอเจนต์ <strong>Steghunter</strong> หรือ <strong>ForensicX</strong> จากนั้นกดรันวิเคราะห์ ระบบจะส่งไฟล์ไปถอดรหัส LSB และสแกน Flag บน PC ของคุณทันที!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Code Option */}
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '0.75rem',
        padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9' }}>
            สคริปต์ Python ต้นฉบับ (หากต้องการรัน manual ด้วยตนเอง)
          </h4>
          <button
            type="button"
            onClick={copyScriptToClipboard}
            className="btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            {isCopied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
            <span>{isCopied ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด Python'}</span>
          </button>
        </div>
        <pre style={{
          backgroundColor: '#020617',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.75rem',
          color: '#cbd5e1',
          overflowX: 'auto',
          maxHeight: '220px',
          fontFamily: 'var(--font-mono, monospace)'
        }}>
{`# CTF Swarm Local Agent Engine (Stego + Recursive Matryoshka ZIP Solver)
# Run directly with: python scripts/local_python_agent.py (or npm run agent)
# Or CLI single file: python scripts/archive_solver.py matryoshka.zip aq4cp79d
# Server listens on http://localhost:7788`}
        </pre>
      </div>
    </div>
  );
};
