/**
 * Test ratchet — issue #959.
 *
 * WHY A RATCHET AND NOT A PASS/FAIL GATE
 *
 * The 10th-commit block in .husky/pre-commit used to run compliance +
 * regression + behaviors and exit 1 if ANY of them was red. The suite has been
 * red for months (499 gate failures over 227 files, median 1 per file), so that
 * gate did two things, both bad:
 *
 *   1. It blocked every commit, permanently — the counter is not reset on a red
 *      run, so once it fires it fires forever.
 *   2. It detected nothing. A regression introduced today arrived as one more
 *      line among 499 pre-existing ones. The gate could not tell this commit's
 *      breakage from January's.
 *
 * Blocked AND blind is strictly worse than unblocked with real detection.
 *
 * This is the same argument .husky/lint-ratchet.mjs (#840) already makes for
 * lint, in its own words: "a gate too strict to pass gets bypassed, and the
 * --no-verify habit takes every other check down with it." The lint check became
 * a ratchet. The test gate never did. This is that change.
 *
 * HOW IT RATCHETS
 *
 * The baseline is a set of `file › full test title` identities that are KNOWN to
 * fail. On each full run:
 *
 *   - a failure IN the baseline is debt: reported, not fatal.
 *   - a failure NOT in the baseline is a regression: fatal.
 *   - a baseline entry that now PASSES is reported as a removal candidate. It is
 *     NOT dropped automatically: on an unstable suite one lucky pass would eject
 *     a broken test, which then blocks the next unrelated commit.
 *
 * The register only changes on an explicit `--update` — a deliberate act with a
 * diff someone can review, the same way .husky/lint-baseline.json is maintained.
 *
 * FLAKY IS NOT A CATEGORY
 *
 * There are no retries and no confirmation re-runs here. A test that fails is a
 * failed test. playwright.config.ts already sets retries: 0 and says why --
 * "retries: 1 does not make a test more reliable, it makes an unreliable test
 * INVISIBLE" -- and a re-run at the gate layer is the same thing wearing a
 * different word. An unstable test belongs IN the register as broken, and comes
 * out of it by being fixed.
 *
 * NOT AN AMNESTY
 *
 * Everything in the baseline is still broken and still wants fixing. The file is
 * a debt register, not a permission slip. It shrinking over time is the point;
 * if it stops shrinking, that is a signal in itself.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const BASELINE_PATH = join(REPO, 'data', 'test-baseline-failures.json');
const FAILURES_PATH = join(REPO, 'data', 'test-results', 'failures.json');

// Upper bound on one full Playwright run. ~47 minutes is normal at 4 workers;
// 75 leaves room for a slow run while guaranteeing a stuck one ends. Before
// this existed a stalled run held a commit for 13 hours with no output.
const RUN_TIMEOUT_MS = (Number(process.env.WB_GATE_TIMEOUT_MIN) || 75) * 60 * 1000;

// SILENCE, NOT WALL CLOCK, IS WHAT SAYS 'STUCK' (#1106).
//
// The wall-clock timeout above cannot tell a slow run from a stopped one, so
// on 2026-09-13 a stalled gate burned 185 minutes and produced no verdict at
// all -- not a pass, not a fail. It had stopped at 894 of ~7700 tests and
// nothing noticed, because the parent blocked in spawnSync with
// stdio:'inherit' and never saw a single line of output.
//
// Playwright already emits one line per test. That IS the acknowledgement;
// there is no heartbeat to invent and nothing to poll (Law 18). The gate just
// has to stop throwing the stream away and hold a deadline that every line
// resets. Per-test timeout is 30s, so a healthy run never goes near 3 minutes
// between lines.
const ACK_SILENCE_MS = (Number(process.env.WB_GATE_ACK_MIN) || 3) * 60 * 1000;

// After evidence is captured, SIGTERM first: Playwright can flush its trace and
// its report on a catchable signal. SIGKILL cannot be caught, which is exactly
// why the 185-minute run left nothing behind to read.
const SIGINT_GRACE_MS = 15_000;
const SIGTERM_GRACE_MS = 30_000;
const PROJECTS = ['compliance', 'regression', 'behaviors'];

const update = process.argv.includes('--update');

/** Stable identity for one test, independent of OS path separators. */
const idFor = (file, title) => `${String(file).split('\\').join('/')} › ${title}`;

