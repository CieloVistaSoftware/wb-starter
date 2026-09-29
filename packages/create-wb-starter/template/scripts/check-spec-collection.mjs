#!/usr/bin/env node
/**
 * check-spec-collection.mjs — a spec that collects nothing is a spec that lies
 * ===========================================================================
 * #1091. John: "nothing here can distinguish a test that passed from a test that
 * never ran ... is a serious oversight, should not have ever happened."
 *
 * Playwright exits 0 when a spec file collects ZERO tests. A file that throws at
 * module scope, or registers nothing, is reported as success by every gate,
 * runner and status file in this repo. It appears in the listing, carries a name
 * describing a real guarantee, goes green on every run, and is admissible as
 * evidence in a release gate.
 *
 * That is worse than a missing test. A missing test is visible. A test that
 * collects zero is invisible AND reassuring.
 *
 * SEVEN CONFIRMED SIGHTINGS, one hole:
 *
 *   #975   a module-scope regex threw; test:compliance reported "Total: 0 tests"
 *          and exited having checked nothing -- for twelve days
 *   #1049  a literal 0x08 made four checks match nothing, passing forever
 *   #1041  any file containing "#1234" counted as work on it
 *   #1085  a comment reading "zero <x-demo>" counted as an <x-demo>
 *   end-key  a fixture doc rewritten to contain 0 demo blocks; the test died on
 *          its own precondition and sat in the register looking like a defect
 *   __dirname in an ESM spec: collected 0, reported green, guarded nothing
 *   a spec importing issue-state.mjs (which runs at module scope): 0, "passed"
 *
 * The last was the spec written to fix one of the others.
 *
 * WHAT THIS DOES
 *
 * Asks Playwright to LIST (not run) every test, then compares the spec files it
 * managed to collect against the spec files actually on disk. Anything on disk
 * that contributed no test is a failure, named, with Playwright's own collection
 * error attached when it has one.
 *
 * Listing is cheap -- no browser, no server -- so this can sit in the pre-commit
 * gate without costing anything.
 *
 *   node scripts/check-spec-collection.mjs
 *   node scripts/check-spec-collection.mjs --json    # machine-readable
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const JSON_OUT = process.argv.includes('--json');
const SLASH = String.fromCharCode(92);   // backslash, written this way on purpose:
const norm = (p) => String(p).split(SLASH).join('/');

/**
 * The top-level directories Playwright actually collected from.
 *
 * Derived from the report rather than hardcoded to 'tests': the projects also
 * cover `performance/`, and `packages/create-wb-starter/template/` carries spec
 * files that this config never runs. Hardcoding either way produces a false
 * verdict — a missed root hides real silent specs, an extra root reports the
 * template's specs as broken forever.
 */
export function rootsFrom(collected) {
  const roots = new Set();
  for (const f of collected) roots.add(f.split('/')[0]);
  return [...roots].sort();
}

/** Every *.spec.ts on disk, repo-relative, forward-slashed. */
export function specsOnDisk(root = 'tests') {
  const out = [];
  const walk = (dir) => {
    let entries = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.spec.ts')) out.push(p);
    }
  };
  walk(root);
  return out.sort();
}

/**
 * Spec files Playwright collected at least one test from, as ABSOLUTE paths.
 *
 * `suite.file` is relative to `config.rootDir` (here: <repo>/tests), NOT to the
 * repo root. Comparing those strings against a repo-root walk found 0 files on
 * disk and 598 collected -- a checker that reported everything fine because it
 * was comparing two different things. Absolute on both sides, or not at all.
 */
export function collectedSpecs(reportJson) {
  const rootDir = norm(reportJson.config?.rootDir || '');
  const files = new Set();
  const walk = (suites) => {
    for (const s of suites || []) {
      const hasTests = Array.isArray(s.specs) && s.specs.length > 0;
      if (hasTests && s.file) files.add(`${rootDir}/${norm(s.file)}`);
      if (s.suites) walk(s.suites);
    }
  };
  walk(reportJson.suites);
  return files;
}

