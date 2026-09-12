import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import type { Plugin, Connect } from 'vite';

export function pythonStegoPlugin(): Plugin {
  return {
    name: 'python-stego-solver',
    configureServer(server) {
      server.middlewares.use('/api/analyze-stego', (req: Connect.IncomingMessage, res: Connect.ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 455;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let bodyChunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => {
          bodyChunks.push(chunk);
        });

        req.on('end', async () => {
          try {
            const body = JSON.parse(Buffer.concat(bodyChunks).toString());
            const { fileName, fileBase64 } = body;

            if (!fileBase64) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing fileBase64' }));
              return;
            }

            // Extract raw base64 data
            const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');

            // Save to temp file
            const tempDir = os.tmpdir();
            const ext = path.extname(fileName || 'file.png') || '.png';
            const tempFilePath = path.join(tempDir, `stego_upload_${Date.now()}${ext}`);
            fs.writeFileSync(tempFilePath, buffer);

            const scriptPath = path.resolve(process.cwd(), 'scripts', 'steg_solver.py');

            // Execute python steg_solver.py
            const pythonProcess = spawn('python', [scriptPath, tempFilePath]);

            let stdoutData = '';
            let stderrData = '';

            pythonProcess.stdout.on('data', (data) => {
              stdoutData += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
              stderrData += data.toString();
            });

            pythonProcess.on('close', (code) => {
              // Clean up temp file
              try {
                if (fs.existsSync(tempFilePath)) {
                  fs.unlinkSync(tempFilePath);
                }
              } catch {
                // ignore
              }

              // Extract flags from stdout
              const flagRegex = /(?:flag|ctf|elec|picoctf|thm|htb|sec)[a-z0-9_-]*\{[^\r\n}]{3,100}\}|[a-z0-9_-]+\{[^\r\n}]{3,100}\}/gi;
              const matches = stdoutData.match(flagRegex) || [];
              const uniqueFlags = Array.from(new Set(matches));

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: code === 0,
                stdout: stdoutData,
                stderr: stderrData,
                flags: uniqueFlags
              }));
            });

          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: msg }));
          }
        });
      });
    }
  };
}