function loadBaseline() {
  if (!existsSync(BASELINE_PATH)) {
    console.error(`\n🛑 No test baseline at ${BASELINE_PATH}.`);
    console.error('   Record one with:  node .husky/test-ratchet.mjs --update\n');
    process.exit(1);
  }
  try {
    const raw = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
    return new Set(raw.failures || []);
  } catch (err) {
    console.error(`\n🛑 Test baseline is unreadable: ${err.message}`);
    console.error('   Fix or re-record it; refusing to guess.\n');
    process.exit(1);
  }
}

function saveBaseline(failures, note) {
  const payload = {
    note: [
      'Known-failing tests — the debt register for .husky/test-ratchet.mjs (#959).',
      'A commit fails only on a failure NOT listed here.',
      'This is the UNION of everything observed failing, not one run: ~20 tests',
      'in this suite change state between identical runs (#961), and an unstable',
      'test is a broken test, so it is recorded here rather than excused.',
      'Nothing is removed automatically — a single lucky pass is not a fix.',
      'Shrink it deliberately with --update once a fix is real.',
    ],
    recorded: note,
    count: failures.length,
    failures: [...failures].sort(),
  };
  writeFileSync(BASELINE_PATH, JSON.stringify(payload, null, 2) + '\n');
}

/**
 * Run the three gate projects in ONE invocation and read the failures the
 * project's own reporter already writes.
 *
 * The first version of this passed `--reporter=line,json` and read
 * PLAYWRIGHT_JSON_OUTPUT_NAME. No JSON ever appeared, so every run reported
 * "THE SUITE NEVER RAN" -- a gate that fails closed on its own plumbing is
 * just a differently-worded block. playwright.config.ts already installs
 * scripts/tools/test-reporter.ts, which writes data/test-results/failures.json
 * as {project, title, file, line, error}. Reading that means the ratchet and
 * the rest of the tooling agree on what a failure is, by construction.
 *
 * One invocation, not three: same server, and failures.json is written once
 * for the whole run rather than being overwritten per project.
 */
