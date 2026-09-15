/**
 * hold-machine.mjs — every Playwright run on the commit and release path takes
 * the machine-wide lock and is bounded (#1106, #1128).
 *
 * #1106 did this for the 10th-commit gate only, inline in
 * .husky/gate-staged-tree.mjs. Three other launchers on the same path took no
 * lock and had no time limit: scripts/release.mjs (the full ratchet),
 * scripts/priority-gate.mjs (every commit, on a fixed port 3399), and the
 * project-integrity run at the end of .husky/pre-commit. Two commits at once
 * collided, and any of them could hang a commit forever. The gate's own wait
 * for the lock had no end either, so a holder that stayed alive but stuck
 * stalled every commit behind it.
 *
 * One mechanism, here, used by all four:
 *
 *   withMachine()  take the lock (a suite) or a slot (a single run) through
 *                  scripts/lib/test-lock.mjs, waiting on release NOTIFICATIONS
 *                  with a deadline; release it on every exit path.
 *   runBounded()   spawnSync with a timeout; a timeout is reported as a HANG,
 *                  never as a verdict.
 *   gateBounds()   the numbers, and the env knobs that tune them.
 *
 * Guarded by scripts/test-gate-guards.mjs, which drives the real scripts.
 */

import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { createGuards } from './test-lock.mjs';

/**
 * The bounds, in milliseconds. Rounded: spawnSync throws on a non-integer
 * timeout, and many fractional overrides are not integers once multiplied
 * (0.01 -> 300599.99999999994, #1106).
 *
 *   suiteMs     the outer bound around .husky/test-ratchet.mjs -- five minutes
 *               past its own 75-minute ceiling, so the ratchet's more specific
 *               message fires first. WB_GATE_TIMEOUT_MIN overrides both.
 *   specMs      a few named specs (priority-1, project-integrity). About a
 *               minute is normal. WB_GATE_SPEC_TIMEOUT_MIN.
 *   lockWaitMs  how long to wait for someone else's run. The longest legitimate
 *               holder on the commit path is another gate at suiteMs, so a
 *               holder still there five minutes after that is stuck, not slow.
 *               WB_GATE_LOCK_WAIT_MIN.
 */
export function gateBounds(env = process.env) {
  const suiteMin = Number(env.WB_GATE_TIMEOUT_MIN) || 75;
  const min = (m) => Math.round(m * 60 * 1000);
  return {
    suiteMs: min(suiteMin + 5),
    specMs: min(Number(env.WB_GATE_SPEC_TIMEOUT_MIN) || 15),
    lockWaitMs: min(Number(env.WB_GATE_LOCK_WAIT_MIN) || suiteMin + 10),
  };
}

const minutes = (ms) => `${Math.round((ms / 60000) * 100) / 100} minute(s)`;

/**
 * The environment a test run starts from when a git hook launches it (#1160).
 *
 * Git exports GIT_DIR, GIT_INDEX_FILE and friends to hooks so the hook's own git
 * commands find the repository. Handed down to the suite, they aim every spec
 * that builds a throwaway git repo at the REAL one. From a linked worktree
 * GIT_DIR is absolute and the spec's `git add -A` dies with "this operation must
 * be run in a work tree" -- which the 10th-commit gate then scored as three NEW
 * failures and blocked a commit (2026-09-14). From the main checkout GIT_DIR is
 * the relative `.git`, which only resolves to the temp repo by accident, while
 * GIT_INDEX_FILE still names the real index.
 */
export function suiteEnv(base = process.env) {
  return Object.fromEntries(Object.entries(base).filter(([k]) => !/^GIT_/.test(k)));
}

/**
 * Hold the machine while `work` runs.
 *
 * @param {object}  o
 * @param {string}  o.root            this checkout, for the holder record
 * @param {'suite'|'single'} o.kind   a suite needs the machine empty; a single needs a slot
 * @param {string}  o.label           who holds it, as other runs will be told
 * @param {string}  [o.specFile]      a single run: what its slot names
 * @param {number}  o.waitMs          give up waiting after this long
 * @param {boolean} [o.handleSignals] default true; false when the caller has its
 *                                    own handler that ends in process.exit()
 * @param {() => any | Promise<any>} work
 * @returns {Promise<{held: true, result: any} | {held: false, why: string}>}
 */
