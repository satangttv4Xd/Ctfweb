import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tokenFilePath = path.resolve(__dirname, '../src/config/token.json');

// Generate secure long random hex token (64 hex characters)
const prefix = 'ctf_swarm_sec_';
const randomHex = crypto.randomBytes(32).toString('hex'); // 64 chars
const newToken = `${prefix}${randomHex}`;

// Save to token.json
const data = {
  tokens: [newToken],
  updatedAt: new Date().toISOString()
};

fs.writeFileSync(tokenFilePath, JSON.stringify(data, null, 2), 'utf-8');

console.log('\n' + '='.repeat(60));
console.log(' 🔐 CTF SWARM - STATIC TOKEN GENERATOR ');
console.log('='.repeat(60));
console.log('\n[✔] New Long Static Token Generated Successfully!\n');
console.log('👉 Token:\n');
console.log(`\x1b[36m${newToken}\x1b[0m\n`);
console.log('-'.repeat(60));
console.log(`Saved to: ${path.relative(process.cwd(), tokenFilePath)}`);
console.log('Use this token to unlock the CTF Swarm web application.');
console.log('='.repeat(60) + '\n');
