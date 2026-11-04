// npm run waitlist:verify            check every address on the real list
// npm run waitlist:verify -- --local check the test list from npm run pro:local
//
// Reports good, bad or unknown for each address and changes nothing. It runs
// from this PC because it needs outgoing port 25 (#1966).
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyMailbox } from './lib/smtp-verify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const workerDir = path.join(here, '..', 'server', 'waitlist');
const local = process.argv.includes('--local');
const PAUSE_MS = 2000; // Many quick probes from one connection can get it blocked.

const args = ['d1', 'execute', 'pro-waitlist', '--json'];
if (local) {
  const commonDir = spawnSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
    cwd: here, encoding: 'utf8',
  }).stdout.trim();
  const mainCheckout = commonDir ? path.dirname(commonDir) : path.join(here, '..');
  args.push('--local', '--persist-to', `"${path.join(mainCheckout, 'server', 'waitlist', '.wrangler', 'state')}"`);
} else {
  args.push('--remote');
}
args.push('--command', '"SELECT email FROM waitlist ORDER BY joined_at"');

const query = spawnSync(`wrangler ${args.join(' ')}`, { cwd: workerDir, encoding: 'utf8', shell: true });
if (query.status !== 0) {
  console.error(`[waitlist:verify] could not read the list:\n${query.stdout}${query.stderr}`);
  process.exit(1);
}
const emails = JSON.parse(query.stdout)[0].results.map((row) => row.email);
console.log(`[waitlist:verify] ${emails.length} address(es) on the ${local ? 'local' : 'real'} list`);

const counts = { good: 0, bad: 0, unknown: 0 };
for (const [index, email] of emails.entries()) {
  if (index > 0) await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
  const { result, why } = await verifyMailbox(email);
  counts[result] += 1;
  console.log(`${result.padEnd(8)}${email}  (${why})`);
}
console.log(`[waitlist:verify] good ${counts.good}, bad ${counts.bad}, unknown ${counts.unknown}. Nothing was sent or changed.`);