/** Every directory the configured projects actually collect from, absolute. */
export function testDirsFrom(reportJson) {
  const dirs = new Set();
  for (const p of reportJson.config?.projects || []) {
    if (p.testDir) dirs.add(norm(p.testDir));
  }
  if (!dirs.size && reportJson.config?.rootDir) dirs.add(norm(reportJson.config.rootDir));
  return [...dirs];
}

function listTests() {
  // The config prints to stdout, so the JSON reporter cannot be read from the
  // pipe -- it has to be written to a file. Learned the hard way.
  const dir = mkdtempSync(join(tmpdir(), 'wb-collect-'));
  const out = join(dir, 'collect.json');
  try {
    // shell:true -- on Windows `npx` is npx.cmd and execFileSync cannot resolve
    // it without one. Without this the checker reported "Playwright wrote no
    // report", i.e. it silently checked nothing, which is the defect it exists
    // to catch.
    execFileSync('npx playwright test --list --reporter=json', {
      shell: true,
      env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: out },
      stdio: ['ignore', 'ignore', 'pipe'],
      encoding: 'utf8',
      maxBuffer: 128 * 1024 * 1024,
    });
  } catch {
    // A collection error makes --list exit non-zero. That is the case this tool
    // exists for, so the report is still read rather than treated as fatal.
  }
  if (!existsSync(out)) {
    console.error('\nCould not list tests: Playwright wrote no report.\n');
    process.exit(2);
  }
  const j = JSON.parse(readFileSync(out, 'utf8'));
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* leave it */ }
  return j;
}

/**
 * MAIN GUARD (#1091).
 *
 * Without this, importing anything from this file RUNS the checker. That is not
 * hypothetical: the spec written to test this very tool imported it, the import
 * executed the program, the spec collected ZERO tests, and Playwright reported
 * a pass — the tool built to catch silent specs producing one.
 *
 * It is the third time tonight a script that executes at module scope has done
 * this (scripts/issue-state.mjs did it twice). A module whose functions are
 * imported must be importable without starting a program.
 */
const invokedDirectly = (() => {
  const entry = norm(process.argv[1] || '');
  return entry.endsWith('/check-spec-collection.mjs') || entry.endsWith('check-spec-collection.mjs');
})();

if (invokedDirectly) {
  const report = listTests();
  const collected = collectedSpecs(report);
  const REPO = norm(process.cwd()) + '/';
  // testDirs overlap (tests, tests/compliance, ...), so union into a Set.
  const disk = [...new Set(testDirsFrom(report).flatMap((d) => specsOnDisk(d)))].sort();
  const silent = disk.filter((f) => !collected.has(f));

  // Playwright reports a module-scope throw as a top-level error naming the file.
  const errorFor = new Map();
  for (const e of report.errors || []) {
    const text = String(e.message || e.value || '');
    const loc = e.location?.file ? norm(e.location.file) : null;
    const hit = loc || (text.match(/([\w./-]+\.spec\.ts)/) || [])[1];
    if (hit) errorFor.set(norm(hit), text.split('\n')[0].slice(0, 200));
  }

  if (JSON_OUT) {
    console.log(JSON.stringify({
      onDisk: disk.length,
      collected: collected.size,
      silent: silent.map((f) => ({ file: f, error: errorFor.get(f) || null })),
    }, null, 2));
    process.exit(silent.length ? 1 : 0);
  }

  console.log(`\nSpec files on disk : ${disk.length}`);
  console.log(`Collected >=1 test : ${collected.size}`);

  if (!silent.length) {
    console.log('\nEvery spec on disk contributes at least one test.\n');
    process.exit(0);
  }

  console.error(`\nX ${silent.length} spec file(s) collected NOTHING.\n`);
  console.error('   Playwright exits 0 for these. They appear in the suite, carry a name');
  console.error('   describing a guarantee, and go green forever while checking nothing.\n');
  for (const f of silent) {
    console.error(`     ${f.startsWith(REPO) ? f.slice(REPO.length) : f}`);
    const err = errorFor.get(f);
    if (err) console.error(`       ${err}`);
  }
  console.error('\n   Usual causes: a throw at module scope (an import that runs a program,');
  console.error('   a regex built at load), or a file that registers no test at all.\n');
  process.exit(1);

}
