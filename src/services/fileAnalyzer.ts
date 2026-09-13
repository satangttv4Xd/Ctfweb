import type { AttachedFile, FileCategory, AgentId, FileAnalysisDetails } from '../types';

/**
 * Format bytes to readable string (e.g. 1.25 MB)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Compute SHA-256 hash using native Web Crypto API
 */
export async function computeSha256(buffer: ArrayBuffer): Promise<string> {
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'sha256-unavailable';
  }
}

/**
 * Generate formatted Hexdump (offset | hex bytes | printable ASCII)
 */
export function generateHexdump(bytes: Uint8Array, maxBytes = 256): string {
  const lines: string[] = [];
  const limit = Math.min(bytes.length, maxBytes);

  for (let i = 0; i < limit; i += 16) {
    const chunk = bytes.slice(i, i + 16);
    const offset = i.toString(16).padStart(8, '0');
    
    // Hex part
    const hexParts: string[] = [];
    for (let j = 0; j < 16; j++) {
      if (j < chunk.length) {
        hexParts.push(chunk[j].toString(16).padStart(2, '0'));
      } else {
        hexParts.push('  ');
      }
      if (j === 7) hexParts.push(' ');
    }
    const hexString = hexParts.join(' ');

    // ASCII part
    let asciiString = '';
    for (let j = 0; j < chunk.length; j++) {
      const b = chunk[j];
      asciiString += (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.';
    }

    lines.push(`${offset}: ${hexString.padEnd(50)} |${asciiString}|`);
  }

  if (bytes.length > maxBytes) {
    lines.push(`... [${bytes.length - maxBytes} bytes truncated] ...`);
  }

  return lines.join('\n');
}

/**
 * Extract printable ASCII strings (like UNIX `strings -n minLen`)
 */
export function extractPrintableStrings(bytes: Uint8Array, minLen = 4, maxStrings = 60): string[] {
  const result: string[] = [];
  let current = '';

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b >= 32 && b <= 126) {
      current += String.fromCharCode(b);
    } else {
      if (current.length >= minLen) {
        result.push(current);
      }
      current = '';
    }
  }
  if (current.length >= minLen) {
    result.push(current);
  }

  // Deduplicate and prioritize strings containing flag patterns, keywords, or braces
  const unique = Array.from(new Set(result));
  unique.sort((a, b) => {
    const aFlag = /(?:flag|ctf|elec|picoctf|thm|htb|sec)[a-z0-9_-]*\{|\{/i.test(a);
    const bFlag = /(?:flag|ctf|elec|picoctf|thm|htb|sec)[a-z0-9_-]*\{|\{/i.test(b);
    if (aFlag && !bFlag) return -1;
    if (!aFlag && bFlag) return 1;

    const aInteresting = /flag|ctf|elec|http|pass|key|user|admin|token|secret/i.test(a);
    const bInteresting = /flag|ctf|elec|http|pass|key|user|admin|token|secret/i.test(b);
    if (aInteresting && !bInteresting) return -1;
    if (!aInteresting && bInteresting) return 1;
    return b.length - a.length;
  });

  return unique.slice(0, maxStrings);
}

/**
 * Scan strings for common CTF flag patterns (Strict 100% Printable ASCII only)
 */
export function findFlagCandidates(strings: string[]): string[] {
  // Strict Flag Regex: Only known prefixes OR strict word prefix + { pure 7-bit printable ASCII }
  const flagRegex = /(?:flag|ctf|picoctf|elec|thm|htb|sec)[a-z0-9_-]*\{[A-Za-z0-9_\-!@#$%^&*()+=~]{3,100}\}|[a-zA-Z0-9_-]{3,15}\{[A-Za-z0-9_\-!@#$%^&*()+=~]{3,100}\}/gi;
  const candidates = new Set<string>();

  for (const s of strings) {
    // Exclude strings containing non-ASCII / garbled control characters or extended ASCII
    if (/[\u0080-\uFFFF]/.test(s) && !/(?:flag|ctf|elec|picoctf)/i.test(s)) {
      continue;
    }

    const matches = s.match(flagRegex);
    if (matches) {
      matches.forEach(m => {
        // Enforce 100% pure 7-bit ASCII (char codes 32..126) inside candidate
        let isValidAscii = true;
        for (let i = 0; i < m.length; i++) {
          const code = m.charCodeAt(i);
          if (code < 32 || code > 126) {
            isValidAscii = false;
            break;
          }
        }

        // Additional strict rule: If single-char prefix like 4{...} or k{...}, ensure prefix is a known CTF pattern
        const prefixMatch = m.match(/^([a-zA-Z0-9_-]+)\{/);
        if (prefixMatch) {
          const prefix = prefixMatch[1].toLowerCase();
          if (prefix.length < 3 && !['flag', 'ctf', 'elec'].includes(prefix)) {
            isValidAscii = false;
          }
        }

        if (isValidAscii) {
          candidates.add(m);
        }
      });
    }
  }

  return Array.from(candidates);
}

/**
 * Parse PCAP / PCAPNG network capture
 */
export function parsePcapFile(bytes: Uint8Array): {
  isPcap: boolean;
  isPcapNg: boolean;
  endianness: string;
  packetCount: number;
  protocols: string[];
  ipList: string[];
  dnsQueries: string[];
  httpRequests: string[];
} {
  const result = {
    isPcap: false,
    isPcapNg: false,
    endianness: 'Unknown',
    packetCount: 0,
    protocols: [] as string[],
    ipList: [] as string[],
    dnsQueries: [] as string[],
    httpRequests: [] as string[]
  };

  if (bytes.length < 24) return result;

  const magic = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  const u32Magic = magic >>> 0;

  // Check PCAP magic numbers
  let littleEndian = false;
  if (u32Magic === 0xa1b2c3d4) {
    result.isPcap = true;
    result.endianness = 'Big Endian';
  } else if (u32Magic === 0xd4c3b2a1) {
    result.isPcap = true;
    result.endianness = 'Little Endian';
    littleEndian = true;
  } else if (u32Magic === 0xa1b23c4d) {
    result.isPcap = true;
    result.endianness = 'Big Endian (Nanosecond)';
  } else if (u32Magic === 0x4d3cb2a1) {
    result.isPcap = true;
    result.endianness = 'Little Endian (Nanosecond)';
    littleEndian = true;
  } else if (u32Magic === 0x0a0d0d0a) {
    result.isPcap = true;
    result.isPcapNg = true;
    result.endianness = 'PCAPNG Block Format';
  }

  if (!result.isPcap) return result;

  const protocolsSet = new Set<string>(['Ethernet', 'IP']);
  const ipSet = new Set<string>();
  const dnsSet = new Set<string>();
  const httpSet = new Set<string>();

  if (!result.isPcapNg) {
    // Classic PCAP parsing
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let offset = 24; // Skip global header (24 bytes)

    const maxPacketsToExamine = 1500;
    while (offset + 16 <= bytes.length && result.packetCount < maxPacketsToExamine) {
      result.packetCount++;
      const capLen = view.getUint32(offset + 8, littleEndian);
      offset += 16;

      if (offset + capLen > bytes.length) break;

      const packetData = bytes.slice(offset, offset + capLen);
      offset += capLen;

      // Check Ethernet (14 bytes) -> IPv4 (0x0800)
      if (packetData.length >= 34 && packetData[12] === 0x08 && packetData[13] === 0x00) {
        const ipHeader = packetData.slice(14);
        const protocol = ipHeader[9];
        const srcIp = `${ipHeader[12]}.${ipHeader[13]}.${ipHeader[14]}.${ipHeader[15]}`;
        const dstIp = `${ipHeader[16]}.${ipHeader[17]}.${ipHeader[18]}.${ipHeader[19]}`;

        if (ipSet.size < 20) {
          ipSet.add(srcIp);
          ipSet.add(dstIp);
        }

        const ipHeaderLen = (ipHeader[0] & 0x0f) * 4;
        const transportData = ipHeader.slice(ipHeaderLen);

        if (protocol === 6) {
          protocolsSet.add('TCP');
          if (transportData.length >= 4) {
            const srcPort = (transportData[0] << 8) | transportData[1];
            const dstPort = (transportData[2] << 8) | transportData[3];
            
            if (srcPort === 80 || dstPort === 80 || srcPort === 8080 || dstPort === 8080) {
              protocolsSet.add('HTTP');
              // Scan for HTTP methods
              const dataStr = new TextDecoder('utf-8', { fatal: false }).decode(transportData.slice(20));
              const httpMatch = dataStr.match(/^(GET|POST|PUT|DELETE|HEAD|OPTIONS)\s+([^\s\r\n]+)/);
              if (httpMatch && httpSet.size < 10) {
                httpSet.add(`${httpMatch[1]} ${httpMatch[2]}`);
              }
            } else if (srcPort === 21 || dstPort === 21) {
              protocolsSet.add('FTP');
            } else if (srcPort === 22 || dstPort === 22) {
              protocolsSet.add('SSH');
            } else if (srcPort === 23 || dstPort === 23) {
              protocolsSet.add('Telnet');
            }
          }
        } else if (protocol === 17) {
          protocolsSet.add('UDP');
          if (transportData.length >= 4) {
            const srcPort = (transportData[0] << 8) | transportData[1];
            const dstPort = (transportData[2] << 8) | transportData[3];
            if (srcPort === 53 || dstPort === 53) {
              protocolsSet.add('DNS');
            }
          }
        } else if (protocol === 1) {
          protocolsSet.add('ICMP');
        }
      }
    }
  } else {
    // Quick scan for PCAPNG strings (DNS, HTTP)
    result.packetCount = Math.floor(bytes.length / 128); // Estimate
    protocolsSet.add('PCAPNG Multi-Block');
  }

  // Also do regex extraction on full bytes for common DNS query patterns
  const allStrings = extractPrintableStrings(bytes, 4, 100);
  for (const s of allStrings) {
    if (s.match(/^[a-z0-9_-]+(\.[a-z0-9_-]+)+\.(com|net|org|io|local|ctf|lan| internal)$/i)) {
      if (dnsSet.size < 12) dnsSet.add(s);
    }
    if (s.startsWith('GET ') || s.startsWith('POST ') || s.startsWith('HTTP/1.')) {
      if (httpSet.size < 10) httpSet.add(s.slice(0, 60));
    }
  }

  result.protocols = Array.from(protocolsSet);
  result.ipList = Array.from(ipSet);
  result.dnsQueries = Array.from(dnsSet);
  result.httpRequests = Array.from(httpSet);

  return result;
}

/**
 * Parse ZIP Central Directory to list all files inside APK or ZIP
 */
export function parseZipDirectory(bytes: Uint8Array): {
  isZip: boolean;
  entries: string[];
  isApk: boolean;
  hasDex: boolean;
  hasManifest: boolean;
  hasNativeLibs: boolean;
  packageName?: string;
  permissions: string[];
} {
  const result = {
    isZip: false,
    entries: [] as string[],
    isApk: false,
    hasDex: false,
    hasManifest: false,
    hasNativeLibs: false,
    packageName: undefined as string | undefined,
    permissions: [] as string[]
  };

  if (bytes.length < 30) return result;

  // Check Local File Header magic 'PK\x03\x04' anywhere in buffer (Binwalk / Carving support)
  for (let i = 0; i < bytes.length - 4; i++) {
    if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && (bytes[i + 2] === 0x03 || bytes[i + 2] === 0x01) && (bytes[i + 3] === 0x04 || bytes[i + 3] === 0x02)) {
      result.isZip = true;
      break;
    }
  }

  if (!result.isZip) return result;

  const entriesSet = new Set<string>();
  const permSet = new Set<string>();

  // Scan for Central Directory file headers ('PK\x01\x02')
  for (let i = 0; i < bytes.length - 46; i++) {
    if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x01 && bytes[i + 3] === 0x02) {
      const fileNameLen = bytes[i + 28] | (bytes[i + 29] << 8);
      const extraLen = bytes[i + 30] | (bytes[i + 31] << 8);
      const commentLen = bytes[i + 32] | (bytes[i + 33] << 8);

      if (i + 46 + fileNameLen <= bytes.length) {
        const nameBytes = bytes.slice(i + 46, i + 46 + fileNameLen);
        const name = new TextDecoder('utf-8', { fatal: false }).decode(nameBytes);
        if (name && entriesSet.size < 200) {
          entriesSet.add(name);
        }
      }
      i += 45 + fileNameLen + extraLen + commentLen;
    }
  }

  // Fallback: If Central Directory was stripped or not found, scan Local File Headers ('PK\x03\x04')
  if (entriesSet.size === 0) {
    for (let i = 0; i < bytes.length - 30; i++) {
      if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x03 && bytes[i + 3] === 0x04) {
        const fileNameLen = bytes[i + 26] | (bytes[i + 27] << 8);
        if (i + 30 + fileNameLen <= bytes.length) {
          const nameBytes = bytes.slice(i + 30, i + 30 + fileNameLen);
          const name = new TextDecoder('utf-8', { fatal: false }).decode(nameBytes);
          if (name && entriesSet.size < 100) {
            entriesSet.add(name);
          }
        }
      }
    }
  }

  result.entries = Array.from(entriesSet);

  // Check Android APK indicators
  result.hasManifest = result.entries.some(e => e.toLowerCase().includes('androidmanifest.xml'));
  result.hasDex = result.entries.some(e => e.toLowerCase().endsWith('.dex'));
  result.hasNativeLibs = result.entries.some(e => e.startsWith('lib/') && e.endsWith('.so'));
  result.isApk = result.hasManifest || result.hasDex;

  // Extract Android package name & permissions from strings pool
  const strings = extractPrintableStrings(bytes, 4, 150);
  for (const s of strings) {
    if (s.includes('android.permission.') && permSet.size < 10) {
      permSet.add(s.trim());
    }
    if (!result.packageName && /^[a-z][a-z0-9_]*(\.[a-z0-9_]+){2,}$/i.test(s) && !s.includes('android.') && !s.includes('java.')) {
      result.packageName = s;
    }
  }

  result.permissions = Array.from(permSet);

  return result;
}

/**
 * Parse ELF executable/library headers
 */
export function parseElfHeader(bytes: Uint8Array): {
  isElf: boolean;
  bitness?: '32-bit' | '64-bit';
  endianness?: 'Little Endian' | 'Big Endian';
  architecture?: string;
  osAbi?: string;
  type?: string;
} {
  if (bytes.length < 20) return { isElf: false };

  // Magic: 0x7f 'E' 'L' 'F'
  if (bytes[0] !== 0x7f || bytes[1] !== 0x45 || bytes[2] !== 0x4c || bytes[3] !== 0x46) {
    return { isElf: false };
  }

  const bitness = bytes[4] === 1 ? '32-bit' : bytes[4] === 2 ? '64-bit' : undefined;
  const endianness = bytes[5] === 1 ? 'Little Endian' : bytes[5] === 2 ? 'Big Endian' : undefined;

  // Machine architecture
  const machineCode = bytes[5] === 1 
    ? bytes[18] | (bytes[19] << 8) 
    : (bytes[18] << 8) | bytes[19];

  let architecture = `Machine 0x${machineCode.toString(16)}`;
  switch (machineCode) {
    case 0x03: architecture = 'x86 (Intel 80386)'; break;
    case 0x3e: architecture = 'x86-64 (AMD64)'; break;
    case 0x28: architecture = 'ARM 32-bit'; break;
    case 0xb7: architecture = 'AArch64 (ARM 64-bit)'; break;
    case 0x08: architecture = 'MIPS'; break;
    case 0xf3: architecture = 'RISC-V'; break;
  }

  // OS ABI
  let osAbi = 'System V / Generic';
  switch (bytes[7]) {
    case 0x00: osAbi = 'System V'; break;
    case 0x03: osAbi = 'Linux'; break;
    case 0x09: osAbi = 'FreeBSD'; break;
    case 0x0c: osAbi = 'OpenBSD'; break;
  }

  // Type
  const typeCode = bytes[5] === 1 
    ? bytes[16] | (bytes[17] << 8) 
    : (bytes[16] << 8) | bytes[17];
  let type = 'Unknown';
  switch (typeCode) {
    case 1: type = 'Relocatable (Object)'; break;
    case 2: type = 'Executable'; break;
    case 3: type = 'Shared Object / PIE'; break;
    case 4: type = 'Core Dump'; break;
  }

  return {
    isElf: true,
    bitness,
    endianness,
    architecture,
    osAbi,
    type
  };
}

/**
 * Main Analyzer function: processes an uploaded File object and returns rich metadata
 */
export async function analyzeUploadedFile(
  file: File,
  options?: { initialPassword?: string; challengeText?: string }
): Promise<AttachedFile> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const sha256 = await computeSha256(buffer);
  const sizeFormatted = formatBytes(file.size);

  // Extract first 4 bytes as magic hex
  const magicHex = Array.from(bytes.slice(0, 4))
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');

  const hexdump = generateHexdump(bytes, 256);
  const extractedStrings = extractPrintableStrings(bytes, 4, 80);
  const flagCandidates = findFlagCandidates(extractedStrings);

  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  let category: FileCategory = 'other';
  let categoryThai = 'ไฟล์ไบนารี / ทั่วไป';
  let summary = '';
  const recommendedAgentIds: AgentId[] = [];
  const details: FileAnalysisDetails = {};

  // 1. Check PCAP / PCAPNG
  const pcapInfo = parsePcapFile(bytes);
  if (pcapInfo.isPcap || ext === 'pcap' || ext === 'pcapng' || ext === 'cap') {
    category = 'pcap';
    categoryThai = 'ไฟล์ทราฟฟิกเน็ตเวิร์ก (PCAP)';
    recommendedAgentIds.push('forensicx', 'shadowtrace');
    details.packetCount = pcapInfo.packetCount;
    details.protocols = pcapInfo.protocols;
    details.ipList = pcapInfo.ipList;
    details.dnsQueries = pcapInfo.dnsQueries;
    details.httpRequests = pcapInfo.httpRequests;

    summary = `ตรวจพบทราฟฟิกเน็ตเวิร์ก ${pcapInfo.isPcapNg ? 'PCAPNG' : 'PCAP'} (${pcapInfo.endianness}) 
จำนวนแพ็กเก็ตประมาณ: ${pcapInfo.packetCount} packets
โปรโตคอลที่พบ: ${pcapInfo.protocols.join(', ') || 'TCP/UDP/IP'}
${pcapInfo.ipList.length > 0 ? `IP Addresses: ${pcapInfo.ipList.slice(0, 6).join(', ')}` : ''}
${pcapInfo.dnsQueries.length > 0 ? `DNS Queries: ${pcapInfo.dnsQueries.slice(0, 5).join(', ')}` : ''}
${pcapInfo.httpRequests.length > 0 ? `HTTP Requests: ${pcapInfo.httpRequests.slice(0, 4).join(', ')}` : ''}`;
  }

  // 2. Check APK / ZIP
  else {
    const zipInfo = parseZipDirectory(bytes);
    if (zipInfo.isApk || ext === 'apk') {
      category = 'apk';
      categoryThai = 'แอปพลิเคชัน Android (APK)';
      recommendedAgentIds.push('mobilex', 'reveng', 'forensicx');
      details.zipEntries = zipInfo.entries.slice(0, 30);
      details.packageName = zipInfo.packageName;
      details.permissions = zipInfo.permissions;

      summary = `ตรวจพบแพ็กเกจ Android APK 
โครงสร้างสำคัญ: ${zipInfo.hasManifest ? 'AndroidManifest.xml, ' : ''}${zipInfo.hasDex ? 'classes.dex, ' : ''}${zipInfo.hasNativeLibs ? 'Native .so libs' : ''}
${zipInfo.packageName ? `Package: ${zipInfo.packageName}` : ''}
ไฟล์ทั้งหมดใน APK: ${zipInfo.entries.length} รายการ
${zipInfo.permissions.length > 0 ? `Permissions: ${zipInfo.permissions.slice(0, 4).join(', ')}` : ''}`;
    } else if (zipInfo.isZip || ext === 'zip' || ext === 'tar' || ext === 'gz' || ext === 'rar' || ext === '7z') {
      category = 'archive';
      categoryThai = 'ไฟล์บีบอัด (Archive)';
      recommendedAgentIds.push('forensicx', 'steghunter', 'reveng');
      details.zipEntries = zipInfo.entries.slice(0, 30);
      summary = `ตรวจพบไฟล์บีบอัด ZIP Archive บรรจุ ${zipInfo.entries.length} รายการ
รายการตัวอย่าง: ${zipInfo.entries.slice(0, 8).join(', ')}`;
    }
  }

  // 3. Check ELF Linux Binary
  if (category === 'other') {
    const elfInfo = parseElfHeader(bytes);
    if (elfInfo.isElf || ext === 'elf' || ext === 'so' || ext === 'o') {
      category = 'binary';
      categoryThai = 'ไฟล์ไบนารี ELF (Linux Executable)';
      recommendedAgentIds.push('reveng', 'pwnmaster');
      details.architecture = `${elfInfo.bitness} ${elfInfo.architecture} (${elfInfo.type})`;
      details.endianness = elfInfo.endianness;

      summary = `ตรวจพบไฟล์ประมวลผล Linux ELF Binary (${elfInfo.bitness}, ${elfInfo.architecture}, ${elfInfo.endianness})
ประเภท: ${elfInfo.type} | OS ABI: ${elfInfo.osAbi}
ฟังก์ชัน/สตริงก์ที่น่าสงสัย: ${extractedStrings.filter(s => /system|exec|gets|strcpy|printf|\/bin\/sh/i.test(s)).slice(0, 6).join(', ') || 'ไม่มีสัญลักษณ์เสี่ยงชัดเจน'}`;
    }
  }

  // 4. Check PE Windows Executable
  if (category === 'other') {
    if (bytes.length >= 2 && bytes[0] === 0x4d && bytes[1] === 0x5a) { // 'MZ'
      category = 'binary';
      categoryThai = 'ไฟล์ประมวลผล Windows (PE/EXE/DLL)';
      recommendedAgentIds.push('reveng', 'pwnmaster');
      summary = `ตรวจพบไฟล์ Windows PE Executable (DOS Header MZ detected)
ขนาด: ${sizeFormatted} | SHA256: ${sha256.slice(0, 16)}...`;
    }
  }

  // 5. Check Images (PNG, JPG, GIF, WebP, BMP)
  if (category === 'other') {
    if (
      file.type.startsWith('image/') ||
      ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext) ||
      (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) || // PNG
      (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) // JPEG
    ) {
      category = 'image';
      categoryThai = 'ไฟล์ภาพสเตกาโนกราฟี (Image)';
      recommendedAgentIds.push('steghunter', 'forensicx');
      
      // Check for appended bytes after EOF marker (JPEG: FF D9, PNG: IEND)
      let eofNotice = '';
      if (bytes[0] === 0xff && bytes[1] === 0xd8) {
        // JPEG: Find last FF D9
        let lastEoi = -1;
        for (let i = bytes.length - 2; i >= 2; i--) {
          if (bytes[i] === 0xff && bytes[i + 1] === 0xd9) {
            lastEoi = i;
            break;
          }
        }
        if (lastEoi !== -1 && lastEoi + 2 < bytes.length) {
          const extraBytes = bytes.slice(lastEoi + 2);
          const extraStrings = extractPrintableStrings(extraBytes, 3, 20);
          const extraFlags = findFlagCandidates(extraStrings);
          if (extraFlags.length > 0) {
            extraFlags.forEach(f => flagCandidates.push(f));
          }
          eofNotice = ` (ตรวจพบ ${extraBytes.length} บิตส่วนต่อท้ายหลังจุดจบไฟล์ JPEG EOI!)`;
        }
      } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
        // PNG: Find IEND chunk (49 45 4E 44)
        for (let i = 0; i < bytes.length - 8; i++) {
          if (bytes[i] === 0x49 && bytes[i + 1] === 0x45 && bytes[i + 2] === 0x4e && bytes[i + 3] === 0x44) {
            const endPos = i + 8; // IEND + 4 bytes CRC
            if (endPos < bytes.length) {
              const extraBytes = bytes.slice(endPos);
              const extraStrings = extractPrintableStrings(extraBytes, 3, 20);
              const extraFlags = findFlagCandidates(extraStrings);
              if (extraFlags.length > 0) {
                extraFlags.forEach(f => flagCandidates.push(f));
              }
              eofNotice = ` (ตรวจพบ ${extraBytes.length} บิตส่วนต่อท้ายหลัง PNG IEND!)`;
              break;
            }
          }
        }
      }

      summary = `ตรวจพบไฟล์รูปภาพ (${file.type || ext.toUpperCase()})${eofNotice}
เหมาะสำหรับการซ่อนข้อความ LSB Stego, EXIF metadata, หรือซ่อนไฟล์ส่วนต่อท้าย (IEND/EOF padding)`;
    }
  }

  // 6. Check Text / Source code
  if (category === 'other') {
    if (
      file.type.startsWith('text/') ||
      ['txt', 'log', 'c', 'cpp', 'py', 'js', 'ts', 'html', 'php', 'json', 'sql', 'sh', 'asm', 'rs', 'go'].includes(ext)
    ) {
      category = 'text';
      categoryThai = 'ซอร์สโค้ด / ข้อความ Text';
      recommendedAgentIds.push('webx', 'cryptobreaker', 'puzzlemind');
      try {
        const textContent = new TextDecoder('utf-8').decode(bytes);
        details.lineCount = textContent.split('\n').length;
        summary = `ไฟล์ข้อความ / ซอร์สโค้ด (${ext.toUpperCase() || 'Text'}) จำนวน ${details.lineCount} บรรทัด`;
      } catch {
        summary = 'ไฟล์ข้อความ UTF-8';
      }
    }
  }

  // Fallback defaults
  if (recommendedAgentIds.length === 0) {
    recommendedAgentIds.push('forensicx', 'reveng', 'cryptobreaker');
    if (!summary) {
      summary = `ไฟล์ไบนารีขนาด ${sizeFormatted} (Magic bytes: ${magicHex})`;
    }
  }

  // Convert file to Base64 for Deep Local Agent Python Analysis (PCAP, APK, Image, Binary, Archive)
  let imageBase64: string | undefined;
  let fileBase64: string | undefined;
  try {
    fileBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    if (fileBase64) {
      if (category === 'image') imageBase64 = fileBase64;

      // Try Local Machine Agent Bridge (http://localhost:7788)
      try {
        const payload = JSON.stringify({
          fileName: file.name,
          fileBase64,
          category,
          initialPassword: options?.initialPassword,
          challengeText: options?.challengeText
        });
        let localAgentRes: Response | null = null;
        try {
          localAgentRes = await fetch('http://127.0.0.1:7788/api/analyze-stego', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload
          });
        } catch {
          localAgentRes = await fetch('http://localhost:7788/api/analyze-stego', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload
          });
        }

        if (localAgentRes.ok) {
          const data = await localAgentRes.json();
          if (data.flags && Array.isArray(data.flags)) {
            data.flags.forEach((f: string) => flagCandidates.push(f));
          }
          if (data.stdout) {
            details.pythonStdout = data.stdout;
          }
        }
      } catch {
        // Fallback to relative backend API if local agent is offline
        try {
          const res = await fetch('/api/analyze-stego', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileBase64,
              category,
              initialPassword: options?.initialPassword,
              challengeText: options?.challengeText
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (data.flags && Array.isArray(data.flags)) {
              data.flags.forEach((f: string) => flagCandidates.push(f));
            }
            if (data.stdout) {
              details.pythonStdout = data.stdout;
            }
          }
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }


    // Fallback: Client-side Canvas LSB Bit-plane Analysis
    if (flagCandidates.length === 0 && imageBase64 && typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        const img = new Image();
        img.src = imageBase64;
        await new Promise((res) => { img.onload = res; img.onerror = res; });

        if (img.width > 0 && img.height > 0) {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imgData.data;

            const channels = [0, 1, 2];
            for (const ch of channels) {
              let byteVal = 0;
              let bitCount = 0;
              const extractedBytes: number[] = [];

              for (let i = ch; i < pixels.length && extractedBytes.length < 4096; i += 4) {
                const lsb = pixels[i] & 1;
                byteVal = (byteVal << 1) | lsb;
                bitCount++;
                if (bitCount === 8) {
                  extractedBytes.push(byteVal);
                  byteVal = 0;
                  bitCount = 0;
                }
              }

              const decodedText = new Uint8Array(extractedBytes);
              const lsbStrings = extractPrintableStrings(decodedText, 4, 40);
              const lsbFlags = findFlagCandidates(lsbStrings);
              if (lsbFlags.length > 0) {
                lsbFlags.forEach(f => flagCandidates.push(f));
              }
            }
          }
        }
      } catch {
        // ignore
      }
    }

  // If text, read string (or if file is small and high ASCII ratio)
  let rawText: string | undefined;
  if (category === 'text' || ['json', 'xml', 'yaml', 'yml', 'md', 'html', 'css', 'js', 'ts', 'py', 'c', 'h', 'sh', 'sql'].includes(ext)) {
    try {
      rawText = new TextDecoder('utf-8').decode(bytes.slice(0, 100000));
    } catch {
      // ignore
    }
  } else if (bytes.length < 50000) {
    // Check if it's printable text despite unknown extension
    try {
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      let printableCount = 0;
      for (let i = 0; i < decoded.length; i++) {
        const code = decoded.charCodeAt(i);
        if (code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 126)) {
          printableCount++;
        }
      }
      if (printableCount / decoded.length > 0.9) {
        rawText = decoded;
      }
    } catch {
      // binary
    }
  }

  const hasFlag = Boolean(flagCandidates && flagCandidates.length > 0);

  // Append explicit Flag status to summary so users and AI immediately know
  if (!hasFlag) {
    summary += `\n[สถานะ Flag: ℹ️ ไม่มีข้อมูลของ Flag ในไฟล์นี้ (ไม่พบสตริงก์ Flag มาตรฐาน)]`;
  } else {
    summary += `\n[สถานะ Flag: 🚩 ตรวจพบ ${flagCandidates.length} Flag Candidates ในสตริงก์]`;
  }

  return {
    id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    size: file.size,
    sizeFormatted,
    mimeType: file.type || 'application/octet-stream',
    category,
    categoryThai,
    magicHex,
    sha256,
    summary,
    recommendedAgentIds,
    hexdump,
    extractedStrings: extractedStrings.slice(0, 50),
    flagCandidates: Array.from(new Set(flagCandidates)),
    hasFlag,
    details,
    imageBase64,
    rawText
  };
}

