// npm run waitlist          who joined on this PC (the npm run pro:local list)
// npm run waitlist -- --remote   who joined the real list on Cloudflare
//
// Every worktree would otherwise read its own empty local database and fail
// with "no such table" (#1961), so the local list is always read from the main
// checkout, where npm run pro:local keeps it.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

console.clear(); // John: start each waitlist command on a clear terminal.

const here = path.dirname(fileURLToPath(import.meta.url));
const workerDir = path.join(here, '..', 'server', 'waitlist');
const remote = process.argv.includes('--remote');

const args = ['d1', 'execute', 'pro-waitlist'];
if (remote) {
  args.push('--remote');
} else {
  const commonDir = spawnSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
    cwd: here, encoding: 'utf8',
  }).stdout.trim();
  const mainCheckout = commonDir ? path.dirname(commonDir) : path.join(here, '..');
  const state = path.join(mainCheckout, 'server', 'waitlist', '.wrangler', 'state');
  args.push('--local', '--persist-to', `"${state}"`);
}
args.push('--command', '"SELECT * FROM waitlist ORDER BY joined_at"');

// npm puts wrangler on the PATH, including from a worktree with no packages of its own.
const run = spawnSync(`wrangler ${args.join(' ')}`, { cwd: workerDir, stdio: 'inherit', shell: true });
process.exit(run.status ?? 1);
