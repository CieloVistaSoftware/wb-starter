/**
 * `npm run pro:local` (#1961): the free site and the WB Pro waitlist, running
 * together on this PC as if deployed, from one command.
 *
 * John, 2026-11-02: "be my helper don't make me run multiple commands".
 *
 *   1. Creates the waitlist table in a local database (safe to repeat).
 *   2. Starts the waitlist Worker on http://localhost:8787 (wrangler dev).
 *   3. Starts the site on http://localhost:3000 (npm start's server).
 *   4. Opens the free Home page. From there: WB Pro in the menu, then join.
 *
 * Ctrl+C stops both. Who joined:
 *   npx wrangler d1 execute pro-waitlist --local --command "SELECT * FROM waitlist"
 * (run from server/waitlist). Nothing here touches Cloudflare's servers.
 */
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workerDir = path.join(root, 'server', 'waitlist');
const isWindows = process.platform === 'win32';
const npx = isWindows ? 'npx.cmd' : 'npx';
const SITE = 'http://localhost:3000/';

/** Print one line with this script's prefix. */
function say(message) {
  console.log(`[pro:local] ${message}`);
}

say('1/4 creating the local waitlist table...');
const table = spawnSync(npx, ['--yes', 'wrangler', 'd1', 'execute', 'pro-waitlist', '--local', '--file=schema.sql'], {
  cwd: workerDir, stdio: 'inherit', shell: isWindows,
});
if (table.status !== 0) {
  say('could not create the local table (see above). Stopping.');
  process.exit(table.status ?? 1);
}

say('2/4 starting the waitlist Worker on http://localhost:8787 ...');
const worker = spawn(npx, ['--yes', 'wrangler', 'dev', '--port', '8787', '--var', `PRO_PAGE_URL:${SITE}?page=pro`], {
  cwd: workerDir, stdio: 'inherit', shell: isWindows,
});

say(`3/4 starting the site on ${SITE} ...`);
const site = spawn(process.execPath, ['server.js'], { cwd: root, stdio: 'inherit' });

/** Stop both children, then this process. */
function stopAll(code = 0) {
  for (const child of [worker, site]) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}
process.on('SIGINT', () => stopAll(0));
worker.on('exit', (code) => { if (code) { say(`the Worker stopped (exit ${code}).`); stopAll(code); } });
site.on('exit', (code) => { if (code) { say(`the site stopped (exit ${code}).`); stopAll(code); } });

/** Wait until an address answers, then resolve. Gives up after 60 s. */
async function waitFor(url) {
  for (let i = 0; i < 60; i += 1) {
    try {
      await fetch(url);
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return false;
}

const ready = (await waitFor(SITE)) && (await waitFor('http://localhost:8787/'));
if (!ready) {
  say('the site or the Worker did not start within 60 seconds (see above).');
  stopAll(1);
}
say(`4/4 ready. Opening ${SITE} -- click WB Pro in the menu, then Join the waitlist. Ctrl+C stops both.`);
if (process.env.WB_NO_OPEN !== '1') {
  const opener = isWindows ? ['cmd', ['/c', 'start', '', SITE]] : process.platform === 'darwin' ? ['open', [SITE]] : ['xdg-open', [SITE]];
  spawn(opener[0], opener[1], { stdio: 'ignore', detached: true }).unref();
}