async function runGate(port) {
  const started = Date.now();

  // Spawn Playwright's CLI with node directly, NOT `npx.cmd`. Node 18.20+/20.12+
  // refuses to spawn .cmd/.bat without `shell: true` and fails with EINVAL --
  // which is exactly what happened here: the gate reported "THE SUITE NEVER RAN"
  // in under a second, having never launched anything. Going through the CLI
  // entry point needs no shell and behaves the same on every platform.
  const cli = join(REPO, 'node_modules', '@playwright', 'test', 'cli.js');
  if (!existsSync(cli)) {
    return { failures: null, why: `Playwright CLI not found at ${cli} — run: npm install` };
  }

  // WORKERS: the gate runs at reduced concurrency, deliberately.
  //
  // Measured 2026-09-05: four consecutive gate runs on an UNCHANGED tree gave
  // four DISJOINT sets of "new" failures — 3, then 7, then 3, then 3 — with no
  // test repeating and every one of them passing when run alone. The suite is
  // not randomly broken: a large family of specs asserts on state it has not
  // waited for (a flat `sleep(400)` after a click; a locator read before the
  // behavior has upgraded the element), and 8 workers against one dev server
  // widen the window they are already racing in until a different handful loses
  // each time.
  //
  // Chasing the sample is a treadmill — it cost about five hours and one commit
  // on the day this was written. Lower concurrency does NOT fix the
  // under-synchronisation (#962 is the root cause, and those specs still want
  // signals instead of sleeps); it stops the gate accusing a fresh set of
  // innocent tests on every attempt, which is what made the gate unusable.
  //
  // The trade is wall clock: ~40min at 8, longer at 4. A slower gate that means
  // something beats a fast one that has to be ignored. WB_GATE_WORKERS overrides
  // this; drop to 2 if a rotating set survives at 4.
  const workers = process.env.WB_GATE_WORKERS || '4';
  const args = [
    cli, 'test',
    ...PROJECTS.map((p) => `--project=${p}`),
    `--workers=${workers}`,
  ];

  // spawn, not spawnSync: a blocked parent cannot supervise anything. This one
  // stays alive, tees the child's output through to the terminal exactly as
  // stdio:'inherit' did, and watches it for the per-test lines.
  // --inspect so a STALL CAN BE ASKED WHERE IT IS (#1106).
  //
  // Process lists and port tables say the run stopped. They do not say what it
  // stopped ON. The inspector does: pausing a wedged process yields the real JS
  // stack, with function names, files and line numbers. Port 0 lets the OS pick,
  // so parallel worktrees cannot collide; node prints the ws:// URL on stderr
  // and the tee below captures it.
  const child = spawn(process.execPath, ['--inspect=0', ...args], {
    cwd: REPO,
    stdio: ['ignore', 'pipe', 'pipe'],
    // NODE_OPTIONS reaches the WORKERS too, not just this runner. The stalled
    // test lives in a worker, so an inspector on the runner alone cannot see it.
    // Port 0 everywhere: the OS assigns, nothing collides, and each process
    // announces its own ws:// URL on stderr where the tee collects it.
    env: {
      ...process.env,
      ...(port ? { WB_TEST_PORT: String(port) } : {}),
      NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --inspect=0`.trim(),
    },
  });

  // `  ok  1234 [project] > file:line > title (12ms)` and its x/- variants.
  //
  // THE MARK DEPENDS ON THE COMMITTER'S TERMINAL (#1106). Playwright's list
  // reporter prints ok/x only on a Windows console that is neither Windows
  // Terminal nor VS Code; under WT_SESSION or TERM_PROGRAM=vscode it prints
  // U+2713/U+2718, and FORCE_COLOR wraps the mark in ANSI codes. The hook
  // inherits that environment, so matching ok|x alone saw zero tests finish
  // and killed a HEALTHY gate as a stall three minutes in. Strip colour, accept
  // both mark sets. Guarded by scripts/test-gate-guards.mjs.
  const ACK = /^\s*(ok|x|-|✓|✘)\s+\d+\s/;
  // ESC built from its code, so the regex carries no literal control character.
  const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*[A-Za-z]`, 'g');
  let acks = 0;
  let lastAckAt = Date.now();
  let lastTest = '(none yet)';
  const inspectorUrls = new Set();
  let stallId = null;

  const tee = (stream, out) => {
    let carry = '';
    stream.on('data', (buf) => {
      out.write(buf);
      const lines = (carry + buf.toString()).split('\n');
      carry = lines.pop() || '';
      for (const raw of lines) {
        const line = raw.replace(ANSI, '');
        const dbg = line.match(/Debugger listening on (ws:\/\/\S+)/);
        if (dbg) inspectorUrls.add(dbg[1]);
        if (!ACK.test(line)) continue;
        acks += 1;
        lastAckAt = Date.now();
        lastTest = line.trim().slice(0, 160);
      }
    });
  };
  tee(child.stdout, process.stdout);
  tee(child.stderr, process.stderr);

  /**
   * Pause the wedged process and read its stack.
   *
   * This is the answer to 'where is the stack' -- a stall report that lists
   * processes and ports says the run STOPPED, not what it stopped ON.
   *
   * Only the runner is inspected, not the workers: each worker is its own
   * process with its own inspector, and wiring all of them is a bigger change.
   * When every worker goes quiet, the runner's own stack is what shows whether
   * it is waiting on a worker, on the webServer, or on something of its own.
   */
  /**
   * Ask every node process in the run where it is stuck.
   *
   * NOT Debugger.pause: that only fires when JavaScript is RUNNING, and a
   * wedged process is usually idle in the event loop with nothing to pause on.
   * Measured 2026-09-13: pause timed out at 15s against a genuinely stalled
   * run, which is the worst possible time for the tool to go quiet.
   *
   * Runtime.evaluate injects execution, so it answers even when idle, and
   * process.report.getReport() carries the two things a hang needs: the JS
   * stack, and the libuv handles naming WHAT is being waited on -- a socket, a
   * child process, a timer that will never fire.
   */
  async function grabStacks() {
    const urls = [...inspectorUrls];
    if (!urls.length) return { error: 'no inspector url appeared on stderr' };

    const EXPR = `(() => {
      const r = process.report.getReport();
      return JSON.stringify({
        pid: process.pid,
        argv: (process.argv || []).slice(1, 4),
        js: (r.javascriptStack && r.javascriptStack.stack) || [],
        waitingOn: (r.libuv || [])
          .filter((h) => h.is_active)
          .map((h) => h.type + (h.details ? ' ' + JSON.stringify(h.details).slice(0, 90) : ''))
          .slice(0, 12),
      });
    })()`;

    const ask = (url) => new Promise((resolve) => {
      let ws;
      const bail = setTimeout(() => {
        try { ws && ws.close(); } catch { /* already closed */ }
        resolve({ url, error: 'no answer in 12s' });
      }, 12_000);
      try { ws = new WebSocket(url); } catch (err) {
        clearTimeout(bail); return resolve({ url, error: err.message });
      }
      ws.onerror = () => { clearTimeout(bail); resolve({ url, error: 'connection failed' }); };
      ws.onopen = () => ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: EXPR, returnByValue: true, awaitPromise: false },
      }));
      ws.onmessage = (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }
        if (msg.id !== 1) return;
        clearTimeout(bail);
        try { ws.close(); } catch { /* already closed */ }
        const raw = msg.result?.result?.value;
        if (!raw) return resolve({ url, error: msg.result?.exceptionDetails?.text || 'empty report' });
        try { resolve(JSON.parse(raw)); } catch (err) { resolve({ url, error: err.message }); }
      };
    });

    return { processes: await Promise.all(urls.map(ask)) };
  }
  /** What the 185-minute run should have printed and did not. */
  function captureEvidence(reason, stack) {
    const quietMs = Date.now() - lastAckAt;
    const snap = (cmd) => {
      try {
        return spawnSync('powershell', ['-NoProfile', '-Command', cmd],
          { encoding: 'utf8', timeout: 20_000 }).stdout?.trim() || '';
      } catch { return '(snapshot failed)'; }
    };
    // ID AND SIGNATURE, matching data/errors.json's own convention:
    //   id        unique per OCCURRENCE, so two stalls never overwrite
    //   signature stable per CLASS, so recurrences group
    // The first version of this wrote a single stall.json and clobbered it on
    // every stall, destroying the evidence from the run before.
    const id = Date.now();
    const signature = 'test-ratchet.mjs|error|gate-stalled';
    const evidence = {
      id,
      signature,
      reason,
      at: new Date().toISOString(),
      testsSeen: acks,
      lastTest,
      silentForSeconds: Math.round(quietMs / 1000),
      elapsedSeconds: Math.round((Date.now() - started) / 1000),
      port: port || 'default',
      stack,
      processes: snap("Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'node|chrome' } | " +
        "Select-Object ProcessId,Name,@{n='CPUs';e={[math]::Round((Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue).CPU,1)}} | " +
        'ConvertTo-Json -Compress'),
      listening: snap("Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | " +
        'Where-Object { $_.LocalPort -ge 3000 -and $_.LocalPort -le 3400 } | ' +
        'Select-Object LocalPort,OwningProcess | ConvertTo-Json -Compress'),
    };
    try {
      mkdirSync(join(REPO, 'data', 'gate-evidence'), { recursive: true });
      writeFileSync(join(REPO, 'data', 'gate-evidence', `stall-${id}.json`),
        JSON.stringify(evidence, null, 2) + '\n');
    } catch { /* reporting a stall must not fail on a write */ }

    console.error(`\n\u{1F6D1} GATE STALLED - ${reason}`);
    console.error(`   error id       : ${id}`);
    console.error(`   signature      : ${signature}`);
    console.error(`   last test seen : ${lastTest}`);
    console.error(`   tests seen     : ${acks}`);
    console.error(`   silent for     : ${Math.round(quietMs / 1000)}s`);
    console.error(`   elapsed        : ${Math.round((Date.now() - started) / 1000)}s`);
    if (stack?.processes?.length) {
      for (const proc of stack.processes) {
        if (proc.error) {
          console.error(`   pid ?          : no report - ${proc.error}`);
          continue;
        }
        console.error(`   pid ${proc.pid} stack:`);
        for (const line of (proc.js || []).slice(0, 10)) console.error(`       ${line}`);
        if (proc.waitingOn?.length) {
          console.error(`   pid ${proc.pid} waiting on: ${proc.waitingOn.join(', ')}`);
        }
      }
    } else if (stack?.error) {
      console.error(`   stack          : unavailable - ${stack.error}`);
    }
    console.error(`   evidence       : data/gate-evidence/stall-${id}.json`);
    return evidence;
  }

  const outcome = await new Promise((resolve) => {
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; clearInterval(watch); resolve(v); } };

    // One deadline, reset by the acks Playwright already sends. The interval
    // only reads a timestamp -- it asks the child nothing and waits on nothing.
    let firing = false;
    const watch = setInterval(async () => {
      if (firing) return;
      const quiet = Date.now() - lastAckAt;
      const overall = Date.now() - started;
      if (quiet < ACK_SILENCE_MS && overall < RUN_TIMEOUT_MS) return;
      firing = true;

      const reason = quiet >= ACK_SILENCE_MS
        ? `no test finished for ${Math.round(quiet / 1000)}s`
        : `the run passed its ${RUN_TIMEOUT_MS / 60000}-minute ceiling`;

      // Stack BEFORE any signal: a terminated process has no stack to give.
      const stack = await grabStacks();
      stallId = captureEvidence(reason, stack).id;

      // SIGINT first. Playwright handles it: it names the tests still running
      // and flushes its report and trace. SIGTERM skips all of that, and
      // SIGKILL cannot be caught at all -- which is why the 185-minute run
      // left nothing behind.
      child.kill('SIGINT');
      const term = setTimeout(() => {
        console.error('   SIGINT ignored, sending SIGTERM.');
        try { child.kill('SIGTERM'); } catch { /* already gone */ }
      }, SIGINT_GRACE_MS);
      term.unref?.();
      const hard = setTimeout(() => {
        console.error('   still alive, sending SIGKILL.');
        try { child.kill('SIGKILL'); } catch { /* already gone */ }
      }, SIGINT_GRACE_MS + SIGTERM_GRACE_MS);
      hard.unref?.();
      done({ stalled: true, reason });
    }, 10_000);

    child.on('error', (err) => done({ spawnError: err }));
    child.on('close', (code) => done({ code }));
  });

  if (outcome.stalled) {
    return {
      failures: null,
      why: `${outcome.reason}. That is a HANG, not a result. The gate stopped after ` +
        `${acks} test(s), last: ${lastTest}. Error id ${stallId}, evidence: data/gate-evidence/stall-${stallId}.json`,
    };
  }

  const res = { error: outcome.spawnError, status: outcome.code };
  // Never swallow the spawn error. The first version of this discarded `res`
  // entirely, so a plain EINVAL was reported as the far more alarming and
  // completely wrong "the suite never ran, check your dev server port".
  if (res.error) return { failures: null, why: `could not start Playwright: ${res.error.message}` };

  if (!existsSync(FAILURES_PATH)) {
    return { failures: null, why: `${FAILURES_PATH} was never written (exit code ${res.status})` };
  }

  let report;
  try {
    report = JSON.parse(readFileSync(FAILURES_PATH, 'utf8'));
  } catch (err) {
    return { failures: null, why: `failures.json is unreadable: ${err.message}` };
  }

  // A stale file from an earlier run would silently pass a broken commit.
  const stamp = Date.parse(report.timestamp || 0);
  if (!Number.isFinite(stamp) || stamp < started - 60_000) {
    return { failures: null, why: `failures.json is stale (${report.timestamp}) — the run wrote nothing new` };
  }

  const gate = new Set(PROJECTS);
  const failures = (report.failures || [])
    .filter((f) => gate.has(f.project))
    .map((f) => idFor(f.file, f.title));
  return { failures };
}

