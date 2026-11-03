/**
 * `npm run pro:local` (#1961): the free site and the WB Pro waitlist, running
 * together on this PC as if deployed, from one command.
 *
 * John, 2026-11-02: "be my helper don't make me run multiple commands".
 *
 *   1. Creates the waitlist table in a local database (safe to repeat).
 *   2. Starts the waitlist Worker on http://localhost:8787 (wrangler dev).
 *   3. Starts the site on http://localhost:3000. Ports are fixed: a leftover
 *      copy of the site or Worker is stopped first (scripts/claim-port.mjs).
 *   4. Opens the free Home page. From there: WB Pro in the menu, then join.
 *
 * Ctrl+C stops both. Who joined:
 *   npx wrangler d1 execute pro-waitlist --local --command "SELECT * FROM waitlist"
 * (run from server/waitlist). Nothing here touches Cloudflare's servers.
 */
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { claim, killTree } from './claim-port.mjs';

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
      await fetch(url, { signal: AbortSignal.timeout(2000) });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return false;
}

// Fixed ports (John: "the ports should always be known"): the site on 3000,
// the Worker on 8787. A leftover copy of either is stopped first; anything
// else holding them stops this run with its name (scripts/claim-port.mjs).
const SITE_PORT = 3000;
const WORKER_PORT = 8787;
for (const port of [SITE_PORT, WORKER_PORT]) {
  if (!(await claim(port))) process.exit(1);
}
const siteUrl = `http://localhost:${SITE_PORT}/`;

// PORT set explicitly: server.js never moves to another port; a busy port is a hard error.
say(`2/4 starting the site on ${siteUrl} ...`);
const site = spawn(process.execPath, ['server.js'], { cwd: root, stdio: 'inherit', env: { ...process.env, PORT: String(SITE_PORT) } });

/** Stop the children that started, then this process. */
let worker = null;
function stopAll(code = 0) {
  // The whole tree: on Windows the Worker is cmd.exe -> wrangler -> workerd.
  for (const child of [worker, site]) {
    if (child && child.pid && child.exitCode === null) killTree(child.pid);
  }
  process.exit(code);
}
process.on('SIGINT', () => stopAll(0));
site.on('exit', (code) => { if (code) { say(`the site stopped (exit ${code}).`); stopAll(code); } });

if (!(await waitFor(siteUrl))) {
  say('the site did not start within 60 seconds (see above).');
  stopAll(1);
}

// LOCAL_DEV=1: the local Worker takes sign-ups from a site on this PC, any port.
say('3/4 starting the waitlist Worker on http://localhost:8787 ...');
worker = spawn(wrangler, ['dev', '--port', String(WORKER_PORT), '--var', 'LOCAL_DEV:1', '--var', `PRO_PAGE_URL:${siteUrl}?page=pro`], {
  cwd: workerDir, stdio: 'inherit', shell: isWindows,
});
worker.on('exit', (code) => { if (code) { say(`the Worker stopped (exit ${code}).`); stopAll(code); } });

// The page posts to 127.0.0.1:8787 (wrangler dev listens on IPv4 only), so
// that exact address must answer as the waitlist Worker before "ready".
async function workerAnswers() {
  try {
    const res = await fetch(`http://127.0.0.1:${WORKER_PORT}/health`, { signal: AbortSignal.timeout(2000) });
    const body = await res.json();
    return body.app === 'pro-waitlist';
  } catch {
    return false;
  }
}
let workerReady = false;
for (let i = 0; i < 60 && !workerReady; i += 1) {
  workerReady = await workerAnswers();
  if (!workerReady) await new Promise((r) => setTimeout(r, 1000));
}
if (!workerReady) {
  say(`the waitlist Worker did not answer at http://127.0.0.1:${WORKER_PORT}/health within 60 seconds (see above). Not opening the page: joining would fail.`);
  stopAll(1);
}
say(`4/4 ready. Opening ${siteUrl} -- click WB Pro in the menu, then Join the waitlist. Ctrl+C stops both.`);
if (process.env.WB_NO_OPEN !== '1') {
  const opener = isWindows ? ['cmd', ['/c', 'start', '', siteUrl]] : process.platform === 'darwin' ? ['open', [siteUrl]] : ['xdg-open', [siteUrl]];
  spawn(opener[0], opener[1], { stdio: 'ignore', detached: true }).unref();
}