export async function withMachine(o, work) {
  const guards = createGuards({ root: o.root });
  let release = null;
  // 'exit' fires for process.exit() from anywhere, including a signal handler,
  // so a run killed by Ctrl-C does not leave the machine locked behind it.
  const releaseNow = () => {
    const r = release;
    release = null;
    if (r) { try { rmSync(r, { force: true }); } catch { /* best effort */ } }
  };
  const onSignal = () => process.exit(130);
  process.on('exit', releaseNow);
  if (o.handleSignals !== false) for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, onSignal);

  const onHeld = (why) => {
    console.log(`[${o.label}] the machine is busy -- subscribed; starts the moment it is released ` +
      `(gives up after ${minutes(o.waitMs)}).`);
    console.log(why);
  };

  try {
    if (o.kind === 'suite') {
      const denied = await guards.acquireSuiteLockOnRelease(
        new Date().toISOString(), o.label, onHeld, { timeoutMs: o.waitMs });
      if (denied !== null) return { held: false, why: denied };
      release = guards.lockFile;
      await guards.bindSuiteLock(process.pid, { command: o.label });
    } else {
      const { slot, why } = await guards.acquireSingleSlotOnRelease(
        o.specFile || o.label, onHeld, { timeoutMs: o.waitMs });
      if (!slot) return { held: false, why };
      release = slot;   // acquireSingleSlot already keyed it to this process
    }
    return { held: true, result: await work() };
  } finally {
    releaseNow();
    process.removeListener('exit', releaseNow);
    for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.removeListener(sig, onSignal);
  }
}

/** The message for a run that never got the machine. Not a verdict on anything. */
export function reportBusy(label, waitMs, why) {
  console.error(
    `\n[${label}] gave up waiting: the machine stayed busy for ${minutes(waitMs)}.\n` +
    `${why}\n` +
    `[${label}] A holder alive that long is stuck, not slow. Nothing was tested, so\n` +
    `[${label}] nothing is known. Find that process, then try again.\n`
  );
}

/**
 * spawnSync, bounded. stdio is inherited unless the caller says otherwise.
 * @returns {{status: number|null, hung: boolean, error: Error|undefined}}
 */
export function runBounded(command, args, { timeoutMs, label, ...spawnOptions }) {
  const run = spawnSync(command, args, {
    stdio: 'inherit',
    ...spawnOptions,
    timeout: timeoutMs,
    killSignal: 'SIGKILL',
  });
  const hung = !!run.error && (run.error.code === 'ETIMEDOUT' || run.signal === 'SIGKILL');
  if (hung) {
    console.error(
      `\n[${label}] did not finish within ${minutes(timeoutMs)} and was killed.\n` +
      `[${label}] That is a HANG, not a verdict. Look for another Playwright\n` +
      `[${label}] process or a dev server holding the port, then try again.\n`
    );
  } else if (run.error) {
    console.error(`[${label}] could not start: ${run.error.message}`);
  }
  return { status: run.status, hung, error: run.error };
}

/**
 * Run named spec files through Playwright's CLI, holding a single-run slot and
 * bounded. The port is NOT chosen here: playwright.config.ts asks the OS for a
 * free one and pins it for every worker (#1079). A fixed port -- 3399 was one --
 * is a port two commits at once both believe is theirs.
 *
 * @returns {Promise<{held: false, why: string} | {held: true, status: number|null, hung: boolean}>}
 */
export async function runSpecsHoldingSlot({ root, cli, specs, args = [], label }) {
  const { specMs, lockWaitMs } = gateBounds();
  const env = suiteEnv();
  delete env.WB_TEST_PORT;
  const outcome = await withMachine(
    { root, kind: 'single', label, specFile: specs.join(' '), waitMs: lockWaitMs },
    () => runBounded(process.execPath, [cli, 'test', ...specs, ...args], {
      cwd: root, env, timeoutMs: specMs, label,
    })
  );
  if (!outcome.held) {
    reportBusy(label, lockWaitMs, outcome.why);
    return outcome;
  }
  return { held: true, ...outcome.result };
}
