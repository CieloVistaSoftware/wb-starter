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
 * #1128 EXTENDED IT to every other Playwright launch on the commit and release
 * path, each driven unmodified against a fake Playwright CLI with a private lock
 * dir: scripts/release.mjs (holds the suite lock, bounded), scripts/priority-gate.mjs
 * (holds a single-run slot, bounded, waits for a suite, pins no port), the
 * project-integrity line of .husky/pre-commit (read out of the hook and run as
 * written), and the gate's wait for the lock, which had no end. On 2015d9f5,
 * before that fix: 49 passed, 21 failed. With it: 70 passed, 0 failed.
 *
 * Run: npm run test:gate-guards
 */

import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, rm, mkdir, copyFile, writeFile, readdir } from 'node:fs/promises';
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
    if (/^WB_GATE_/.test(k) || ['WB_TEST_LOCK_DIR', 'WB_TEST_PORT', 'WB_MAX_PARALLEL_SINGLE'].includes(k)) continue;
    if (['WT_SESSION', 'TERM_PROGRAM', 'FORCE_COLOR', 'DEBUG_COLORS', 'PLAYWRIGHT_FORCE_TTY', 'CI', 'NODE_OPTIONS'].includes(k)) continue;
    env[k] = v;
  }
  return { ...env, ...extra };
}

/**
 * Start a node script and collect its output. Every child is bounded by this
 * harness too: a guard that can hang is the defect it is guarding against.
 */
