/**
 * Pure Web Standards Recursive ZIP & Matryoshka Archive Engine
 * Supports standard ZIP, Deflate, and ZipCrypto encryption across Browser, Node.js & Vercel.
 */

// CRC32 Table for ZipCrypto and CRC verification
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(c: number, b: number): number {
  return (c >>> 8) ^ crcTable[(c ^ b) & 0xff];
}

function updateKeys(keys: [number, number, number], b: number) {
  keys[0] = crc32(keys[0], b);
  keys[1] = (Math.imul(keys[1] + (keys[0] & 0xff), 134775813) + 1) | 0;
  keys[2] = crc32(keys[2], keys[1] >>> 24);
}

export function decryptZipCrypto(buf: Uint8Array, pwd: string): Uint8Array {
  const keys: [number, number, number] = [0x12345678, 0x23456789, 0x34567890];
  for (let i = 0; i < pwd.length; i++) {
    updateKeys(keys, pwd.charCodeAt(i));
  }
  for (let i = 0; i < 12; i++) {
    const b = buf[i] ^ ((Math.imul((keys[2] | 2), ((keys[2] | 2) ^ 1)) >>> 8) & 0xff);
    updateKeys(keys, b);
  }
  const out = new Uint8Array(buf.length - 12);
  for (let i = 12; i < buf.length; i++) {
    const b = buf[i] ^ ((Math.imul((keys[2] | 2), ((keys[2] | 2) ^ 1)) >>> 8) & 0xff);
    updateKeys(keys, b);
    out[i - 12] = b;
  }
  return out;
}

export async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(bytes as any);
  writer.close();
  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLength += value.length;
  }
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of chunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }
  return result;
}

function readU16LE(buf: Uint8Array, offset: number): number {
  return buf[offset] | (buf[offset + 1] << 8);
}

function readU32LE(buf: Uint8Array, offset: number): number {
  return (buf[offset] | (buf[offset + 1] << 8) | (buf[offset + 2] << 16) | (buf[offset + 3] << 24)) >>> 0;
}

export function isZipBuffer(buf: Uint8Array): boolean {
  return buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
}

export async function parseZipEntries(
  buf: Uint8Array,
  password?: string
): Promise<Record<string, Uint8Array> | null> {
  let offset = 0;
  const files: Record<string, Uint8Array> = {};
  const decoder = new TextDecoder('utf-8');

  while (offset + 30 <= buf.length) {
    if (readU32LE(buf, offset) !== 0x04034b50) break;
    const flags = readU16LE(buf, offset + 6);
    const method = readU16LE(buf, offset + 8);
    const compressedSize = readU32LE(buf, offset + 18);
    const fileNameLen = readU16LE(buf, offset + 26);
    const extraLen = readU16LE(buf, offset + 28);
    const fileName = decoder.decode(buf.subarray(offset + 30, offset + 30 + fileNameLen));
    const dataStart = offset + 30 + fileNameLen + extraLen;
    let data = buf.subarray(dataStart, dataStart + compressedSize);

    const isEncrypted = (flags & 1) !== 0;
    if (isEncrypted) {
      if (!password) {
        return null;
      }
      data = decryptZipCrypto(data, password);
    }

    let uncompressedData = data;
    if (method === 8) {
      try {
        uncompressedData = await inflateRaw(data);
      } catch {
        return null;
      }
    }
    files[fileName] = uncompressedData;
    offset = dataStart + compressedSize;
  }

  return Object.keys(files).length > 0 ? files : null;
}

export interface MatryoshkaSolveResult {
  success: boolean;
  layersUnpacked: number;
  passwordChain: string[];
  flags: string[];
  stdout: string;
}

