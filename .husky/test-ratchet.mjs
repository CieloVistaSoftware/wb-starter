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
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const BASELINE_PATH = join(REPO, 'data', 'test-baseline-failures.json');
const FAILURES_PATH = join(REPO, 'data', 'test-results', 'failures.json');
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
function runGate(port) {
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

  const res = spawnSync(
    process.execPath,
    [
      cli, 'test',
      ...PROJECTS.map((p) => `--project=${p}`),
    ],
    {
      cwd: REPO,
      encoding: 'utf8',
      stdio: ['ignore', 'inherit', 'inherit'],
      env: { ...process.env, ...(port ? { WB_TEST_PORT: String(port) } : {}) },
    }
  );

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
const port = freePort();
if (port) console.log(`   (running on port ${port} so it cannot collide with a dev server)`);

const gate = runGate(port);
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
  saveBaseline([...failing], new Date().toISOString().slice(0, 10));
  console.log(`\n✅ Baseline recorded: ${failing.size} known-failing tests.`);
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
