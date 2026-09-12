import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tokenFilePath = path.resolve(__dirname, '../src/config/token.json');

const allowedTokens = [
  'dev',
  'satang_is_the_ultimate_god_hacker_ctf_master_99999999_never_gonna_give_you_up_never_gonna_let_you_down_satangttv4Xd'
];

const data = {
  tokens: allowedTokens,
  updatedAt: new Date().toISOString()
};

fs.writeFileSync(tokenFilePath, JSON.stringify(data, null, 2), 'utf-8');

console.log('\n' + '='.repeat(65));
console.log(' 👑 STATIC TOKENS UPDATED 👑 ');
console.log('='.repeat(65));
console.log('\n[✔] Active Allowed Tokens:\n');
allowedTokens.forEach((t, i) => {
  console.log(` ${i + 1}. \x1b[36m${t}\x1b[0m`);
});
console.log('\n' + '-'.repeat(65));
console.log(`Saved to: ${path.relative(process.cwd(), tokenFilePath)}`);
console.log('='.repeat(65) + '\n');
