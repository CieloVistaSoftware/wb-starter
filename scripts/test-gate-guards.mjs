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
 * This drives the real ratchet, unmodified, against a fixture:
 *
 *   RATCHET  .husky/test-ratchet.mjs is copied into a throwaway directory whose
 *            node_modules/@playwright/test/cli.js is a fake. The fake prints the
 *            per-test lines Playwright's REAL list reporter prints (the reporter
 *            is loaded from this repo's node_modules), or prints nothing.
 *
 * 2026-10-02: the commit hook no longer runs the suite (the 10th-commit gate,
 * .husky/gate-staged-tree.mjs, is gone; the full suite runs in nightly.yml), so
 * its cases went with it. The ratchet, which CI and nightly still run, and the
 * release path keep theirs. This file now runs in CI, not in the commit hook.
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

import { spawn } from 'node:child_process';
import { mkdtemp, rm, mkdir, copyFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGuards, isProcessRunning } from './lib/test-lock.mjs';
import { NO_VERDICT_EXIT } from './lib/gate-exit.mjs';

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

  /**
   * Resolves true when `text` appears, false when the child exits without it.
   * #1589: the wait is the child's own bound, not a separate guess. A fixed 20s
   * failed "it reaches its specs" on a loaded machine while the same gate went
   * on to pass -- a slow start is not a missing one. A child that truly never
   * prints `text` still fails: it exits, or the bound above kills it, and
   * either way the waiter settles false.
   */
  const waitFor = (text, ms = boundMs) => new Promise((res) => {
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
// #1163: record the argv so a guard can assert which projects were asked for.
try { writeFileSync('fake-pw-argv.json', JSON.stringify(process.argv.slice(2))); } catch {}

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
} else if (mode === 'silent-in-flight' || mode === 'silent-stale-in-flight') {
  // #1199: a wedged run whose reporter recorded what was running, and whose stderr
  // shows an inspector session that has since exited (listening, then ending).
  const stale = mode === 'silent-stale-in-flight';
  const now = Date.now();
  mkdirSync('data/test-results', { recursive: true });
  writeFileSync('data/test-results/in-flight.json', JSON.stringify({
    runStartedAt: stale ? 1000 : now,
    updatedAt: now,
    running: [
      { worker: 1, project: 'compliance', file: 'quick.spec.ts', title: 'a test that began a moment ago', startedAt: now - 2000 },
      { worker: 3, project: 'compliance', file: 'x-timeline-display-block.spec.ts', title: 'the test that is stuck', startedAt: now - 188000 },
    ],
  }));
  console.error('Debugger listening on ws://127.0.0.1:1/dead-session');
  console.error('Debugger ending on ws://127.0.0.1:1/dead-session');
  setInterval(() => {}, 1000);
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
  // Every scripts/lib/*.mjs, not a hand-listed few. Naming them one at a time
  // is the fixture bug this repo has already paid for: the ratchet gained a
  // single import (#1181) and all 17 ratchet cases died on ERR_MODULE_NOT_FOUND
  // instead of on a verdict -- which is what #1161 says about the gate cases,
  // and why gateFixture has copied the whole directory since.
  await copyLib(dir);
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
      // #1181: a stall measured nothing. Still non-zero, still blocking -- but
      // distinguishable from 'this batch broke tests', which is the whole point.
      ['it exits with the no-verdict code', r.code === NO_VERDICT_EXIT, `exit ${r.code}`],
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

/**
 * #1199: a stall names the test that is RUNNING, not the last one to finish.
 *
 * The 2026-09-19 report named test 7863, which had completed, and then printed 55
 * identical "connection failed" lines from inspector sessions of workers that had
 * already exited. Neither said what was stuck.
 */
const stallNamesRunningTest = () => ratchetCase(
  'Ratchet: a stall names the test that is running, longest first, with no dead-session noise (#1199)',
  { WB_FAKE_PW_MODE: 'silent-in-flight', WB_GATE_ACK_MIN: '0.05' },
  90_000,
  async (r, out) => {
    const stuckAt = out.indexOf('the test that is stuck');
    const quickAt = out.indexOf('a test that began a moment ago');
    return [
      ['it returns on its own', !r.boundHit, `still running after ${r.ms}ms\n${tail(out)}`],
      ['it names the stuck test and its worker', /x-timeline-display-block\.spec\.ts > the test that is stuck\s+\(worker 3, running 1\d\ds\)/.test(out), tail(out, 25)],
      ['it lists the longest-running test first', stuckAt !== -1 && quickAt !== -1 && stuckAt < quickAt, tail(out, 25)],
      ['it says last-to-finish is not the stuck one', /last test seen : .*\(the last to FINISH, not the stuck one\)/.test(out), tail(out, 25)],
      ['the HANG verdict carries the running test too', /Running when it stopped: .*the test that is stuck/.test(out), tail(out, 25)],
      ['a session that already exited is not queried or reported', !out.includes('connection failed') && !out.includes('no report'), tail(out, 25)],
    ];
  }
);

/** A file left by an earlier run is not this run's stuck test (#1199). */
const stallIgnoresStaleInFlight = () => ratchetCase(
  'Ratchet: an in-flight file from an earlier run is never named as the stuck test (#1199)',
  { WB_FAKE_PW_MODE: 'silent-stale-in-flight', WB_GATE_ACK_MIN: '0.05' },
  90_000,
  async (r, out) => [
    ['it returns on its own', !r.boundHit, `still running after ${r.ms}ms\n${tail(out)}`],
    ['it does not name the stale test', !out.includes('the test that is stuck'), tail(out, 25)],
    ['it says plainly that it does not know what was running', /running now {4}: unknown - the in-flight file is from an earlier run/.test(out), tail(out, 25)],
  ]
);

/**
 * WB_GATE_PROJECTS narrows the gate, and an unknown name is refused (#1163).
 *
 * 'CI - Full Compliance' wanted the compliance project only and, having no way
 * to ask the gate for it, hand-wrote its own playwright command: no register,
 * so 66 of its 79 failures were recorded debt; --reporter= replacing the
 * project's reporters, so data/errors.json was never written. The workflow had
 * never been green.
 *
 * The refusal matters as much as the narrowing. A typo in WB_GATE_PROJECTS must
 * not leave the gate running NO projects and reporting success -- that is #1091,
 * an instrument reporting a verdict it never measured.
 */
const narrowedRun = () => ratchetCase(
  'Ratchet: WB_GATE_PROJECTS narrows the run to the projects it names (#1163)',
  { WB_FAKE_PW_MODE: 'healthy', WB_FAKE_PW_MS: '1500', WB_GATE_ACK_MIN: '5', WB_GATE_PROJECTS: 'compliance' },
  90_000,
  async (r, out, dir) => {
    let argv = [];
    try { argv = JSON.parse(readFileSync(join(dir, 'fake-pw-argv.json'), 'utf8')); } catch { /* never ran */ }
    const projects = argv.filter((a) => a.startsWith('--project='));
    return [
      ['the run reaches a verdict', r.code === 0 && out.includes('No new failures'), `exit ${r.code}\n${tail(out)}`],
      ['exactly the named project is run', JSON.stringify(projects) === JSON.stringify(['--project=compliance']),
        `playwright was asked for: ${JSON.stringify(projects)}`],
    ];
  }
);

const unknownProjectRefused = () => ratchetCase(
  'Ratchet: an unknown WB_GATE_PROJECTS name is refused, not silently skipped (#1163)',
  { WB_FAKE_PW_MODE: 'healthy', WB_FAKE_PW_MS: '1500', WB_GATE_ACK_MIN: '5', WB_GATE_PROJECTS: 'complaince' },
  90_000,
  async (r, out, dir) => [
    ['it refuses rather than running', r.code !== 0 && !r.boundHit, `exit ${r.code}\n${tail(out)}`],
    ['it never started Playwright at all', !existsSync(join(dir, 'fake-pw-argv.json')),
      'the fake runner was launched despite the unknown project name'],
    ['it names the typo and the projects it does have', /complaince/.test(out) && /compliance, regression, behaviors/.test(out), tail(out)],
    // Nothing was measured, so this is not a verdict on the code (#1181).
    ['it exits with the no-verdict code', r.code === NO_VERDICT_EXIT, `exit ${r.code}`],
  ]
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
    // #1181: the ceiling is a stall too -- nothing was measured.
    ['it exits with the no-verdict code, naming the ceiling',
      r.code === NO_VERDICT_EXIT && out.includes('minute ceiling') && out.includes('That is a HANG'),
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
    // #1181: a dead server measured nothing, so this is NO_VERDICT_EXIT rather
    // than 1. Blocking is still the point; blaming the batch never was.
    ['it blocks (nothing was verified)', r.code === NO_VERDICT_EXIT && !r.boundHit, `exit ${r.code}\n${tail(out)}`],
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

// ─── RATCHET STUBS (used by the release cases) ───────────────────────────────

/** Stands in for the full suite: announces itself, runs until stdin closes. */
const STUB_RATCHET = `
console.log('STUB-GIT-ENV ' + JSON.stringify(Object.keys(process.env).filter((k) => /^GIT_/.test(k))));
console.log('STUB-RATCHET-STARTED');
process.stdin.resume();
process.stdin.on('end', () => { console.log('STUB-RATCHET-DONE'); process.exit(0); });
`;

/**
 * Stands in for a ratchet that measured nothing (#1181).
 *
 * It prints the real ratchet's own words and exits with the no-verdict code.
 * Callers must repeat that, not translate it into 'the batch broke tests' --
 * which is what release.mjs did on 2026-09-15 about a run that had passed.
 */
const STUB_RATCHET_NO_VERDICT = `
console.log('STUB-RATCHET-STARTED');
console.error('THE SUITE NEVER RAN - this is not a code failure.');
console.error('   Nothing was verified, so nothing is known.');
process.exit(3);
`;

// ─── THE OTHER PLAYWRIGHT LAUNCHES ON THE RELEASE PATH (#1128) ───────────────
//
// scripts/release.mjs (the full ratchet) and scripts/priority-gate.mjs (run by
// hand since 2026-10-02; it left the commit hook) are driven here, unmodified,
// in a throwaway directory whose Playwright CLI is a fake and whose lock dir is
// private. The commit hook itself no longer launches Playwright at all.

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
    const started = await gate.waitFor('FAKE-PW-STARTED');
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
    const waited = await gate.waitFor('the machine is busy');
    const checks = [
      ['it reports it is waiting', waited, tail(gate.output())],
      ['its specs do not start beside the suite', !gate.output().includes('FAKE-PW-STARTED') && !fakeRun(fx.root), tail(gate.output())],
    ];
    await guards.removeLock();
    checks.push(['the release notifies it, and its specs start', await gate.waitFor('FAKE-PW-STARTED'), tail(gate.output())]);
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
  // Gate 2 reads the version's entry from data/releases.json (1.0 replaced the
  // hand-edited What's New page with it).
  'data/releases.json': JSON.stringify({ releases: [{ version: '9.9.10', items: [{ kind: 'fixed', html: 'fixture' }] }] }) + '\n',
});
const RELEASE = join('scripts', 'release.mjs');

const releaseHoldsTheMachine = () => pathCase(
  'Release: while its ratchet runs, the machine-wide lock is held',
  releaseFiles(),
  async ({ fx, guards, launch }) => {
    const rel = launch(RELEASE, { args: ['--check'] });
    const started = await rel.waitFor('STUB-RATCHET-STARTED');
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

/**
 * A release aborted on a no-verdict run says so, and does not blame the batch (#1181).
 *
 * On 2026-09-15 the ratchet printed 'THE SUITE NEVER RAN - this is not a code
 * failure' and release.mjs answered, about that same run, 'the ratchet found
 * NEW failures ... this batch broke them'. Someone then went looking for a
 * regression that did not exist. The distinction was in the output and died at
 * the process boundary.
 */
const releaseNoVerdict = () => pathCase(
  'Release: a ratchet that measured nothing aborts without blaming the batch (#1181)',
  { ...releaseFiles(), '.husky/test-ratchet.mjs': STUB_RATCHET_NO_VERDICT },
  async ({ launch }) => {
    const rel = launch(RELEASE, { args: ['--check'] });
    const r = await rel.exited;
    const out = rel.output();
    return [
      ['the release is aborted', r.code !== 0 && !r.boundHit, `exit ${r.code}\n${tail(out)}`],
      ['it does NOT claim new failures', !/found NEW failures|this batch broke them/.test(out), tail(out)],
      ['it says nothing was measured', /no verdict|nothing is known/i.test(out), tail(out)],
    ];
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

// ─── RUN ───────────────────────────────────────────────────────────────────
console.log('🚧 gate guards — every Playwright run on the commit and release path is bounded and holds the machine (#1106, #1128)');

if (!existsSync(LIST_REPORTER)) {
  console.log(`\n❌ Playwright's list reporter is not at ${LIST_REPORTER} — run: npm install`);
  process.exit(1);
}

// Independent fixtures, private lock dirs: safe to run side by side.
const sections = await Promise.all([
  silentRun(),
  stallNamesRunningTest(),
  stallIgnoresStaleInFlight(),
  endlessRun(),
  narrowedRun(),
  unknownProjectRefused(),
  finishedThenQuietRun(),
  serverDiedRun(),
  mixedRun(),
  remoteRefusedRun(),
  healthyRun('a plain Windows console', {}),
  healthyRun('Windows Terminal (WT_SESSION)', { WT_SESSION: 'gate-guard' }),
  healthyRun('the VS Code terminal (TERM_PROGRAM=vscode)', { TERM_PROGRAM: 'vscode' }),
  healthyRun('a colour-forcing shell (FORCE_COLOR=1)', { FORCE_COLOR: '1' }),
  priorityHoldsASlot(),
  priorityWaitsForASuite(),
  priorityBound(),
  priorityWaitBound(),
  releaseHoldsTheMachine(),
  releaseBound(),
  releaseNoVerdict(),
]);

for (const { label, results } of sections) {
  console.log(`\n${label}:`);
  for (const [name, ok, detail] of results) check(name, ok, detail);
}

console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
