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

/** ES module source for the probe child (Tier-1 Law 3: no require, not even in a -e string). */
const PROBE_SOURCE =
  "import { createServer } from 'node:net';" +
  "const s = createServer();" +
  "s.on('error', (e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });" +
  "s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => process.stdout.write(String(p))); });";

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

  const skipped = [];
  for (let i = 0; i < attempts; i++) {
    const port = probe();
    const file = join(dir, `${port}.claim`);
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
