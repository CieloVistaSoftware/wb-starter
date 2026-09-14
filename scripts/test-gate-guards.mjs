/**
 * test-gate-guards.mjs — the commit gate is bounded, and holds the machine (#1106).
 *
 * WHY THIS EXISTS
 *
 * #1106 was closed once on a fix that had never been seen to fail, and hung
 * again the same evening. scripts/test-lock-guards.mjs proves the LOCK LIBRARY
 * refuses a single run while a suite holds the machine -- but nothing proved the
 * GATE ever takes that lock, or that the gate's bounds ever fire. Delete the
 * acquire from .husky/gate-staged-tree.mjs, or the watchdog from
 * .husky/test-ratchet.mjs, and every existing check stayed green.
 *
 * This drives the two real gate scripts, unmodified, against fixtures:
 *
 *   RATCHET  .husky/test-ratchet.mjs is copied into a throwaway directory whose
 *            node_modules/@playwright/test/cli.js is a fake. The fake prints the
 *            per-test lines Playwright's REAL list reporter prints (the reporter
 *            is loaded from this repo's node_modules), or prints nothing.
 *   GATE     .husky/gate-staged-tree.mjs runs in a throwaway git repo whose
 *            staged .husky/test-ratchet.mjs is a stub that runs until told to
 *            stop, so the lock can be inspected while the "suite" is running.
 *
 * No Playwright run, no dev server, no browser. The real ~/.wb-starter lock is
 * never touched: every gate here gets its own WB_TEST_LOCK_DIR.
 *
 * THE DEFECTS THIS FOUND
 *
 * 1. The silence watchdog (7e67e08b) reset only on lines matching `ok|x|-`.
 *    Playwright's list reporter prints `ok`/`x` only on a Windows console that
 *    is neither Windows Terminal nor VS Code; under WT_SESSION or
 *    TERM_PROGRAM=vscode it prints U+2713 / U+2718, and under FORCE_COLOR the
 *    mark is wrapped in ANSI codes. The hook inherits the committer's
 *    environment, so from any of those the watchdog saw zero tests finish and
 *    killed a healthy gate as a "stall" three minutes in.
 * 2. The gate's outer bound was not rounded, and spawnSync throws on a
 *    non-integer timeout, so many fractional WB_GATE_TIMEOUT_MIN values crashed
 *    the gate before it ran anything.
 *
 * PROVEN BOTH WAYS: with 78a876ba's two gate files restored to their parent
 * (the #1106 fix reverted) this reports 14 failures -- the ratchet never
 * returns, the gate takes no lock, the outer bound never fires.
 *
 * Run: npm run test:gate-guards
 */

import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, rm, mkdir, copyFile, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGuards, isProcessRunning } from './lib/test-lock.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LIST_REPORTER = join(REPO, 'node_modules', 'playwright', 'lib', 'reporters', 'list.js');

