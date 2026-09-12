import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tokenFilePath = path.resolve(__dirname, '../src/config/token.json');

const args = process.argv.slice(2);
const mode = args[0] || 'satang';

const satangMemes = [
  'satang_is_the_ultimate_god_hacker_ctf_master_99999999_never_gonna_give_you_up_never_gonna_let_you_down_satangttv4Xd',
  'satang_0xDEADBEEF_0x1337_0xCAFEBABE_he_is_not_human_he_is_a_cyber_god_token_999999',
  'satang_giga_chad_ultra_instinct_flag_bypass_key_77777777777777777777777777777777',
  'satang_so_rich_100_million_baht_satangttv4Xd_super_ultra_mega_hacker_token_000000000000000',
  'satang_bypass_everything_admin_godmode_unlocked_9999_zero_day_master'
];

let newToken = '';

if (mode.toLowerCase().includes('satang')) {
  newToken = satangMemes[Math.floor(Math.random() * satangMemes.length)];
} else {
  const prefix = 'ctf_swarm_sec_';
  const randomHex = crypto.randomBytes(32).toString('hex');
  newToken = `${prefix}${randomHex}`;
}

// Single token array
const data = {
  tokens: [newToken],
  updatedAt: new Date().toISOString()
};

fs.writeFileSync(tokenFilePath, JSON.stringify(data, null, 2), 'utf-8');

console.log('\n' + '='.repeat(65));
console.log(' 👑 SATANG SPECIAL EDITION - STATIC TOKEN GENERATOR 👑 ');
console.log('='.repeat(65));
console.log('\n[✔] Active Single Token Set Successfully!\n');
console.log('👉 ACTIVE TOKEN:\n');
console.log(`\x1b[36m${newToken}\x1b[0m\n`);
console.log('-'.repeat(65));
console.log(`Saved to: ${path.relative(process.cwd(), tokenFilePath)}`);
console.log('='.repeat(65) + '\n');
