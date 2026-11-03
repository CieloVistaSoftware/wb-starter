/**
 * `npm run pro:local` (#1961): the free site and the WB Pro waitlist, running
 * together on this PC as if deployed, from one command.
 *
 * John, 2026-11-02: "be my helper don't make me run multiple commands".
 *
 *   1. Creates the waitlist table in a local database (safe to repeat).
 *   2. Starts the waitlist Worker on http://localhost:8787 (wrangler dev).
 *   3. Starts the site on http://localhost:3000, or the next free port.
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
// The project's own wrangler (a devDependency), never one npx fetches on the fly.
const wrangler = path.join(root, 'node_modules', '.bin', isWindows ? 'wrangler.cmd' : 'wrangler');

/** Print one line with this script's prefix. */
function say(message) {
  console.log(`[pro:local] ${message}`);
}

say('1/4 creating the local waitlist table...');
const table = spawnSync(wrangler, ['d1', 'execute', 'pro-waitlist', '--local', '--file=schema.sql'], {
  cwd: workerDir, stdio: 'inherit', shell: isWindows,
});
if (table.status !== 0) {
  say('could not create the local table (see above). Stopping.');
  process.exit(table.status ?? 1);
}

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

// The site first: server.js moves to the next free port when 3000 is taken
// (another copy of the site already running), and both the browser and the
// Worker's "Back to WB Pro" link must use the port it really got.
say('2/4 starting the site (port 3000, or the next free one) ...');
const site = spawn(process.execPath, ['server.js'], { cwd: root, stdio: ['ignore', 'pipe', 'inherit'] });
let sitePort = null;
site.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  for (const m of String(chunk).matchAll(/WB Starter running at http:\/\/localhost:(\d+)/g)) sitePort = Number(m[1]);
});

/** Stop the children that started, then this process. */
let worker = null;
function stopAll(code = 0) {
  for (const child of [worker, site]) {
    if (child && !child.killed) child.kill();
  }
  process.exit(code);
}
process.on('SIGINT', () => stopAll(0));
site.on('exit', (code) => { if (code) { say(`the site stopped (exit ${code}).`); stopAll(code); } });

// server.js prints "running at" for each port it tries; the one that answers is its own.
let siteUrl = null;
for (let i = 0; i < 60 && !siteUrl; i += 1) {
  if (sitePort) {
    try {
      await fetch(`http://localhost:${sitePort}/`);
      siteUrl = `http://localhost:${sitePort}/`;
      break;
    } catch { /* not answering yet */ }
  }
  await new Promise((r) => setTimeout(r, 1000));
}
if (!siteUrl) {
  say('the site did not start within 60 seconds (see above).');
  stopAll(1);
}
if (sitePort !== 3000) say(`port 3000 is taken (another copy of the site is running), so this one is on ${sitePort}.`);

// LOCAL_DEV=1: the local Worker takes sign-ups from a site on this PC, any port.
say('3/4 starting the waitlist Worker on http://localhost:8787 ...');
worker = spawn(wrangler, ['dev', '--port', '8787', '--var', 'LOCAL_DEV:1', '--var', `PRO_PAGE_URL:${siteUrl}?page=pro`], {
  cwd: workerDir, stdio: 'inherit', shell: isWindows,
});
worker.on('exit', (code) => { if (code) { say(`the Worker stopped (exit ${code}).`); stopAll(code); } });

if (!(await waitFor('http://localhost:8787/'))) {
  say('the Worker did not start within 60 seconds (see above).');
  stopAll(1);
}
say(`4/4 ready. Opening ${siteUrl} -- click WB Pro in the menu, then Join the waitlist. Ctrl+C stops both.`);
if (process.env.WB_NO_OPEN !== '1') {
  const opener = isWindows ? ['cmd', ['/c', 'start', '', siteUrl]] : process.platform === 'darwin' ? ['open', [siteUrl]] : ['xdg-open', [siteUrl]];
  spawn(opener[0], opener[1], { stdio: 'ignore', detached: true }).unref();
}