function freePort() {
  const out = spawnSync(process.execPath, [
    '-e',
    "const net=require('net');const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>console.log(p));});",
  ], { encoding: 'utf8' });
  const p = parseInt((out.stdout || '').trim(), 10);
  return Number.isFinite(p) ? p : null;
}

// ── run ──────────────────────────────────────────────────────────────────────
//
// #1044: in CI, do NOT pick a private port. ci-tests.yml starts the server on
// 3000 itself and waits for /health, and playwright.config.ts only allows
// `reuseExistingServer` on that default port — so forcing a random one here
// would boot a SECOND server for no reason, on a runner that already has one
// healthy. Locally the private port stays, because there the point is not
// colliding with John's dev server.
const port = process.env.CI ? null : freePort();
if (port) console.log(`   (running on port ${port} so it cannot collide with a dev server)`);
else if (process.env.CI) console.log('   (CI: reusing the server ci-tests.yml already started on 3000)');

const gate = await runGate(port);
if (!gate.failures) {
  // Distinguishing "never ran" from "red" matters: a stale port or a missing
  // node_modules used to be reported as a code failure, which sent people
  // hunting a bug that did not exist.
  console.error('\n🛑 THE SUITE NEVER RAN — this is not a code failure.');
  console.error(`   Reason: ${gate.why || 'unknown'}`);
  console.error('   Other common causes:');
  console.error('     • the dev server port is still held by an orphaned run');
  console.error('     • node_modules is missing or incomplete (run: npm install)');
  console.error('   Nothing was verified, so nothing is known. Commit blocked.\n');
  process.exit(1);
}
const failing = new Set(gate.failures);

