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
    try {
      const res = await fetch('http://localhost:7788/health', {
        method: 'GET',
        cache: 'no-store'
      });
      if (res.ok) {
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
      'echo   Connect: Open https://ctfweb.vercel.app/ in your browser',
      'echo ============================================================',
      'echo.',
      ':: Create python runner script dynamically',
      'echo import http.server, socketserver, json, re, tempfile, os, base64 > ctf_agent_runner.py',
      'echo PORT = 7788 >> ctf_agent_runner.py',
      'echo class H(http.server.BaseHTTPRequestHandler): >> ctf_agent_runner.py',
      'echo     def do_OPTIONS(self): >> ctf_agent_runner.py',
      'echo         self.send_response(204) >> ctf_agent_runner.py',
      'echo         self.send_header("Access-Control-Allow-Origin", "*") >> ctf_agent_runner.py',
      'echo         self.send_header("Access-Control-Allow-Methods", "*") >> ctf_agent_runner.py',
      'echo         self.send_header("Access-Control-Allow-Headers", "*") >> ctf_agent_runner.py',
      'echo         self.end_headers() >> ctf_agent_runner.py',
      'echo     def do_GET(self): >> ctf_agent_runner.py',
      'echo         if self.path == "/health": >> ctf_agent_runner.py',
      'echo             self.send_response(200) >> ctf_agent_runner.py',
      'echo             self.send_header("Access-Control-Allow-Origin", "*") >> ctf_agent_runner.py',
      'echo             self.send_header("Content-Type", "application/json") >> ctf_agent_runner.py',
      'echo             self.end_headers() >> ctf_agent_runner.py',
      'echo             self.wfile.write(json.dumps({"status": "ok"}).encode()) >> ctf_agent_runner.py',
      'echo     def do_POST(self): >> ctf_agent_runner.py',
      'echo         if self.path == "/api/analyze-stego": >> ctf_agent_runner.py',
      'echo             length = int(self.headers.get("Content-Length", 0)) >> ctf_agent_runner.py',
      'echo             body = json.loads(self.rfile.read(length).decode("utf-8")) >> ctf_agent_runner.py',
      'echo             category = body.get("category", "") >> ctf_agent_runner.py',
      'echo             file_name = body.get("fileName", "file") >> ctf_agent_runner.py',
      'echo             log_lines = [f"[Windows Desktop Agent Engine] PC Python Analysis for {file_name} ({category})"] >> ctf_agent_runner.py',
      'echo             b64 = body.get("fileBase64", "").split(",")[-1] >> ctf_agent_runner.py',
      'echo             buf = base64.b64decode(b64) >> ctf_agent_runner.py',
      'echo             found = set() >> ctf_agent_runner.py',
      'echo             reg = r"(flag\\{[A-Za-z0-9_\\-]{3,80}\\}|ctf\\{[A-Za-z0-9_\\-]{3,80}\\}|ELEC\\{[A-Za-z0-9_\\-]{3,80}\\}|[a-zA-Z0-9_-]{3,15}\\{[A-Za-z0-9_\\-]{3,80}\\})" >> ctf_agent_runner.py',
      'echo             text = buf.decode("latin-1", errors="ignore") >> ctf_agent_runner.py',
      'echo             for m in re.findall(reg, text, re.IGNORECASE): found.add(m) >> ctf_agent_runner.py',
      'echo             if category in ("pcap", "pcapng") or file_name.lower().endswith((".pcap", ".pcapng")): >> ctf_agent_runner.py',
      'echo                 try: >> ctf_agent_runner.py',
      'echo                     ips = set(re.findall(r"\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b", text)) >> ctf_agent_runner.py',
      'echo                     urls = set(re.findall(r"https?://[a-zA-Z0-9\\.\\-_/:]+", text)) >> ctf_agent_runner.py',
      'echo                     log_lines.append(f"  [PCAP Engine] Extracted {len(ips)} IPs, {len(urls)} HTTP Endpoints") >> ctf_agent_runner.py',
      'echo                     for u in list(urls)[:5]: log_lines.append(f"    * URL: {u}") >> ctf_agent_runner.py',
      'echo                 except Exception as e: log_lines.append(f"  [PCAP Error]: {e}") >> ctf_agent_runner.py',
      'echo             if b"PK\\x03\\x04" in buf or b"PK\\x01\\x02" in buf or category in ("apk", "archive") or file_name.lower().endswith((".apk", ".zip", ".jar")): >> ctf_agent_runner.py',
      'echo                 try: >> ctf_agent_runner.py',
      'echo                     import zipfile, io >> ctf_agent_runner.py',
      'echo                     pk_pos = buf.find(b"PK\\x03\\x04") >> ctf_agent_runner.py',
      'echo                     zip_data = buf[pk_pos:] if pk_pos != -1 else buf >> ctf_agent_runner.py',
      'echo                     with zipfile.ZipFile(io.BytesIO(zip_data)) as z: >> ctf_agent_runner.py',
      'echo                         namelist = z.namelist() >> ctf_agent_runner.py',
      'echo                         log_lines.append(f"  [Carving/Archive Engine] Discovered embedded ZIP! Extracted {len(namelist)} files: {namelist[:5]}") >> ctf_agent_runner.py',
      'echo                         for fname in namelist: >> ctf_agent_runner.py',
      'echo                             for m in re.findall(reg, fname, re.IGNORECASE): found.add(m) >> ctf_agent_runner.py',
      'echo                             try: >> ctf_agent_runner.py',
      'echo                                 zcontent = z.read(fname).decode("latin-1", errors="ignore") >> ctf_agent_runner.py',
      'echo                                 for m in re.findall(reg, zcontent, re.IGNORECASE): found.add(m) >> ctf_agent_runner.py',
      'echo                             except Exception: pass >> ctf_agent_runner.py',
      'echo                 except Exception as e: log_lines.append(f"  [Zip/Carving Info]: {e}") >> ctf_agent_runner.py',
      'echo             iend_pos = buf.find(b"IEND") >> ctf_agent_runner.py',
      'echo             if iend_pos != -1 and iend_pos + 8 ^< len(buf): >> ctf_agent_runner.py',
      'echo                 extra = buf[iend_pos+8:].decode("latin-1", errors="ignore") >> ctf_agent_runner.py',
      'echo                 for m in re.findall(reg, extra, re.IGNORECASE): found.add(m) >> ctf_agent_runner.py',
      'echo             try: >> ctf_agent_runner.py',
      'echo                 from PIL import Image >> ctf_agent_runner.py',
      'echo                 temp = tempfile.NamedTemporaryFile(delete=False, suffix=".png") >> ctf_agent_runner.py',
      'echo                 temp.write(buf) >> ctf_agent_runner.py',
      'echo                 temp.close() >> ctf_agent_runner.py',
      'echo                 img = Image.open(temp.name) >> ctf_agent_runner.py',
      'echo                 if img.info: >> ctf_agent_runner.py',
      'echo                     for k, v in img.info.items(): >> ctf_agent_runner.py',
      'echo                         for m in re.findall(reg, str(v), re.IGNORECASE): found.add(m) >> ctf_agent_runner.py',
      'echo                 if img.mode in ("RGB", "RGBA"): >> ctf_agent_runner.py',
      'echo                     raw_pixels = list(img.get_flattened_data() if hasattr(img, "get_flattened_data") else img.getdata()) >> ctf_agent_runner.py',
      'echo                     num_channels = len(raw_pixels[0]) if isinstance(raw_pixels[0], (tuple, list)) else 3 >> ctf_agent_runner.py',
      'echo                     for c in range(min(num_channels, 4)): >> ctf_agent_runner.py',
      'echo                         bits = [str((p[c] if isinstance(p, (tuple, list)) else p) ^& 1) for p in raw_pixels] >> ctf_agent_runner.py',
      'echo                         byte_arr = bytearray([int("".join(bits[i:i+8]), 2) for i in range(0, len(bits)-7, 8)]) >> ctf_agent_runner.py',
      'echo                         for m in re.findall(reg, byte_arr.decode("latin-1", errors="ignore"), re.IGNORECASE): found.add(m) >> ctf_agent_runner.py',
      'echo                     all_bits = [] >> ctf_agent_runner.py',
      'echo                     for p in raw_pixels: >> ctf_agent_runner.py',
      'echo                         for c in range(min(len(p) if isinstance(p, (tuple, list)) else 1, 3)): >> ctf_agent_runner.py',
      'echo                             all_bits.append(str((p[c] if isinstance(p, (tuple, list)) else p) ^& 1)) >> ctf_agent_runner.py',
      'echo                     comb_bytes = bytearray([int("".join(all_bits[i:i+8]), 2) for i in range(0, len(all_bits)-7, 8)]) >> ctf_agent_runner.py',
      'echo                     for m in re.findall(reg, comb_bytes.decode("latin-1", errors="ignore"), re.IGNORECASE): found.add(m) >> ctf_agent_runner.py',
      'echo                 os.unlink(temp.name) >> ctf_agent_runner.py',
      'echo             except Exception: pass >> ctf_agent_runner.py',
      'echo             if found: >> ctf_agent_runner.py',
      'echo                 log_lines.append(f"[!] FLAGS DISCOVERED ({len(found)}):") >> ctf_agent_runner.py',
      'echo                 for f in found: log_lines.append(f"  -> {f}") >> ctf_agent_runner.py',
      'echo             else: log_lines.append("[i] Result: No flag pattern string detected.") >> ctf_agent_runner.py',
      'echo             self.send_response(200) >> ctf_agent_runner.py',
      'echo             self.send_header("Access-Control-Allow-Origin", "*") >> ctf_agent_runner.py',
      'echo             self.send_header("Content-Type", "application/json") >> ctf_agent_runner.py',
      'echo             self.end_headers() >> ctf_agent_runner.py',
      'echo             self.wfile.write(json.dumps({"success": True, "stdout": "\\n".join(log_lines), "flags": list(found)}).encode()) >> ctf_agent_runner.py',
      'echo print("============================================================") >> ctf_agent_runner.py',
      'echo print("  🤖 CTF SWARM LOCAL AGENT RUNNING (http://localhost:7788)") >> ctf_agent_runner.py',
      'echo print("============================================================") >> ctf_agent_runner.py',
      'echo with socketserver.TCPServer(("", PORT), H) as httpd: httpd.serve_forever() >> ctf_agent_runner.py',
      'echo. ',
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
    const rawPy = `import http.server, socketserver, json, re, tempfile, os, base64

PORT = 7788

class H(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', '*')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()

    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode())

    def do_POST(self):
        if self.path == '/api/analyze-stego':
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length).decode('utf-8'))
            b64 = body.get('fileBase64', '').split(',')[-1]
            buf = base64.b64decode(b64)
            found = set()
            reg = r"(flag\\{[A-Za-z0-9_-]{3,80}\\}|ctf\\{[A-Za-z0-9_-]{3,80}\\}|ELEC\\{[A-Za-z0-9_-]{3,80}\\}|[a-zA-Z0-9_-]{3,15}\\{[A-Za-z0-9_-]{3,80}\\})"
            text = buf.decode('latin-1', errors='ignore')
            for m in re.findall(reg, text, re.IGNORECASE): found.add(m)
            iend_pos = buf.find(b'IEND')
            if iend_pos != -1 and iend_pos + 8 < len(buf):
                extra = buf[iend_pos+8:].decode('latin-1', errors='ignore')
                for m in re.findall(reg, extra, re.IGNORECASE): found.add(m)
            try:
                from PIL import Image
                temp = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
                temp.write(buf)
                temp.close()
                img = Image.open(temp.name)
                if img.info:
                    for k, v in img.info.items():
                        for m in re.findall(reg, str(v), re.IGNORECASE): found.add(m)
                if img.mode in ('RGB', 'RGBA'):
                    raw_pixels = list(img.get_flattened_data() if hasattr(img, 'get_flattened_data') else img.getdata())
                    num_channels = len(raw_pixels[0]) if isinstance(raw_pixels[0], (tuple, list)) else 3
                    for c in range(min(num_channels, 4)):
                        bits = [str((p[c] if isinstance(p, (tuple, list)) else p) & 1) for p in raw_pixels]
                        byte_arr = bytearray([int("".join(bits[i:i+8]), 2) for i in range(0, len(bits)-7, 8)])
                        for m in re.findall(reg, byte_arr.decode('latin-1', errors='ignore'), re.IGNORECASE): found.add(m)
                    all_bits = []
                    for p in raw_pixels:
                        for c in range(min(len(p) if isinstance(p, (tuple, list)) else 1, 3)):
                            all_bits.append(str((p[c] if isinstance(p, (tuple, list)) else p) & 1))
                    comb_bytes = bytearray([int("".join(all_bits[i:i+8]), 2) for i in range(0, len(all_bits)-7, 8)])
                    for m in re.findall(reg, comb_bytes.decode('latin-1', errors='ignore'), re.IGNORECASE): found.add(m)
                os.unlink(temp.name)
            except Exception: pass

            log_lines = ["[Windows Desktop Agent Engine] PC Python Analysis Finished."]
            if found:
                log_lines.append(f"[!] FLAGS DISCOVERED ({len(found)}):")
                for f in found: log_lines.append(f"  -> {f}")
            else: log_lines.append("[i] Result: No flag pattern string detected in LSB/Metadata.")

            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "stdout": "\n".join(log_lines),
                "flags": list(found)
            }).encode())

print("============================================================")
print("  🤖 CTF SWARM LOCAL AGENT RUNNING (http://localhost:7788)")
print("============================================================")
with socketserver.TCPServer(("", PORT), H) as httpd:
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
{`import http.server, socketserver, json, re, tempfile, os, base64

PORT = 7788
# Run this script with: python script.py
# Server will start listening on http://localhost:7788`}
        </pre>
      </div>
    </div>
  );
};
