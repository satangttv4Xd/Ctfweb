import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

const PORT = 7788;

const server = http.createServer((req, res) => {
  // CORS Headers allowing Vercel Web app to connect to Localhost Agent
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', agent: 'CTF Swarm Local Python Bridge Agent v1.0' }));
    return;
  }

  if (req.url === '/api/analyze-stego' && req.method === 'POST') {
    let bodyChunks: Buffer[] = [];
    req.on('data', chunk => bodyChunks.push(chunk));
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(bodyChunks).toString());
        const { fileName, fileBase64 } = body;

        if (!fileBase64) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing fileBase64' }));
          return;
        }

        const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const tempFilePath = path.join(os.tmpdir(), `stego_local_${Date.now()}_${fileName || 'file.png'}`);
        fs.writeFileSync(tempFilePath, buffer);

        const scriptPath = path.resolve(process.cwd(), 'scripts', 'steg_solver.py');
        const pythonProcess = spawn('python', [scriptPath, tempFilePath]);

        let stdoutData = '';
        let stderrData = '';

        pythonProcess.stdout.on('data', d => { stdoutData += d.toString(); });
        pythonProcess.stderr.on('data', d => { stderrData += d.toString(); });

        pythonProcess.on('close', code => {
          try { if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); } catch {}

          const flagRegex = /(?:flag|ctf|elec|picoctf|thm|htb|sec)[a-z0-9_-]*\{[^\r\n}]{3,100}\}|[a-z0-9_-]+\{[^\r\n}]{3,100}\}/gi;
          const matches = stdoutData.match(flagRegex) || [];
          const uniqueFlags = Array.from(new Set(matches));

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: code === 0,
            stdout: stdoutData,
            stderr: stderrData,
            flags: uniqueFlags,
            agentSource: 'Local User Machine Python Engine'
          }));
        });

      } catch (err: unknown) {
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
  console.log(`\n======================================================`);
  console.log(` 🐍 CTF SWARM LOCAL PYTHON AGENT BRIDGE RUNNING`);
  console.log(` 🌐 Listening on: http://localhost:${PORT}`);
  console.log(` ⚡ Connects Vercel Web App directly to your machine's Python!`);
  console.log(`======================================================\n`);
});