if (update) {
  // --update only SHRINKS the register: it drops what passed and never adds a
  // new failure (scripts/check-register-shrinks.mjs refuses that commit anyway).
  // A new failure is fixed, not recorded.
  const known = existsSync(BASELINE_PATH) ? loadBaseline() : failing;
  const kept = [...failing].filter((f) => known.has(f));
  const refused = [...failing].filter((f) => !known.has(f));
  saveBaseline(kept, new Date().toISOString().slice(0, 10));
  console.log(`\n✅ Baseline recorded: ${kept.length} known-failing tests (was ${known.size}).`);
  if (refused.length) {
    console.error(`\n❌ ${refused.length} NEW failure(s) were NOT recorded — fix them:`);
    for (const r of refused.slice(0, 25)) console.error(`     • ${r}`);
    process.exit(1);
  }
  process.exit(0);
}

const baseline = loadBaseline();
const regressions = [...failing].filter((f) => !baseline.has(f));

// NO RE-RUN, NO CONFIRMATION PASS, NO RETRY.
//
// An earlier version of this re-ran anything that looked new and blocked only
// if it failed twice, calling the rest "flapping". That is a retry wearing a
// different word, and playwright.config.ts already forbids it in terms that
// apply exactly here: "retries: 1 does not make a test more reliable -- it
// makes an unreliable test INVISIBLE."
//
// A test that fails is a failed test. There is no separate flaky category to
// grade on. So an unstable test is not excused per-run; it is RECORDED in the
// register as broken, like every other broken test, and it leaves the register
// only by passing. The register is therefore the union of everything observed
// failing, not a snapshot of one run -- which is what makes a genuinely new
// failure meaningful, and why a single observation is enough to block.
// Repaired = in the register, but no longer failing. The run covers all three
// gate projects, so "absent from the failure list" means it passed — or the
// test was renamed/deleted, which equally means the entry must not linger.
const repaired = [...baseline].filter((b) => !failing.has(b));