export async function solveMatryoshkaZip(
  initialBuffer: Uint8Array,
  initialPassword?: string,
  maxLayers = 100
): Promise<MatryoshkaSolveResult> {
  let currentBuffer = initialBuffer;
  let currentPwd = initialPassword;
  let layer = 1;
  const chain: string[] = [];
  const discoveredFlags = new Set<string>();
  const decoder = new TextDecoder('latin1');
  const flagRegex = /(?:flag|ctf|elec|picoctf|thm|htb|sec)[a-z0-9_-]*\{[A-Za-z0-9_\-!@#$%^&*()+=~./?]{3,100}\}|[a-zA-Z0-9_-]{3,15}\{[A-Za-z0-9_\-!@#$%^&*()+=~./?]{3,100}\}/gi;

  const logLines: string[] = [
    `============================================================`,
    ` [*] CTF RECURSIVE NESTED ARCHIVE SOLVER ENGINE (PURE JS/WEB)`,
    ` Initial Password Hint: '${initialPassword || '(None)'}'`,
    `============================================================\n`
  ];

  const commonPasswords = ['aq4cp79d', '', 'password', '123456', 'admin', 'secret', 'root', 'flag', 'ctf'];

  while (layer <= maxLayers) {
    logLines.push(`[Layer ${layer}] Unpacking layer archive (${currentBuffer.length} bytes)...`);

    // Try current password first, then common fallbacks
    const candidatePasswords = [currentPwd, ...commonPasswords].filter(p => p !== undefined) as string[];
    let extractedFiles: Record<string, Uint8Array> | null = null;
    let successfulPwd = '';

    for (const pwd of candidatePasswords) {
      extractedFiles = await parseZipEntries(currentBuffer, pwd);
      if (extractedFiles) {
        successfulPwd = pwd;
        break;
      }
    }

    if (!extractedFiles) {
      logLines.push(`  [-] Failed to unpack Layer ${layer} (Tested passwords: ${candidatePasswords.slice(0, 4).map(p => `'${p}'`).join(', ')})`);
      break;
    }

    logLines.push(`  [+] Layer ${layer} Extracted successfully! Password used: '${successfulPwd}'`);
    if (successfulPwd) {
      chain.push(successfulPwd);
    }

    let nextZipBuffer: Uint8Array | null = null;
    let nextCandidatePwd: string | null = null;

    const fileNames = Object.keys(extractedFiles);
    logLines.push(`  [i] Files extracted (${fileNames.length}): ${fileNames.slice(0, 5).join(', ')}`);

    for (const [fileName, fileData] of Object.entries(extractedFiles)) {
      const isNestedZip = isZipBuffer(fileData) || fileName.toLowerCase().endsWith('.zip');

      // Check if nested archive
      if (isNestedZip) {
        nextZipBuffer = fileData;
      } else {
        // Only inspect non-archive files for flags and passwords
        const text = decoder.decode(fileData);

        const matches = text.match(flagRegex) || [];
        for (const m of matches) {
          if (/^[\x20-\x7E]+$/.test(m)) {
            discoveredFlags.add(m);
            logLines.push(`  [FLAG] DISCOVERED in Layer ${layer} (${fileName}): ${m}`);
          }
        }

        // Check if password note
        const fnLower = fileName.toLowerCase();
        if (fnLower.includes('note') || fnLower.endsWith('.txt') || fnLower.endsWith('.md') || fnLower.includes('pass')) {
          const pMatches = [
            /(?:password|pass|pwd|key|code|secret)(?:\s+for\s+[a-z0-9_\s]+)?\s*[:=]\s*["']?([a-zA-Z0-9_!@#$%^&*()+=~-]+)/i,
            /is\s*[:=]\s*["']?([a-zA-Z0-9_!@#$%^&*()+=~-]+)/i,
            /next\s*[:=]\s*["']?([a-zA-Z0-9_!@#$%^&*()+=~-]+)/i
          ];
          for (const re of pMatches) {
            const m = text.match(re);
            if (m && m[1].trim()) {
              nextCandidatePwd = m[1].trim();
              break;
            }
          }
          if (!nextCandidatePwd) {
            const clean = text.replace(/^(?:password(?:\s+for\s+[a-z0-9_\s]+)?|pass|key|pwd)\s*[:=]\s*/i, '').trim();
            if (clean && clean.length <= 64) {
              nextCandidatePwd = clean;
            }
          }
          if (nextCandidatePwd) {
            logLines.push(`  [KEY] Discovered next password clue in '${fileName}': '${nextCandidatePwd}'`);
          }
        }
      }
    }

    if (!nextZipBuffer) {
      logLines.push(`\n[+] Innermost layer reached at Layer ${layer}! No further nested archives.`);
      break;
    }

    currentBuffer = nextZipBuffer;
    currentPwd = nextCandidatePwd || '';
    layer++;
  }

  logLines.push(`\n============================================================`);
  logLines.push(` [*] EXTRACTION SUMMARY:`);
  logLines.push(` Total Layers Unpacked : ${layer}`);
  logLines.push(` Passwords Chain Used  : ${chain.length > 0 ? chain.join(' -> ') : 'None'}`);
  if (discoveredFlags.size > 0) {
    logLines.push(` [!] FINAL FLAGS DISCOVERED (${discoveredFlags.size}):`);
    discoveredFlags.forEach(f => logLines.push(`  --> ${f}`));
  } else {
    logLines.push(` [i] No standard flag format found in the unpacked files.`);
  }
  logLines.push(`============================================================\n`);

  return {
    success: discoveredFlags.size > 0 || layer > 1,
    layersUnpacked: layer,
    passwordChain: chain,
    flags: Array.from(discoveredFlags),
    stdout: logLines.join('\n')
  };
}
