import http.server
import socketserver
import json
import re
import os
import sys
import tempfile
import base64
import io
from contextlib import redirect_stdout, redirect_stderr

# Ensure UTF-8 output on Windows
if sys.platform == 'win32':
    try:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        if hasattr(sys.stderr, 'reconfigure'):
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Add current scripts dir to sys.path to import solvers
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from archive_solver import solve_matryoshka_archive, is_archive_file, FLAG_REGEX
from steg_solver import find_flag_in_image

import socket

PORT = 7788

class CTFAgentHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

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
        if self.path == '/health' or self.path == '/':
            resp = json.dumps({
                "status": "ok",
                "agent": "CTF Swarm Native Python Desktop Agent v2.0 (Stego + Recursive Matryoshka ZIP Engine)",
                "port": PORT
            }).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(resp)))
            self.send_header('Connection', 'close')
            self.end_headers()
            self.wfile.write(resp)
            return
        
        err = json.dumps({"error": "Not Found"}).encode('utf-8')
        self.send_response(404)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(err)))
        self.send_header('Connection', 'close')
        self.end_headers()
        self.wfile.write(err)

    def do_POST(self):
        if self.path in ('/api/analyze-stego', '/api/analyze-archive', '/api/analyze-file'):
            try:
                content_len = int(self.headers.get('Content-Length', 0))
                req_body = self.rfile.read(content_len).decode('utf-8')
                data = json.loads(req_body)

                file_name = data.get('fileName', 'uploaded_file')
                file_b64 = data.get('fileBase64', '')
                initial_pwd = data.get('initialPassword') or data.get('password')
                category = data.get('category', '')
                challenge_text = data.get('challengeText', '')

                # If initial_pwd not explicitly given, try extracting clues from challengeText
                if not initial_pwd and challenge_text:
                    pwd_match = re.search(r'(?:รหัส(?:ผ่าน|ชั้น[^=:\s]+)?|password(?:\s+for\s+[^=:\s]+)?|pass|key|pwd)\s*[:=]?\s*([a-zA-Z0-9_!@#$%^&*()+=~-]+)', challenge_text, re.IGNORECASE)
                    if pwd_match:
                        initial_pwd = pwd_match.group(1).strip()

                if not file_b64:
                    self.send_response(400)
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "Missing fileBase64"}).encode('utf-8'))
                    return

                # Decode file
                raw_b64 = file_b64.split(',')[-1]
                file_bytes = base64.b64decode(raw_b64)

                ext = os.path.splitext(file_name)[1]
                if not ext:
                    if file_bytes.startswith(b'PK\x03\x04'):
                        ext = '.zip'
                    elif file_bytes.startswith(b'\x89PNG'):
                        ext = '.png'
                    elif file_bytes.startswith(b'\xff\xd8\xff'):
                        ext = '.jpg'

                # Save to temp file for analysis
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext, prefix="ctf_agent_")
                temp_file.write(file_bytes)
                temp_file.close()

                capture_out = io.StringIO()
                capture_err = io.StringIO()
                discovered_flags = set()

                print(f"[+] Agent received task for file: {file_name} (Size: {len(file_bytes)} bytes)")

                with redirect_stdout(capture_out), redirect_stderr(capture_err):
                    if is_archive_file(temp_file.name) or category == 'archive' or file_name.lower().endswith(('.zip', '.tar', '.gz', '.bz2', '.xz', '.7z', '.rar')):
                        res = solve_matryoshka_archive(temp_file.name, initial_password=initial_pwd)
                        if res.get('flags'):
                            for f in res['flags']:
                                discovered_flags.add(f)
                    else:
                        find_flag_in_image(temp_file.name)

                try:
                    os.unlink(temp_file.name)
                except Exception:
                    pass

                stdout_str = capture_out.getvalue()
                stderr_str = capture_err.getvalue()

                # Extract any flag regex matches from stdout
                for m in FLAG_REGEX.findall(stdout_str):
                    if all(32 <= ord(c) <= 126 for c in m):
                        discovered_flags.add(m)

                resp_payload = json.dumps({
                    "success": True,
                    "stdout": stdout_str,
                    "stderr": stderr_str,
                    "flags": list(discovered_flags),
                    "agentSource": "CTF Swarm Native Python Desktop Agent"
                }).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(resp_payload)))
                self.send_header('Connection', 'close')
                self.end_headers()
                self.wfile.write(resp_payload)
                return

            except Exception as e:
                err_payload = json.dumps({"error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_payload)))
                self.send_header('Connection', 'close')
                self.end_headers()
                self.wfile.write(err_payload)
                return

        err_resp = json.dumps({"error": "Endpoint not found"}).encode('utf-8')
        self.send_response(404)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(err_resp)))
        self.send_header('Connection', 'close')
        self.end_headers()
        self.wfile.write(err_resp)

def run_server():
    server_address = ('', PORT)
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
        httpd = DualStackServer(server_address, CTFAgentHandler)
    except Exception:
        class ThreadingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
            daemon_threads = True
            allow_reuse_address = True
        httpd = ThreadingServer(server_address, CTFAgentHandler)

    print(f"""
============================================================
  🤖 CTF SWARM NATIVE PYTHON DESKTOP AGENT (ONLINE)
============================================================
  🌐 Bridge Status : Connected & Listening on http://localhost:{PORT}
  ⚡ Engine Status : Ready to solve Stego & Nested Matryoshka ZIPs!
  
  👉 Open https://ctfweb.vercel.app/ (or http://localhost:5173/)
  The web app will automatically route image steganography and
  nested zip archive challenges to run on YOUR PC!
============================================================
""")
    with httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[!] Stopping CTF Agent Server...")

if __name__ == '__main__':
    run_server()