console.log('');
console.log(`   known-failing (debt) : ${failing.size - regressions.length}`);
console.log(`   new failures         : ${regressions.length}`);
console.log(`   repaired since baseline: ${repaired.length}`);

if (regressions.length) {
  console.error('\n❌ NEW test failures — commit blocked.');
  console.error('   These are not pre-existing debt; this change broke them:\n');
  for (const r of regressions.slice(0, 25)) console.error(`     • ${r}`);
  if (regressions.length > 25) console.error(`     … and ${regressions.length - 25} more`);
  console.error('');
  process.exit(1);
}

// Removal is DELIBERATE, never automatic.
//
// Auto-shrinking on a single passing run looks like the ratchet tightening, but
// on an unstable suite it is the same retry logic by another route: an unstable
// test passes once, gets ejected from the register, then fails on the next run
// and blocks a commit that had nothing to do with it. Worse, it would quietly
// declare a test "repaired" on one lucky observation.
//
// So a passing baseline entry is REPORTED as a candidate and nothing more. You
// remove it by running `node .husky/test-ratchet.mjs --update` once the fix is
// real. That matches how .husky/lint-baseline.json is maintained.
if (repaired.length) {
  console.log(`\n🔧 ${repaired.length} register entr(ies) passed this run — candidates for removal.`);
  console.log('   Confirm the fix, then: node .husky/test-ratchet.mjs --update');
}

console.log('\n✅ No new failures. Commit allowed.\n');
process.exit(0);
