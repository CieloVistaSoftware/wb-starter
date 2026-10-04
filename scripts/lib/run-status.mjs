/**
 * run-status.mjs -- a test-async run always ends with a terminal state (#1316).
 *
 * A compliance suite ran all 5082 tests and its data/test-status.json stayed at
 * "running" forever: no completedAt, no exitCode, the monitor and Playwright
 * both gone. The monitor's close handler is async and awaits several steps
 * before it writes the file; a throw in any of them is an unhandled rejection,
 * which ends the process before anything is written. Anyone waiting on `state`
 * then waits forever, and nothing says why.
 *
 * Two halves:
 *   installDeathGuards() -- the monitor writes a terminal state synchronously on
 *     an uncaught exception, an unhandled rejection, a signal, or an exit that
 *     happens before the run was finalized.
 *   isRunDead() -- a hard kill runs no handler at all, so a reader can still tell:
 *     "running" while neither the monitor nor Playwright is alive is dead.
 */
import { writeFileSync } from 'node:fs';

const TERMINAL = new Set(['passed', 'failed', 'unreliable', 'error', 'stopped', 'died', 'server-down', 'no-tests']);

/** True when a status has reached an end state. */
export function isTerminal(status) {
  return !!status && TERMINAL.has(status.state);
}

/** The status with a terminal `died` state and the reason recorded. Pure. */
export function markDied(status, reason, now = new Date().toISOString()) {
  return {
    ...status,
    state: 'died',
    updatedAt: now,
    completedAt: status.completedAt || now,
    exitCode: status.exitCode ?? -1,
    diedReason: reason,
    errors: [status.errors, `test-async monitor died before finalizing: ${reason}`].filter(Boolean).join('\n'),
  };
}

/**
 * "running", yet neither the monitor nor the Playwright process it recorded is
 * alive: the run is dead even though the file never said so.
 * @param {(pid: number) => boolean} isAlive
 */
export function isRunDead(status, isAlive) {
  if (!status || status.state !== 'running') return false;
  const pids = [status.monitorPid, status.pid].filter((p) => Number.isInteger(p) && p > 0);
  if (!pids.length) return false; // too early to know: nothing recorded yet
  return pids.every((p) => !isAlive(p));
}

/**
 * Make the monitor's death write itself down.
 * @param {string} statusFile
 * @param {() => object} getStatus  the monitor's live status object
 */
export function installDeathGuards(statusFile, getStatus) {
  let written = false;
  const finalize = (reason) => {
    if (written) return;
    const status = getStatus();
    if (!status || isTerminal(status)) return;
    written = true;
    try { writeFileSync(statusFile, JSON.stringify(markDied(status, reason), null, 2)); } catch { /* nothing left to report to */ }
  };
  process.on('uncaughtException', (err) => {
    finalize(`uncaught exception: ${err?.stack || err}`);
    console.error('test-async monitor crashed:', err);
    process.exit(1);
  });
  process.on('unhandledRejection', (err) => {
    finalize(`unhandled rejection: ${err?.stack || err}`);
    console.error('test-async monitor crashed (unhandled rejection):', err);
    process.exit(1);
  });
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
    try {
      process.on(sig, () => { finalize(`received ${sig}`); process.exit(1); });
    } catch { /* signal not supported on this platform */ }
  }
  process.on('exit', (code) => finalize(`exited with code ${code} before the run was finalized`));
  return finalize;
}
