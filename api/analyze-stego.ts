import type { VercelRequest, VercelResponse } from '@vercel/node';

// JS Pure Implementation of Stego Solver running natively in Vercel Node.js Serverless Environment
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
    const logs: string[] = [];

    logs.push(`==========================================`);
    logs.push(` [*] VERCEL SERVERLESS STEGO SOLVER ENGINE`);
    logs.push(` File: ${fileName || 'uploaded_image'}`);
    logs.push(`==========================================\n`);

    const foundFlags = new Set<string>();
    const flagRegex = /(?:flag|ctf|elec|picoctf|thm|htb|sec)[a-z0-9_-]*\{[^\r\n}]{3,100}\}|[a-z0-9_-]+\{[^\r\n}]{3,100}\}/gi;

    // 1. Raw Bytes & ASCII Text Search
    logs.push(`[1/4] Checking Raw Bytes & Metadata Strings...`);
    const rawText = buffer.toString('latin1');
    const rawMatches = rawText.match(flagRegex) || [];
    rawMatches.forEach(m => {
      foundFlags.add(m);
      logs.push(`  [+] Raw String Match Found: ${m}`);
    });

    // 2. Check EOF Appended Data (JPEG: FF D9, PNG: IEND)
    logs.push(`\n[2/4] Checking Appended Data (EOF Markers)...`);
    const isPng = buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50;
    const isJpg = buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8;

    if (isPng) {
      const iendIdx = buffer.indexOf(Buffer.from('IEND'));
      if (iendIdx !== -1 && iendIdx + 8 < buffer.length) {
        const extraBytes = buffer.subarray(iendIdx + 8);
        logs.push(`  [!] Detected ${extraBytes.length} bytes appended after PNG IEND marker!`);
        const extraText = extraBytes.toString('latin1');
        const matches = extraText.match(flagRegex) || [];
        matches.forEach(m => {
          foundFlags.add(m);
          logs.push(`  [+] Appended Data Flag Found: ${m}`);
        });
      }
    } else if (isJpg) {
      const lastEoi = buffer.lastIndexOf(Buffer.from([0xff, 0xd9]));
      if (lastEoi !== -1 && lastEoi + 2 < buffer.length) {
        const extraBytes = buffer.subarray(lastEoi + 2);
        logs.push(`  [!] Detected ${extraBytes.length} bytes appended after JPEG EOI marker!`);
        const extraText = extraBytes.toString('latin1');
        const matches = extraText.match(flagRegex) || [];
        matches.forEach(m => {
          foundFlags.add(m);
          logs.push(`  [+] Appended Data Flag Found: ${m}`);
        });
      }
    }

    // 3. Pixel Bit-plane LSB Extraction (Pure JS Data View for PNG/BMP)
    logs.push(`\n[3/4] Running Pixel Bit-plane Analysis...`);
    if (isPng) {
      // Decode IDAT raw bytes stream scan
      const idatIdx = buffer.indexOf(Buffer.from('IDAT'));
      if (idatIdx !== -1) {
        const rawScan = buffer.subarray(idatIdx);
        // Extract LSB from raw pixel data stream
        const lsbBytes: number[] = [];
        let byteVal = 0;
        let bitCount = 0;

        for (let i = 0; i < rawScan.length && lsbBytes.length < 4096; i++) {
          const bit = rawScan[i] & 1;
          byteVal = (byteVal << 1) | bit;
          bitCount++;
          if (bitCount === 8) {
            lsbBytes.push(byteVal);
            byteVal = 0;
            bitCount = 0;
          }
        }

        const decodedText = Buffer.from(lsbBytes).toString('latin1');
        const matches = decodedText.match(flagRegex) || [];
        matches.forEach(m => {
          foundFlags.add(m);
          logs.push(`  [+] Pixel Bit-stream LSB Flag Found: ${m}`);
        });
      }
    }

    // 4. Summary
    logs.push(`\n==========================================`);
    if (foundFlags.size > 0) {
      logs.push(` [!] FINAL FLAGS DISCOVERED ON VERCEL:`);
      foundFlags.forEach(f => logs.push(`  --> ${f}`));
    } else {
      logs.push(` [i] RESULT: No Flag Found in this image`);
    }
    logs.push(`==========================================\n`);

    return res.status(200).json({
      success: true,
      stdout: logs.join('\n'),
      flags: Array.from(foundFlags)
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
}