let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name}`);
    if (detail) console.log(`     ${String(detail).split('\n').join('\n     ')}`);
  }
}

/**
 * The environment a child starts from. Git exports GIT_DIR / GIT_INDEX_FILE to
 * hooks, and this runs FROM the pre-commit hook -- inherited, they would point
 * the fixture's git commands at the real repository's index. Terminal and gate
 * knobs are cleared so each case sets exactly what it tests.
 */
function cleanEnv(extra = {}) {
  const env = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (/^GIT_/.test(k)) continue;
    if (/^WB_GATE_/.test(k) || k === 'WB_TEST_LOCK_DIR' || k === 'WB_TEST_PORT') continue;
    if (['WT_SESSION', 'TERM_PROGRAM', 'FORCE_COLOR', 'DEBUG_COLORS', 'PLAYWRIGHT_FORCE_TTY', 'CI', 'NODE_OPTIONS'].includes(k)) continue;
    env[k] = v;
  }
  return { ...env, ...extra };
}

/**
 * Start a node script and collect its output. Every child is bounded by this
 * harness too: a guard that can hang is the defect it is guarding against.
 */
function start(script, { cwd, env, boundMs }) {
  const child = spawn(process.execPath, [script], { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
  let output = '';
  const waiters = [];
  const onData = (buf) => {
    output += buf.toString();
    for (const w of waiters.slice()) if (output.includes(w.text)) w.settle(true);
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);

  const began = Date.now();
  let boundHit = false;
  const bound = setTimeout(() => { boundHit = true; child.kill(); }, boundMs);
  const exited = new Promise((res) => {
    child.on('close', (code, signal) => {
      clearTimeout(bound);
      for (const w of waiters.slice()) w.settle(output.includes(w.text));
      res({ code, signal, boundHit, ms: Date.now() - began });
    });
  });

  /** Resolves true when `text` appears, false on timeout or exit without it. */
  const waitFor = (text, ms) => new Promise((res) => {
    if (output.includes(text)) return res(true);
    const w = {
      text,
      settle: (v) => { clearTimeout(timer); waiters.splice(waiters.indexOf(w), 1); res(v); },
    };
    const timer = setTimeout(() => w.settle(false), ms);
    waiters.push(w);
  });

  return { child, exited, waitFor, output: () => output };
}

const tail = (s, n = 12) => s.split('\n').filter((l) => l.trim()).slice(-n).join('\n');

// ─── RATCHET FIXTURE ───────────────────────────────────────────────────────

/** A stand-in for Playwright's CLI. ESM, via the package.json written beside it. */
const FAKE_CLI = `
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const mode = process.env.WB_FAKE_PW_MODE;

