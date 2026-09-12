import type { VercelRequest, VercelResponse } from '@vercel/node';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, fileBase64 } = req.body || {};

    if (!fileBase64) {
      return res.status(400).json({ error: 'Missing fileBase64' });
    }

    const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const tempDir = os.tmpdir();
    const ext = path.extname(fileName || 'file.png') || '.png';
    const tempFilePath = path.join(tempDir, `stego_upload_${Date.now()}${ext}`);
    fs.writeFileSync(tempFilePath, buffer);

    const scriptPath = path.resolve(process.cwd(), 'scripts', 'steg_solver.py');

    // On Vercel Serverless environment, try python3 or python
    const pythonExecutable = process.env.PYTHON_PATH || 'python3';
    
    const pythonProcess = spawn(pythonExecutable, [scriptPath, tempFilePath]);

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    pythonProcess.on('close', (code) => {
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch {
        // ignore
      }

      const flagRegex = /(?:flag|ctf|elec|picoctf|thm|htb|sec)[a-z0-9_-]*\{[^\r\n}]{3,100}\}|[a-z0-9_-]+\{[^\r\n}]{3,100}\}/gi;
      const matches = stdoutData.match(flagRegex) || [];
      const uniqueFlags = Array.from(new Set(matches));

      return res.status(200).json({
        success: code === 0,
        stdout: stdoutData,
        stderr: stderrData,
        flags: uniqueFlags
      });
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
}
