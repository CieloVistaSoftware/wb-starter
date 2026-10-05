/**
 * free-port.mjs — give one test run a port no other run on this machine has (#1073).
 *
 * Two halves, because either alone lets two runs share a port:
 *
 *   1. probeFreePort() asks the OS. Bind port 0, read what the kernel handed
 *      back, close. That proves the port was free at that instant — and nothing
 *      more. Between the probe and the moment Playwright's webServer actually
 *      binds it (seconds: `npm start`, server boot), the port is free again, and
 *      a second run probing in that window can be handed the very same number.
 *
 *   2. claimFreePort() closes that window. Every run records the port it took in
 *      the machine-wide coordination dir that the test lock already uses
 *      (~/.wb-starter/ports, WB_TEST_LOCK_DIR to override), with the "wx" flag so
 *      creating the claim is one atomic syscall. A port another LIVE run has
 *      claimed is skipped even if the OS says it is free. A claim whose owner has
 *      died is reaped, so a killed run cannot poison the port forever.
 *
 * There is deliberately NO fixed fallback. The old config fell back to 3310 in a
 * silent catch, and that fallback is what every run on the machine got for as
 * long as the probe was broken (#961, #1072, #1079): a fixed port is a port
 * someone else can be holding, and a run on it either dies with "already used"
 * or tests a stranger's server. If no isolated port can be had, this throws and
 * says why — a run that refuses to start is honest; a run on a shared port is not.
 *
 * Synchronous on purpose: playwright.config.ts is evaluated synchronously.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, openSync, writeSync, closeSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { defaultGlobalDir, isProcessRunning } from './test-lock.mjs';

/**
 * ES module source for the probe child (Tier-1 Law 3: no require, not even in a -e string).
 *
 * #1472: a test server binds PORT and PORT+1 (server.js WS_PORT, live reload),
 * on the default host. The probe used to ask for one port on 127.0.0.1 only, so
 * it could hand out a PORT whose PORT+1 another server held -- or a port free on
 * IPv4 loopback but taken on the dual-stack default -- and the server then died
 * with ":N is already in use". Now: bind like the server does, and accept PORT
 * only when PORT+1 binds too (up to 20 tries).
 */
const PROBE_SOURCE =
  "import { createServer } from 'node:net';" +
  "const bind = (port) => new Promise((res) => { const s = createServer(); s.once('error', () => res(null)); s.listen(port, () => res(s)); });" +
  "const close = (s) => new Promise((res) => s ? s.close(() => res()) : res());" +
  "for (let i = 0; i < 20; i++) {" +
  "  const a = await bind(0); if (!a) continue;" +
  "  const p = a.address().port; const b = p < 65535 ? await bind(p + 1) : null;" +
  "  await close(a); await close(b);" +
  "  if (b) { process.stdout.write(String(p)); process.exit(0); }" +
  "}" +
  "process.stderr.write('no port whose next port was also free in 20 tries'); process.exit(1);";

export function defaultPortClaimDir() {
  return join(defaultGlobalDir(), 'ports');
}

/** Ask the OS for a port that is free right now. Throws with the reason if it cannot. */
export function probeFreePort() {
  let out;
  try {
    out = execFileSync(process.execPath, ['--input-type=module', '-e', PROBE_SOURCE], {
      encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
    });
  } catch (e) {
    const stderr = e && e.stderr ? String(e.stderr).trim() : '';
    throw new Error(`the OS port probe failed: ${e && e.message ? e.message.split('\n')[0] : e}` +
      (stderr ? `\n${stderr}` : ''));
  }
  const port = Number(String(out).trim());
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`the OS port probe printed ${JSON.stringify(out)} instead of a port`);
  }
  return port;
}

function tryCreateClaim(file, pid) {
  let fd;
  try {
    fd = openSync(file, 'wx');
  } catch (e) {
    if (e && e.code === 'EEXIST') return false;
    throw e;
  }
  try { writeSync(fd, JSON.stringify({ pid, claimedAt: new Date().toISOString() })); }
  finally { closeSync(fd); }
  return true;
}

function readClaimPid(file) {
  try { return Number(JSON.parse(readFileSync(file, 'utf8')).pid) || 0; }
  catch { return 0; }
}

/**
 * Take a port that the OS says is free AND no other live run has claimed.
 *
 * @param {object}   [opts]
 * @param {string}   [opts.dir]       Claim directory (default ~/.wb-starter/ports).
 * @param {number}   [opts.pid]       Owner of the claim (default this process).
 * @param {() => number} [opts.probe] Injectable OS probe, so tests can force collisions.
 * @param {(pid: number) => boolean} [opts.isAlive] Injectable liveness check.
 * @param {number}   [opts.attempts]  Probes before giving up.
 * @returns {{ port: number, file: string, release: () => void }}
 * @throws  when no isolated port can be had — never returns a shared fallback.
 */
export function claimFreePort(opts = {}) {
  const dir = opts.dir || defaultPortClaimDir();
  const pid = opts.pid || process.pid;
  const probe = opts.probe || probeFreePort;
  const isAlive = opts.isAlive || isProcessRunning;
  const attempts = opts.attempts || 20;
  mkdirSync(dir, { recursive: true });

  // #1472: a claim on P covers P and P+1 (the server's live-reload port), so a
  // live claim on a NEIGHBOUR rules a port out too: P+1 is that run's live
  // reload, and a run on P-1 uses P. A dead neighbour's claim is reaped.
  const liveNeighbour = (port) => {
    for (const n of [port - 1, port + 1]) {
      const f = join(dir, `${n}.claim`);
      const holder = readClaimPid(f);
      if (!holder) continue;
      if (isAlive(holder)) return { port: n, holder };
      try { unlinkSync(f); } catch { /* another run reaped it first */ }
    }
    return null;
  };

  const skipped = [];
  for (let i = 0; i < attempts; i++) {
    const port = probe();
    const file = join(dir, `${port}.claim`);
    const near = liveNeighbour(port);
    if (near) {
      skipped.push(`${port} (next to ${near.port}, claimed by live pid ${near.holder}: its server binds both)`);
      continue;
    }
    if (tryCreateClaim(file, pid)) {
      return {
        port,
        file,
        release() {
          // Only ever remove our own claim: a reaped-and-retaken file is someone else's.
          if (readClaimPid(file) === pid) { try { unlinkSync(file); } catch { /* already gone */ } }
        },
      };
    }
    const holder = readClaimPid(file);
    if (holder && isAlive(holder)) {
      skipped.push(`${port} (claimed by live pid ${holder})`);
      continue;
    }
    // The owner died without releasing (killed run). Reap it; the next probe may
    // hand the port back out, and then it is claimed like any other.
    try { unlinkSync(file); } catch { /* another run reaped it first */ }
    skipped.push(`${port} (stale claim of dead pid ${holder || '?'} reaped)`);
  }
  throw new Error(
    `could not get an isolated test port after ${attempts} tries (claims in ${dir}).\n` +
    `  skipped: ${skipped.join(', ')}\n` +
    '  Refusing to fall back to a fixed port: another run could be holding it (#1073).\n' +
    '  Set WB_TEST_PORT to choose a port yourself.'
  );
}