function start(script, { cwd, env, boundMs, args = [], command = process.execPath }) {
  const child = spawn(command, [script, ...args], { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
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

/** The real scripts/lib, whole: whatever the script under test imports from it comes along. */
async function copyLib(root) {
  const from = join(REPO, 'scripts', 'lib');
  await mkdir(join(root, 'scripts', 'lib'), { recursive: true });
  for (const name of await readdir(from)) {
    if (name.endsWith('.mjs')) await copyFile(join(from, name), join(root, 'scripts', 'lib', name));
  }
}

// ─── RATCHET FIXTURE ───────────────────────────────────────────────────────

/** A stand-in for Playwright's CLI. ESM, via the package.json written beside it. */
const FAKE_CLI = `
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const mode = process.env.WB_FAKE_PW_MODE;

if (mode === 'finished-then-quiet') {
  // #1180: a run that COMPLETES and then goes quiet while it shuts down.
  // Playwright prints no per-test lines while it writes the report and tears
  // down the web server, which is exactly what a hang looks like to a
  // watchdog counting acks. On 2026-09-15 that discarded a 7,862-test run.
  const mod = await import(pathToFileURL(process.env.WB_FAKE_PW_LIST).href);
  const ListReporter = mod.default?.default ?? mod.default;
  const reporter = new ListReporter({});
  reporter.totalTestCount = 2;
  reporter.formatTestTitle = () => '[compliance] > fake.spec.ts:1:1 > a test that finished';
  console.log('Running 2 tests using 1 worker');
  for (let i = 0; i < 2; i += 1) {
    reporter._updateTestLine({ expectedStatus: 'passed', outcome: () => 'expected' },
      { status: 'passed', duration: 12, retry: 0 });
  }
  // Silent for longer than the ack deadline, shorter than the shutdown grace.
  setTimeout(() => {
    mkdirSync('data/test-results', { recursive: true });
    writeFileSync('data/test-results/failures.json',
      JSON.stringify({ timestamp: new Date().toISOString(), failures: [] }));
    process.exit(0);
  }, Number(process.env.WB_FAKE_PW_QUIET_MS));
} else if (mode === 'silent') {
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
  if (mode === 'server-died' || mode === 'mixed' || mode === 'remote-refused') {
    // #1127: a finished run whose failures.json carries connection refusals.
    const port = process.env.WB_TEST_PORT || '3000';
    const refused = (p) => 'Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:' + p + '/x';
    const failures = mode === 'server-died'
      ? [1, 2, 3].map((i) => ({ project: 'compliance', file: 'down-' + i + '.spec.ts', title: 'needs the server ' + i, error: refused(port) }))
      : mode === 'mixed'
        ? [{ project: 'compliance', file: 'down.spec.ts', title: 'needs the server', error: refused(port) },
           { project: 'compliance', file: 'real.spec.ts', title: 'a real regression', error: 'Error: expect(received).toBe(expected)' }]
        : [{ project: 'compliance', file: 'probe.spec.ts', title: 'probes another port', error: refused('9') }];
    setTimeout(() => {
      clearInterval(tick);
      mkdirSync('data/test-results', { recursive: true });
      writeFileSync('data/test-results/failures.json', JSON.stringify({ timestamp: new Date().toISOString(), failures }));
      process.exit(1);
    }, 1500);
  }
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
  // #1127: the ratchet classifies server-down failures with the shared library.
  await mkdir(join(dir, 'scripts', 'lib'), { recursive: true });
  await copyFile(join(REPO, 'scripts', 'lib', 'server-down.mjs'), join(dir, 'scripts', 'lib', 'server-down.mjs'));
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

/**
 * A run that finished every test is not a hang, however quiet shutdown is (#1180).
 *
 * The ack deadline is the right instrument while tests are still reporting and
 * the wrong one afterwards. On 2026-09-15 all 7,862 tests finished, the deadline
 * expired 190s into Playwright's shutdown, and the gate SIGINTed a completed run
 * and printed 'THE SUITE NEVER RAN'. Release 4.0.6 aborted on a run that passed.
 *
 * The fake acks both of the 2 tests it announced, then stays silent for 15s with
 * the ack deadline at 3s. The watchdog only looks every 10s, so the quiet spell
 * has to outlast a tick to be seen at all -- a stall by the old rule, a pass by
 * the new one.
 */
const finishedThenQuietRun = () => ratchetCase(
  'Ratchet: a run that finished every test is not killed while it shuts down (#1180)',
  { WB_FAKE_PW_MODE: 'finished-then-quiet', WB_FAKE_PW_QUIET_MS: '15000', WB_GATE_ACK_MIN: '0.05' },
  90_000,
  async (r, out) => {
    const clean = tail(out.split('\n').filter((l) => !/fake\.spec/.test(l)).join('\n'));
    return [
      ['the run is not killed as a stall', !out.includes('GATE STALLED'), clean],
      ['it is not reported as a hang', !out.includes('That is a HANG'), clean],
      ['the verdict comes from the exit code and the register',
        r.code === 0 && out.includes('No new failures'), `exit ${r.code}\n${clean}`],
    ];
  }
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

/**
 * A server that dies is not a regression (#1127).
 *
 * #1074 taught test-async.mjs to tell "the test failed" from "the run's own
 * server refused the connection". The ratchet reads a different file and kept
 * scoring every refusal as a NEW failure, so a server death during the
 * 10th-commit gate blocked the commit with a list of tests that never ran.
 */
const serverDiedRun = () => ratchetCase(
  'Ratchet: a run whose own server died is reported as that, not as new failures (#1127)',
  { WB_FAKE_PW_MODE: 'server-died', WB_GATE_ACK_MIN: '5' },
  90_000,
  async (r, out) => [
    ['it blocks (nothing was verified)', r.code === 1 && !r.boundHit, `exit ${r.code}\n${tail(out)}`],
    ['it says the server died, not that the change broke tests',
      out.includes('SERVER DIED') && !out.includes('NEW test failures'), tail(out)],
    ['it counts the tests that never reached the server', /3 test\(s\) could not reach/.test(out), tail(out)],
  ]
);

const mixedRun = () => ratchetCase(
  'Ratchet: a real regression beside a dead server is still named as a regression (#1127)',
  { WB_FAKE_PW_MODE: 'mixed', WB_GATE_ACK_MIN: '5' },
  90_000,
  async (r, out) => [
    ['it blocks', r.code === 1 && !r.boundHit, `exit ${r.code}\n${tail(out)}`],
    ['the real failure is listed as NEW', out.includes('NEW test failures') && out.includes('real.spec.ts › a real regression'), tail(out, 20)],
    ['the server-down one is not listed as NEW',
      out.includes('NEW test failures') && !out.slice(out.indexOf('NEW test failures')).includes('down.spec.ts › needs the server'), tail(out, 20)],
    ['and the server death is reported too', out.includes('SERVER DIED'), tail(out, 20)],
  ]
);

const remoteRefusedRun = () => ratchetCase(
  "Ratchet: a refusal from some other port is a real failure, not the gate's server (#1127)",
  { WB_FAKE_PW_MODE: 'remote-refused', WB_GATE_ACK_MIN: '5' },
  90_000,
  async (r, out) => [
    ['it is a NEW failure', r.code === 1 && out.includes('NEW test failures') && out.includes('probe.spec.ts › probes another port'), tail(out)],
    ['it is not called a server death', !out.includes('SERVER DIED'), tail(out)],
  ]
);

// ─── GATE FIXTURE ──────────────────────────────────────────────────────────

/** Stands in for the full suite: announces itself, runs until stdin closes. */
const STUB_RATCHET = `
console.log('STUB-GIT-ENV ' + JSON.stringify(Object.keys(process.env).filter((k) => /^GIT_/.test(k))));
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
  // Every scripts/lib/*.mjs, not a hand-listed few: the copied gate imports
  // test-lock, suite-env and hold-machine, and a missing one fails every Gate
  // case on ERR_MODULE_NOT_FOUND instead of on a verdict (#1161).
  await copyLib(repo);
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

/**
 * The suite inherits none of the hook's git variables (#1160).
 *
 * Git hands GIT_DIR and GIT_INDEX_FILE to hooks. From a linked worktree GIT_DIR
 * is absolute, and a spec that builds its own throwaway repo then ran its git
 * commands against the real one: three every-push-to-main-is-a-release specs
 * failed "must be run in a work tree" and the gate blocked a commit. Set here
 * exactly as git sets them for a worktree hook: absolute, and correct for the
 * gate's OWN git commands, which must keep working.
 */
const gateStripsHookGitEnv = async () => {
  const label = "Gate: the suite inherits none of the hook's GIT_* variables (#1160)";
  const fx = await gateFixture();
  try {
    const gate = start(join('.husky', 'gate-staged-tree.mjs'), {
      cwd: fx.repo,
      env: cleanEnv({
        WB_TEST_LOCK_DIR: fx.lockDir,
        GIT_DIR: join(fx.repo, '.git'),
        GIT_INDEX_FILE: join(fx.repo, '.git', 'index'),
      }),
      boundMs: 60_000,
    });
    const started = await gate.waitFor('STUB-RATCHET-STARTED', 20_000);
    const line = (gate.output().match(/STUB-GIT-ENV (\[.*\])/) || [])[1];
    let seen = null;
    try { seen = JSON.parse(line); } catch { /* stays null */ }
    const checks = [
      ['the gate reaches its suite with the hook variables set', started, tail(gate.output())],
      ['the suite sees no GIT_* variable', Array.isArray(seen) && seen.length === 0, `the suite saw ${line}`],
    ];
    gate.child.stdin.end();
    const r = await gate.exited;
    checks.push(['the gate still passes (its own git commands kept the variables)', r.code === 0 && !r.boundHit,
      `exit ${r.code}\n${tail(gate.output())}`]);
    return { label, results: checks };
  } finally {
    await rm(fx.dir, { recursive: true, force: true, maxRetries: 3 }).catch(() => {});
  }
};

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

/**
 * The WAIT for the machine ends too (#1128). A holder that is alive but stuck
 * never releases and never goes stale, so a gate that waits without a deadline
 * stalls the commit for as long as the holder stays stuck.
 */
const gateWaitBound = () => gateCase(
  'Gate: a holder that never releases does not stall the commit forever',
  { WB_GATE_LOCK_WAIT_MIN: '0.05' },
  async ({ guards, launch }) => {
    await guards.acquireSuiteLock(new Date().toISOString(), 'stuck holder');
    await guards.bindSuiteLock(process.pid, { command: 'stuck holder' });
    const gate = launch(40_000);
    const r = await gate.exited;
    const held = await guards.readLock();
    return [
      ['the gate returns on its own', !r.boundHit, `still waiting after ${r.ms}ms\n${tail(gate.output())}`],
      ['it exits non-zero, saying it gave up waiting', r.code === 1 && gate.output().includes('gave up waiting'),
        `exit ${r.code}\n${tail(gate.output())}`],
      ['its suite never starts beside the holder', !gate.output().includes('STUB-RATCHET-STARTED'), tail(gate.output())],
      ["the holder's lock is left alone", !!held && held.pid === process.pid && held.command === 'stuck holder',
        `lock file: ${JSON.stringify(held)}`],
    ];
  }
);

// ─── THE OTHER PLAYWRIGHT LAUNCHES ON THE COMMIT AND RELEASE PATH (#1128) ────
//
// #1106 put the lock and the bounds on the 10th-commit gate. Three more
// launches had neither: scripts/release.mjs (the full ratchet),
// scripts/priority-gate.mjs (every commit, on a fixed port 3399), and the
// project-integrity run at the end of .husky/pre-commit. Each is driven here,
// unmodified, in a throwaway directory whose Playwright CLI is a fake and whose
// lock dir is private.

/** Stands in for Playwright on a spec run: records what it was given, runs until stdin closes. */
const FAKE_SPEC_CLI = `
import { writeFileSync } from 'node:fs';
writeFileSync('fake-pw-run.json', JSON.stringify({
  pid: process.pid, argv: process.argv.slice(2), port: process.env.WB_TEST_PORT ?? null,
  gitEnv: Object.keys(process.env).filter((k) => /^GIT_/.test(k)),
}));
console.log('FAKE-PW-STARTED');
process.stdin.resume();
process.stdin.on('end', () => { console.log('FAKE-PW-DONE'); process.exit(0); });
`;

const COPY = Symbol('copy this path from the repo');

async function pathFixture(files) {
  const dir = await mkdtemp(join(tmpdir(), 'wb-gate-guard-path-'));
  const root = join(dir, 'repo');
  const lockDir = join(dir, 'locks');
  await mkdir(lockDir, { recursive: true });
  await copyLib(root);
  const pw = join(root, 'node_modules', '@playwright', 'test');
  await mkdir(pw, { recursive: true });
  await writeFile(join(pw, 'package.json'), '{"type":"module"}\n');
  await writeFile(join(pw, 'cli.js'), FAKE_SPEC_CLI);
  for (const [rel, content] of Object.entries(files)) {
    await mkdir(dirname(join(root, rel)), { recursive: true });
    if (content === COPY) await copyFile(join(REPO, rel), join(root, rel));
    else await writeFile(join(root, rel), content);
  }
  return { dir, root, lockDir, fakeCli: join(pw, 'cli.js') };
}

async function pathCase(label, files, body) {
  const fx = await pathFixture(files);
  try {
    const guards = createGuards({ root: 'C:/elsewhere/arriving', globalDir: fx.lockDir, minFreeMb: 0, maxParallelSingle: 2 });
    const launch = (script, { args = [], env = {}, boundMs = 60_000 } = {}) => start(script, {
      cwd: fx.root, args, boundMs, env: cleanEnv({ WB_TEST_LOCK_DIR: fx.lockDir, ...env }),
    });
    return { label, results: await body({ fx, guards, launch }) };
  } finally {
    await rm(fx.dir, { recursive: true, force: true, maxRetries: 3 }).catch(() => {});
  }
}

/** Live single-run slot records in a lock dir. */
async function slotHolders(lockDir) {
  const dir = join(lockDir, 'single-slots');
  if (!existsSync(dir)) return [];
  const held = [];
  for (const name of await readdir(dir)) {
    try { held.push(JSON.parse(readFileSync(join(dir, name), 'utf8'))); } catch { /* mid-write */ }
  }
  return held;
}

const fakeRun = (root) => {
  try { return JSON.parse(readFileSync(join(root, 'fake-pw-run.json'), 'utf8')); } catch { return null; }
};

/** The checks every spec launcher owes while it runs: a slot of its own, and no suite beside it. */
async function holdsASlot(child, fx, guards) {
  const holders = await slotHolders(fx.lockDir);
  const denied = await guards.acquireSuiteLock(new Date().toISOString(), 'arriving suite');
  if (denied === null) await guards.removeLock();
  return [
    ['a machine-wide single-run slot names it as holder', holders.some((h) => h.pid === child.pid),
      `slots: ${JSON.stringify(holders)} (its PID ${child.pid})`],
    ['a suite arriving now is refused', typeof denied === 'string', 'the suite was given the machine'],
  ];
}

// ── priority-gate.mjs ──
const priorityFiles = () => ({
  'scripts/priority-gate.mjs': COPY,
  'package.json': '{"type":"module"}\n',
  'tests/p1.spec.ts': '// fixture: never run -- the Playwright CLI here is a fake\n',
  'data/priority-gate.json': JSON.stringify({
    generated: new Date().toISOString(),
    issues: { 1: [{ number: 1, title: 'fixture', test: 'tests/p1.spec.ts' }] },
  }),
});
const PRIORITY = join('scripts', 'priority-gate.mjs');

const priorityHoldsASlot = () => pathCase(
  'Priority gate: while its specs run it holds a slot, and it pins no port',
  priorityFiles(),
  async ({ fx, guards, launch }) => {
    const gate = launch(PRIORITY, { env: { GIT_DIR: join(fx.root, '.git'), GIT_INDEX_FILE: join(fx.root, '.git', 'index') } });
    const started = await gate.waitFor('FAKE-PW-STARTED', 20_000);
    const checks = [['it reaches its specs', started, tail(gate.output())]];
    checks.push(...await holdsASlot(gate.child, fx, guards));
    const run = fakeRun(fx.root);
    checks.push(['it leaves the port to playwright.config.ts (no fixed WB_TEST_PORT)', !!run && !run.port,
      `WB_TEST_PORT=${run && run.port}`]);
    checks.push(["its specs inherit none of the hook's GIT_* variables (#1160)", !!run && run.gitEnv.length === 0,
      `the specs saw ${run && JSON.stringify(run.gitEnv)}`]);
    gate.child.stdin.end();
    const r = await gate.exited;
    checks.push(['it passes when its specs pass', r.code === 0 && !r.boundHit, `exit ${r.code}\n${tail(gate.output())}`]);
    const left = await slotHolders(fx.lockDir);
    checks.push(['the slot is released when it ends', left.length === 0, JSON.stringify(left)]);
    return checks;
  }
);

const priorityWaitsForASuite = () => pathCase(
  'Priority gate: arriving while a suite holds the machine, it waits for the release',
  priorityFiles(),
  async ({ fx, guards, launch }) => {
    await guards.acquireSuiteLock(new Date().toISOString(), 'holder suite');
    await guards.bindSuiteLock(process.pid, { command: 'holder suite' });
    const gate = launch(PRIORITY);
    const waited = await gate.waitFor('the machine is busy', 20_000);
    const checks = [
      ['it reports it is waiting', waited, tail(gate.output())],
      ['its specs do not start beside the suite', !gate.output().includes('FAKE-PW-STARTED') && !fakeRun(fx.root), tail(gate.output())],
    ];
    await guards.removeLock();
    checks.push(['the release notifies it, and its specs start', await gate.waitFor('FAKE-PW-STARTED', 20_000), tail(gate.output())]);
    gate.child.stdin.end();
    const r = await gate.exited;
    checks.push(['it finishes', r.code === 0 && !r.boundHit, `exit ${r.code}`]);
    return checks;
  }
);

const priorityBound = () => pathCase(
  'Priority gate: specs that never return are killed at the bound, releasing the slot',
  priorityFiles(),
  async ({ fx, launch }) => {
    const gate = launch(PRIORITY, { env: { WB_GATE_SPEC_TIMEOUT_MIN: '0.1' } });
    const r = await gate.exited;   // stdin never closed: the fake never ends
    const left = await slotHolders(fx.lockDir);
    return [
      ['it returns on its own', !r.boundHit, `still running after ${r.ms}ms\n${tail(gate.output())}`],
      ['it exits non-zero and says HANG', r.code === 1 && gate.output().includes('did not finish within'),
        `exit ${r.code}\n${tail(gate.output())}`],
      ['the slot is released on the timeout path', left.length === 0, JSON.stringify(left)],
    ];
  }
);

const priorityWaitBound = () => pathCase(
  'Priority gate: a holder that never releases does not stall the commit forever',
  priorityFiles(),
  async ({ fx, guards, launch }) => {
    await guards.acquireSuiteLock(new Date().toISOString(), 'stuck holder');
    await guards.bindSuiteLock(process.pid, { command: 'stuck holder' });
    const gate = launch(PRIORITY, { env: { WB_GATE_LOCK_WAIT_MIN: '0.05' }, boundMs: 40_000 });
    const r = await gate.exited;
    const held = await guards.readLock();
    return [
      ['it returns on its own', !r.boundHit, `still running after ${r.ms}ms\n${tail(gate.output())}`],
      ['it exits non-zero, saying it gave up waiting', r.code === 1 && gate.output().includes('gave up waiting'),
        `exit ${r.code}\n${tail(gate.output())}`],
      ['its specs never start beside the holder', !fakeRun(fx.root), tail(gate.output())],
      ["the holder's lock is left alone", !!held && held.pid === process.pid, `lock file: ${JSON.stringify(held)}`],
    ];
  }
);

// ── release.mjs ──
const releaseFiles = () => ({
  'scripts/release.mjs': COPY,
  '.husky/test-ratchet.mjs': STUB_RATCHET,
  'package.json': '{"type":"module","version":"9.9.9"}\n',
  'pages/whats-new.html': '<section id="whats-new-9-9-10"><h2>9.9.10</h2></section>\n',
});
const RELEASE = join('scripts', 'release.mjs');

const releaseHoldsTheMachine = () => pathCase(
  'Release: while its ratchet runs, the machine-wide lock is held',
  releaseFiles(),
  async ({ fx, guards, launch }) => {
    const rel = launch(RELEASE, { args: ['--check'] });
    const started = await rel.waitFor('STUB-RATCHET-STARTED', 20_000);
    const checks = [['it reaches its ratchet', started, tail(rel.output())]];
    const held = await guards.readLock();
    checks.push(['the lock names the release as holder', !!held && held.pid === rel.child.pid,
      `lock file: ${JSON.stringify(held)} (release PID ${rel.child.pid})`]);
    const slot = await guards.acquireSingleSlot('tests/arriving.spec.ts');
    checks.push(['a single-spec run arriving now is refused', slot === null, `it was given ${slot}`]);
    if (slot) await guards.releaseSlot(slot);
    rel.child.stdin.end();
    const r = await rel.exited;
    checks.push(['the release check passes when its ratchet passes', r.code === 0 && rel.output().includes('Nothing was changed'),
      `exit ${r.code}\n${tail(rel.output())}`]);
    checks.push(['the lock is released when it ends', !existsSync(join(fx.lockDir, 'test.lock')), 'lock file still present']);
    return checks;
  }
);

const releaseBound = () => pathCase(
  'Release: a ratchet that never returns is killed at the bound, releasing the machine',
  releaseFiles(),
  async ({ fx, launch }) => {
    // Same outer bound as the gate: WB_GATE_TIMEOUT_MIN + 5 minutes, so -4.875 is 7.5 seconds.
    const rel = launch(RELEASE, { args: ['--check'], env: { WB_GATE_TIMEOUT_MIN: '-4.875' } });
    const r = await rel.exited;
    return [
      ['it returns on its own', !r.boundHit, `still running after ${r.ms}ms\n${tail(rel.output())}`],
      ['it aborts and names a HANG, not new failures',
        r.code === 1 && rel.output().includes('did not finish within') && !rel.output().includes('found NEW failures'),
        `exit ${r.code}\n${tail(rel.output())}`],
      ['the lock is released on the timeout path', !existsSync(join(fx.lockDir, 'test.lock')), 'lock file still present'],
    ];
  }
);

// ── .husky/pre-commit, project-integrity ──
//
// The hook is shell, so the guard runs the hook's OWN line: it is read out of
// .husky/pre-commit, and `node` / `npx playwright` are pointed at this fixture.
const DIRECT_PLAYWRIGHT = /\bnpx\s+playwright\b|@playwright[\\/]test[\\/]cli/;

function integrityCommand() {
  const lines = readFileSync(join(REPO, '.husky', 'pre-commit'), 'utf8')
    .split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const direct = lines.filter((l) => DIRECT_PLAYWRIGHT.test(l));
  const line = lines.find((l) => l.includes('project-integrity.spec.ts')) || null;
  const tokens = line ? line.split(/\s*(?:\|\||&&|;)\s*/)[0].split(/\s+/) : [];
  let script = null;
  let args = [];
  let viaFake = false;
  if (tokens[0] === 'npx' && tokens[1] === 'playwright') { viaFake = true; args = tokens.slice(2); }
  else if (tokens[0] === 'node' && tokens[1] && existsSync(join(REPO, tokens[1]))) { script = tokens[1]; args = tokens.slice(2); }
  return { line, direct, script, args, viaFake };
}

const integrityCase = (label, envExtra, body) => {
  const cmd = integrityCommand();
  const files = {
    'package.json': '{"type":"module"}\n',
    'tests/compliance/project-integrity.spec.ts': '// fixture: never run -- the Playwright CLI here is a fake\n',
  };
  if (cmd.script) files[cmd.script] = COPY;
  return pathCase(label, files, async ({ fx, guards, launch }) => {
    if (!cmd.line || (!cmd.script && !cmd.viaFake)) {
      return [['the project-integrity line in .husky/pre-commit is one this guard can run', false, cmd.line || '(no such line)']];
    }
    const run = launch(cmd.viaFake ? fx.fakeCli : cmd.script, { args: cmd.args, env: envExtra, boundMs: 60_000 });
    return body({ fx, guards, run, cmd });
  });
};

const integrityHoldsASlot = () => integrityCase(
  'pre-commit project-integrity: while it runs it holds a slot',
  {},
  async ({ fx, guards, run, cmd }) => {
    const checks = [
      ['no line of .husky/pre-commit starts Playwright directly', cmd.direct.length === 0, cmd.direct.join('\n')],
    ];
    const started = await run.waitFor('FAKE-PW-STARTED', 20_000);
    checks.push(['it reaches the spec', started && (fakeRun(fx.root)?.argv || []).includes('tests/compliance/project-integrity.spec.ts'),
      `${tail(run.output())}\nfake got: ${JSON.stringify(fakeRun(fx.root))}`]);
    checks.push(...await holdsASlot(run.child, fx, guards));
    run.child.stdin.end();
    const r = await run.exited;
    checks.push(['it passes when the spec passes', r.code === 0 && !r.boundHit, `exit ${r.code}\n${tail(run.output())}`]);
    const left = await slotHolders(fx.lockDir);
    checks.push(['the slot is released when it ends', left.length === 0, JSON.stringify(left)]);
    return checks;
  }
);

const integrityBound = () => integrityCase(
  'pre-commit project-integrity: a run that never returns is killed at the bound',
  { WB_GATE_SPEC_TIMEOUT_MIN: '0.1' },
  async ({ fx, run }) => {
    const r = await run.exited;
    const left = await slotHolders(fx.lockDir);
    return [
      ['it returns on its own', !r.boundHit, `still running after ${r.ms}ms\n${tail(run.output())}`],
      ['it exits non-zero and says HANG', r.code === 1 && run.output().includes('did not finish within'),
        `exit ${r.code}\n${tail(run.output())}`],
      ['the slot is released on the timeout path', left.length === 0, JSON.stringify(left)],
    ];
  }
);

// ─── RUN ───────────────────────────────────────────────────────────────────
console.log('🚧 gate guards — every Playwright run on the commit and release path is bounded and holds the machine (#1106, #1128)');

if (!existsSync(LIST_REPORTER)) {
  console.log(`\n❌ Playwright's list reporter is not at ${LIST_REPORTER} — run: npm install`);
  process.exit(1);
}

// Independent fixtures, private lock dirs: safe to run side by side.
const sections = await Promise.all([
  silentRun(),
  endlessRun(),
  finishedThenQuietRun(),
  serverDiedRun(),
  mixedRun(),
  remoteRefusedRun(),
  healthyRun('a plain Windows console', {}),
  healthyRun('Windows Terminal (WT_SESSION)', { WT_SESSION: 'gate-guard' }),
  healthyRun('the VS Code terminal (TERM_PROGRAM=vscode)', { TERM_PROGRAM: 'vscode' }),
  healthyRun('a colour-forcing shell (FORCE_COLOR=1)', { FORCE_COLOR: '1' }),
  gateHoldsTheMachine(),
  gateStripsHookGitEnv(),
  gateWaitsForASingle(),
  gateOuterBound(),
  gateFractionalOverride(),
  gateWaitBound(),
  priorityHoldsASlot(),
  priorityWaitsForASuite(),
  priorityBound(),
  priorityWaitBound(),
  releaseHoldsTheMachine(),
  releaseBound(),
  integrityHoldsASlot(),
  integrityBound(),
]);

for (const { label, results } of sections) {
  console.log(`\n${label}:`);
  for (const [name, ok, detail] of results) check(name, ok, detail);
}

console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