if (mode === 'silent') {
  // A wedged run: alive, printing nothing, with a worker of its own.
  const worker = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'],
    { stdio: 'ignore', env: { ...process.env, NODE_OPTIONS: '' } });
  writeFileSync('worker.pid', String(worker.pid));
  setInterval(() => {}, 1000);
} else {
  // A run that is making progress, reported by Playwright's own list reporter.
  const mod = await import(pathToFileURL(process.env.WB_FAKE_PW_LIST).href);
  const ListReporter = mod.default?.default ?? mod.default;
  const reporter = new ListReporter({});
  reporter.totalTestCount = 7700;
  reporter.formatTestTitle = () => '[compliance] › fake.spec.ts:1:1 › a test that finished';
  const tick = setInterval(() => {
    reporter._updateTestLine({ expectedStatus: 'passed', outcome: () => 'expected' },
      { status: 'passed', duration: 12, retry: 0 });
  }, 500);
  if (mode === 'healthy') {
    setTimeout(() => {
      clearInterval(tick);
      mkdirSync('data/test-results', { recursive: true });
      writeFileSync('data/test-results/failures.json',
        JSON.stringify({ timestamp: new Date().toISOString(), failures: [] }));
      process.exit(0);
    }, Number(process.env.WB_FAKE_PW_MS));
  }
}
`;

async function ratchetFixture() {
  const dir = await mkdtemp(join(tmpdir(), 'wb-gate-guard-ratchet-'));
  await mkdir(join(dir, '.husky'), { recursive: true });
  await mkdir(join(dir, 'node_modules', '@playwright', 'test'), { recursive: true });
  await mkdir(join(dir, 'data'), { recursive: true });
  await copyFile(join(REPO, '.husky', 'test-ratchet.mjs'), join(dir, '.husky', 'test-ratchet.mjs'));
  await writeFile(join(dir, 'node_modules', '@playwright', 'test', 'package.json'), '{"type":"module"}\n');
  await writeFile(join(dir, 'node_modules', '@playwright', 'test', 'cli.js'), FAKE_CLI);
  await writeFile(join(dir, 'data', 'test-baseline-failures.json'), '{"failures":[]}\n');
  return dir;
}

async function ratchetCase(label, env, boundMs, assess) {
  const dir = await ratchetFixture();
  try {
    const run = start(join('.husky', 'test-ratchet.mjs'), {
      cwd: dir,
      env: cleanEnv({ WB_FAKE_PW_LIST: LIST_REPORTER, ...env }),
      boundMs,
    });
    const result = await run.exited;
    return { label, results: await assess(result, run.output(), dir) };
  } finally {
    await rm(dir, { recursive: true, force: true, maxRetries: 3 }).catch(() => {});
  }
}

/** A stalled run -- no test finishes -- is killed and reported as a hang. */
const silentRun = () => ratchetCase(
  'Ratchet: a run where no test finishes is killed and named a HANG',
  { WB_FAKE_PW_MODE: 'silent', WB_GATE_ACK_MIN: '0.05' },
  90_000,
  async (r, out, dir) => {
    const workerPid = existsSync(join(dir, 'worker.pid'))
      ? Number(readFileSync(join(dir, 'worker.pid'), 'utf8'))
      : null;
    const checks = [
      ['the ratchet returns on its own (not killed by this harness)', !r.boundHit, `still running after ${r.ms}ms\n${tail(out)}`],
      ['it exits non-zero', r.code === 1, `exit ${r.code}`],
      ['it says HANG, not a verdict', out.includes('That is a HANG'), tail(out)],
      ['it records where it stopped', out.includes('GATE STALLED') && out.includes('last test seen'), tail(out)],
    ];
    // Windows only: libuv puts every child in a kill-on-close job, so a killed
    // run takes its workers with it. That is what makes releasing the lock
    // afterwards safe -- nothing of the stalled run is left holding the machine.
    if (process.platform === 'win32') {
      checks.push(['nothing of the stalled run survives it', workerPid !== null && !isProcessRunning(workerPid),
        workerPid === null ? 'the fake runner never started a worker' : `worker PID ${workerPid} is still alive`]);
    }
    return checks;
  }
);

/** A healthy run is never mistaken for a stall, whatever terminal it came from. */
const healthyRun = (terminal, env) => ratchetCase(
  `Ratchet: a healthy run from ${terminal} is not killed`,
  { WB_FAKE_PW_MODE: 'healthy', WB_FAKE_PW_MS: '13000', WB_GATE_ACK_MIN: '0.05', ...env },
  90_000,
  async (r, out) => [
    ['the run is allowed to finish', !out.includes('GATE STALLED'),
      tail(out.split('\n').filter((l) => !/fake\.spec/.test(l)).join('\n'))],
    ['it reaches a verdict', r.code === 0 && out.includes('No new failures'), `exit ${r.code}`],
  ]
);

/** Progress is not enough: the wall-clock ceiling still ends a run that never finishes. */
const endlessRun = () => ratchetCase(
  'Ratchet: a run that never finishes is stopped at the ceiling',
  { WB_FAKE_PW_MODE: 'endless', WB_GATE_TIMEOUT_MIN: '0.1', WB_GATE_ACK_MIN: '5' },
  90_000,
  async (r, out) => [
    ['the ratchet returns on its own', !r.boundHit, `still running after ${r.ms}ms`],
    ['it exits non-zero, naming the ceiling', r.code === 1 && out.includes('minute ceiling') && out.includes('That is a HANG'),
      `exit ${r.code}\n${tail(out.split('\n').filter((l) => !/fake\.spec/.test(l)).join('\n'))}`],
  ]
);

// ─── GATE FIXTURE ──────────────────────────────────────────────────────────

/** Stands in for the full suite: announces itself, runs until stdin closes. */
const STUB_RATCHET = `
console.log('STUB-RATCHET-STARTED');
process.stdin.resume();
process.stdin.on('end', () => { console.log('STUB-RATCHET-DONE'); process.exit(0); });
`;

async function gateFixture() {
  const dir = await mkdtemp(join(tmpdir(), 'wb-gate-guard-gate-'));
  const repo = join(dir, 'repo');
  const lockDir = join(dir, 'locks');
  await mkdir(join(repo, '.husky'), { recursive: true });
  await mkdir(join(repo, 'scripts', 'lib'), { recursive: true });
  await mkdir(lockDir, { recursive: true });
  await copyFile(join(REPO, '.husky', 'gate-staged-tree.mjs'), join(repo, '.husky', 'gate-staged-tree.mjs'));
  await copyFile(join(REPO, 'scripts', 'lib', 'test-lock.mjs'), join(repo, 'scripts', 'lib', 'test-lock.mjs'));
  await writeFile(join(repo, '.husky', 'test-ratchet.mjs'), STUB_RATCHET);
  await writeFile(join(repo, 'package.json'), '{"type":"module"}\n');
  await writeFile(join(repo, 'staged.txt'), 'one\n');

  const git = (...args) => execFileSync('git',
    ['-c', 'user.name=gate-guard', '-c', 'user.email=gate-guard@localhost', ...args],
    { cwd: repo, env: cleanEnv(), stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
  git('init', '-q');
  git('add', '-A');
  git('commit', '-q', '-m', 'fixture');
  await writeFile(join(repo, 'staged.txt'), 'two\n');
  git('add', 'staged.txt');   // the gate skips when nothing is staged
  return { dir, repo, lockDir, git };
}

async function gateCase(label, envExtra, body) {
  const fx = await gateFixture();
  try {
    const guards = createGuards({ root: 'C:/elsewhere/arriving', globalDir: fx.lockDir, minFreeMb: 0 });
    const launch = (boundMs) => start(join('.husky', 'gate-staged-tree.mjs'), {
      cwd: fx.repo,
      env: cleanEnv({ WB_TEST_LOCK_DIR: fx.lockDir, ...envExtra }),
      boundMs,
    });
    return { label, results: await body({ fx, guards, launch }) };
  } finally {
    await rm(fx.dir, { recursive: true, force: true, maxRetries: 3 }).catch(() => {});
  }
}

/** While the gate's suite runs, the machine is the gate's. */
const gateHoldsTheMachine = () => gateCase(
  'Gate: while its suite runs, the machine-wide lock is held and other runs are refused',
  {},
  async ({ guards, launch }) => {
    const gate = launch(60_000);
    const started = await gate.waitFor('STUB-RATCHET-STARTED', 20_000);
    const checks = [['the gate reaches its suite', started, tail(gate.output())]];

    const held = await guards.readLock();
    checks.push(['the lock names the gate as holder',
      !!held && held.pid === gate.child.pid && held.command === 'pre-commit gate',
      `lock file: ${JSON.stringify(held)} (gate PID ${gate.child.pid})`]);

    const slot = await guards.acquireSingleSlot('tests/arriving.spec.ts');
    checks.push(['a single-spec run arriving now is refused', slot === null, `it was given ${slot}`]);
    if (slot) await guards.releaseSlot(slot);

    const denied = await guards.acquireSuiteLock(new Date().toISOString(), 'arriving suite');
    checks.push(['a suite arriving now is refused', typeof denied === 'string', 'it was given the lock']);
    if (denied === null) await guards.removeLock();

    gate.child.stdin.end();
    const r = await gate.exited;
    checks.push(['the gate passes when its suite passes', r.code === 0 && !r.boundHit, `exit ${r.code}\n${tail(gate.output())}`]);
    checks.push(['the lock is released when the gate ends', !existsSync(guards.lockFile), 'lock file still present']);
    const after = await guards.acquireSingleSlot('tests/after.spec.ts');
    checks.push(['a single-spec run is admitted afterwards', after !== null, 'still refused']);
    return checks;
  }
);

/** A gate arriving on a busy machine waits for the release instead of colliding. */
const gateWaitsForASingle = () => gateCase(
  'Gate: arriving while a single-spec run holds the machine, it waits for the release',
  {},
  async ({ guards, launch }) => {
    const slot = await guards.acquireSingleSlot('tests/already-running.spec.ts');
    const gate = launch(60_000);
    const waited = await gate.waitFor('the machine is busy', 20_000);
    const checks = [
      ['the gate reports it is waiting', waited, tail(gate.output())],
      ['its suite does not start beside the single run', !gate.output().includes('STUB-RATCHET-STARTED'), tail(gate.output())],
    ];

    await guards.releaseSlot(slot);
    const startedAfter = await gate.waitFor('STUB-RATCHET-STARTED', 20_000);
    checks.push(['the release notifies it, and its suite starts', startedAfter, tail(gate.output())]);

    gate.child.stdin.end();
    const r = await gate.exited;
    checks.push(['the gate finishes', r.code === 0 && !r.boundHit, `exit ${r.code}`]);
    return checks;
  }
);

/**
 * The outer bound fires, and the lock and the temp checkout go with it.
 *
 * The outer bound is defined as WB_GATE_TIMEOUT_MIN + 5 minutes, so the only
 * way to put it in seconds without a test-only knob is a negative override:
 * -4.875 + 5 = 0.125 minutes = 7.5 seconds.
 */
const gateOuterBound = () => gateCase(
  'Gate: a suite that never returns is killed at the outer bound, releasing the machine',
  { WB_GATE_TIMEOUT_MIN: '-4.875' },
  async ({ fx, guards, launch }) => {
    const gate = launch(60_000);
    const r = await gate.exited;   // stdin is never closed: the stub never ends
    const worktrees = fx.git('worktree', 'list').split('\n').filter(Boolean);
    return [
      ['the gate returns on its own', !r.boundHit, `still running after ${r.ms}ms\n${tail(gate.output())}`],
      ['it exits non-zero and says HANG', r.code === 1 && gate.output().includes('did not finish within'),
        `exit ${r.code}\n${tail(gate.output())}`],
      ['the lock is released on the timeout path', !existsSync(guards.lockFile), 'lock file still present'],
      ['the staged-tree checkout is removed', worktrees.length === 1, worktrees.join('\n')],
    ];
  }
);

/**
 * The override the bound is tuned with must not break the gate. spawnSync
 * rejects a non-integer timeout, and (m + 5) * 60 * 1000 is not an integer for
 * 284 of the 1000 values 0.01..10.00 -- 0.01 among them -- so the gate died
 * with "failed to set up the staged-tree checkout" before running anything.
 */
const gateFractionalOverride = () => gateCase(
  'Gate: a fractional WB_GATE_TIMEOUT_MIN is a bound, not a crash',
  { WB_GATE_TIMEOUT_MIN: '0.01' },
  async ({ launch }) => {
    const gate = launch(60_000);
    const started = await gate.waitFor('STUB-RATCHET-STARTED', 20_000);
    gate.child.stdin.end();
    const r = await gate.exited;
    return [
      ['the gate reaches its suite', started, tail(gate.output())],
      ['and passes', r.code === 0 && !r.boundHit, `exit ${r.code}\n${tail(gate.output())}`],
    ];
  }
);

// ─── RUN ───────────────────────────────────────────────────────────────────
console.log('🚧 gate guards — the commit gate is bounded and holds the machine (#1106)');

if (!existsSync(LIST_REPORTER)) {
  console.log(`\n❌ Playwright's list reporter is not at ${LIST_REPORTER} — run: npm install`);
  process.exit(1);
}

// Independent fixtures, private lock dirs: safe to run side by side.
const sections = await Promise.all([
  silentRun(),
  endlessRun(),
  healthyRun('a plain Windows console', {}),
  healthyRun('Windows Terminal (WT_SESSION)', { WT_SESSION: 'gate-guard' }),
  healthyRun('the VS Code terminal (TERM_PROGRAM=vscode)', { TERM_PROGRAM: 'vscode' }),
  healthyRun('a colour-forcing shell (FORCE_COLOR=1)', { FORCE_COLOR: '1' }),
  gateHoldsTheMachine(),
  gateWaitsForASingle(),
  gateOuterBound(),
  gateFractionalOverride(),
]);

for (const { label, results } of sections) {
  console.log(`\n${label}:`);
  for (const [name, ok, detail] of results) check(name, ok, detail);
}

console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