/**
 * Format all attached files into high-density Markdown context for AI agents
 */
export function buildFilesContextPrompt(files: AttachedFile[]): string {
  if (!files || files.length === 0) return '';

  const sections = files.map((file, idx) => {
    let extraDetails = '';

    if (file.category === 'pcap' && file.details) {
      extraDetails = `
- **Packets Count**: ~${file.details.packetCount || 0}
- **Protocols Detected**: ${file.details.protocols?.join(', ') || 'N/A'}
- **Observed IP Addresses**: ${file.details.ipList?.slice(0, 10).join(', ') || 'N/A'}
${file.details.dnsQueries && file.details.dnsQueries.length > 0 ? `- **DNS Queries**: \n  * ${file.details.dnsQueries.slice(0, 8).join('\n  * ')}` : ''}
${file.details.httpRequests && file.details.httpRequests.length > 0 ? `- **HTTP Requests**: \n  * ${file.details.httpRequests.slice(0, 6).join('\n  * ')}` : ''}`;
    } else if (file.category === 'apk' && file.details) {
      extraDetails = `
${file.details.packageName ? `- **Package Name**: \`${file.details.packageName}\`` : ''}
${file.details.permissions && file.details.permissions.length > 0 ? `- **Permissions**: ${file.details.permissions.slice(0, 6).join(', ')}` : ''}
- **Key Archive Entries (APK Structure)**:
${file.details.zipEntries?.slice(0, 20).map(e => `  * ${e}`).join('\n') || '  * None'}`;
    } else if (file.category === 'binary' && file.details) {
      extraDetails = `
- **Target Architecture**: ${file.details.architecture || 'Unknown'}
- **Endianness**: ${file.details.endianness || 'Unknown'}`;
    } else if (file.category === 'archive' && file.details) {
      extraDetails = `
- **Archive Contents**:
${file.details.zipEntries?.slice(0, 15).map(e => `  * ${e}`).join('\n') || '  * None'}`;
    } else if (file.rawText) {
      extraDetails = `
- **File Content (${file.name})**:
\`\`\`
${file.rawText.slice(0, 4000)}
${file.rawText.length > 4000 ? '\n... [Remaining text truncated] ...' : ''}
\`\`\``;
    }

    let pythonAgentOutput = '';
    if (file.details?.pythonStdout) {
      pythonAgentOutput = `\n- **Local Python Stego Engine Analysis Output**:\n\`\`\`\n${file.details.pythonStdout}\n\`\`\``;
    }

    const flagAlert = file.flagCandidates && file.flagCandidates.length > 0
      ? `\n> 🚩 **FLAG STATUS:** ตรวจพบสตริงก์/LSB Flag ในไฟล์นี้: ${file.flagCandidates.map(f => `\`${f}\``).join(', ')}\n`
      : `\n> ℹ️ **FLAG STATUS:** ไม่มีข้อมูลของ Flag ในไฟล์นี้ (ไม่พบสตริงก์ Flag มาตรฐาน — เป็นไฟล์ทั่วไป หรือ Flag ซ่อนอยู่ใน Logic โปรแกรม ให้วิเคราะห์จากโครงสร้างภายในและข้อมูลที่แสดง)\n`;

    const stringsList = file.extractedStrings && file.extractedStrings.length > 0
      ? `\n<details>\n<summary>Top Extracted Strings (${file.extractedStrings.length})</summary>\n\n\`\`\`\n${file.extractedStrings.slice(0, 35).join('\n')}\n\`\`\`\n</details>`
      : '';

    const hexdumpView = file.hexdump
      ? `\n<details>\n<summary>File Header Hexdump (First 256 bytes)</summary>\n\n\`\`\`\n${file.hexdump}\n\`\`\`\n</details>`
      : '';

    return `### [ATTACHED FILE #${idx + 1}: ${file.name}]
- **Category**: ${file.categoryThai} (${file.category.toUpperCase()})
- **File Size**: ${file.sizeFormatted} (${file.size} bytes)
- **SHA-256**: \`${file.sha256}\`
- **Magic Bytes**: \`${file.magicHex}\`
- **Forensic Summary**: ${file.summary}
${extraDetails}
${pythonAgentOutput}
${flagAlert}
${stringsList}
${hexdumpView}`;
  });

  return `\n\n========================================\nATTACHED FORENSIC FILES & ARTIFACTS:\n========================================\n${sections.join('\n\n---\n\n')}\n========================================\n`;
}
