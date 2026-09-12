import { describe, it, expect } from 'bun:test';
import { findFlagCandidates, buildFilesContextPrompt } from './fileAnalyzer';
import type { AttachedFile } from '../types';

describe('CTF File Analyzer & Flag Detector', () => {
  it('identifies when a general file has NO flag', () => {
    const generalStrings = [
      'Welcome to MyApp v1.0',
      'System.out.println',
      'android.permission.INTERNET',
      'com.example.lottery.MainActivity',
      'database_user=admin',
      'https://api.example.com/v1/status'
    ];

    const candidates = findFlagCandidates(generalStrings);
    expect(candidates.length).toBe(0);

    const testFile: AttachedFile = {
      id: 'f1',
      name: '01-lottery-checker.apk',
      size: 1048576,
      sizeFormatted: '1.0 MB',
      mimeType: 'application/vnd.android.package-archive',
      category: 'apk',
      categoryThai: 'แอปพลิเคชัน Android (APK)',
      magicHex: '50 4b 03 04',
      sha256: 'abcdef1234567890abcdef1234567890',
      summary: 'Android APK package\n[สถานะ Flag: ℹ️ ไม่มีข้อมูลของ Flag ในไฟล์นี้ (ไม่พบสตริงก์ Flag มาตรฐาน)]',
      recommendedAgentIds: ['mobilex', 'reveng'],
      flagCandidates: candidates,
      hasFlag: false,
      details: {
        packageName: 'com.example.lottery',
        zipEntries: ['AndroidManifest.xml', 'classes.dex', 'res/values/strings.xml']
      }
    };

    expect(testFile.hasFlag).toBe(false);
    expect(testFile.flagCandidates?.length).toBe(0);

    const prompt = buildFilesContextPrompt([testFile]);
    expect(prompt).toContain('ไม่มีข้อมูลของ Flag ในไฟล์นี้');
    expect(prompt).toContain('com.example.lottery');
    expect(prompt).toContain('classes.dex');
  });

  it('identifies when a file DOES contain a CTF flag', () => {
    const flagStrings = [
      'Normal line 1',
      'Here is the answer: flag{android_secret_token_1337}',
      'Another line'
    ];

    const candidates = findFlagCandidates(flagStrings);
    expect(candidates.length).toBe(1);
    expect(candidates[0]).toBe('flag{android_secret_token_1337}');

    const testFile: AttachedFile = {
      id: 'f2',
      name: 'challenge.elf',
      size: 16384,
      sizeFormatted: '16.0 KB',
      mimeType: 'application/x-executable',
      category: 'binary',
      categoryThai: 'ไฟล์ไบนารี ELF (Linux Executable)',
      magicHex: '7f 45 4c 46',
      sha256: '1234567890abcdef1234567890abcdef',
      summary: 'Linux ELF binary\n[สถานะ Flag: 🚩 ตรวจพบ 1 Flag Candidates ในสตริงก์]',
      recommendedAgentIds: ['reveng', 'pwnmaster'],
      flagCandidates: candidates,
      hasFlag: true
    };

    const prompt = buildFilesContextPrompt([testFile]);
    expect(prompt).toContain('flag{android_secret_token_1337}');
  });

  it('extracts and displays internal raw text for general text/code files without flag', () => {
    const sourceCode = `
#include <stdio.h>
int main() {
    printf("Hello General File\\n");
    return 0;
}
    `.trim();

    const testFile: AttachedFile = {
      id: 'f3',
      name: 'main.c',
      size: sourceCode.length,
      sizeFormatted: `${sourceCode.length} B`,
      mimeType: 'text/x-c',
      category: 'text',
      categoryThai: 'ซอร์สโค้ด / ข้อความ Text',
      magicHex: '23 69 6e 63',
      sha256: '999888777666',
      summary: 'ไฟล์ภาษา C\n[สถานะ Flag: ℹ️ ไม่มีข้อมูลของ Flag ในไฟล์นี้ (ไม่พบสตริงก์ Flag มาตรฐาน)]',
      recommendedAgentIds: ['reveng'],
      flagCandidates: [],
      hasFlag: false,
      rawText: sourceCode
    };

    const prompt = buildFilesContextPrompt([testFile]);
    expect(prompt).toContain('ไม่มีข้อมูลของ Flag ในไฟล์นี้');
    expect(prompt).toContain('Hello General File');
  });
});
