#!/usr/bin/env node
/**
 * Which work in this tree is ready to commit — right now.
 * =============================================================================
 * John, 2026-09-05: "we need a way to determine which of these are ready for a
 * commit at any time."
 *
 *   node scripts/commit-readiness.mjs              # the report
 *   node scripts/commit-readiness.mjs --ready      # just the issue numbers, for scripting
 *   node scripts/commit-readiness.mjs --all        # include issues with no work in the tree
 *
 * Three facts already exist separately; this joins them:
 *
 *   data/priority-gate.json         what each issue is rated, and the test it names
 *   data/test-results/failures.json what failed in the last run
 *   git status + diff               what has actually changed, and which issues it cites
 *
 * An issue is READY when all four hold:
 *   1. work for it exists in the tree (a changed file citing #NNNN)
 *   2. its Signature names a runnable test
 *   3. that test did NOT fail in the last recorded run
 *   4. its Signature records `fix:` — what actually fixed it, in one line
 *
 * Anything short of that is named with the reason, because "ready" is a claim
 * and the whole point is not to make it loosely. Nothing here runs tests: it
 * reports the last recorded result and says how old that is, so a stale answer
 * announces itself rather than passing as fresh.
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const MANIFEST = 'data/priority-gate.json';
const readyOnly = process.argv.includes('--ready');
const includeUntouched = process.argv.includes('--all');

const git = (args) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return '';
  }
};

// ── what changed, and which issues those changes cite ────────────────────────
const changedFiles = git(['status', '--porcelain'])
  .split('\n')
  .map((l) => l.slice(3).trim())
  .filter(Boolean);

const diff = git(['diff', 'HEAD', '-U0']) + git(['diff', '--cached', '-U0']);
const citedIssues = new Map();          // issue number -> Set(files)
{
  let file = null;
  for (const line of diff.split('\n')) {
    const f = line.match(/^\+\+\+ b\/(.+)$/);
    if (f) { file = f[1]; continue; }
    if (!line.startsWith('+') || !file) continue;
    // A session log or a generated artefact mentions dozens of issues without
    // being work on any of them -- counting those made every issue look started.
    if (file.startsWith('docs/_today/') || file.startsWith('data/')) continue;
    for (const m of line.matchAll(/#(\d{3,4})\b/g)) {
      const n = Number(m[1]);
      if (!citedIssues.has(n)) citedIssues.set(n, new Set());
      citedIssues.get(n).add(file);
    }
  }
}

// ── what the last run actually did, per spec ─────────────────────────────────
//
// NOT the failure list alone. Absence from it is not proof of passing — a spec
// that never ran is absent too, and reporting that as ready is how a tool starts
// lying. The per-project files record EVERY test with its status, so passed,
// failed and never-ran are three different answers here.
const specStatus = new Map();          // 'regression/foo.spec.ts' -> {passed, failed}
let resultsAge = null;
for (const project of ['compliance', 'regression', 'behaviors', 'base', 'integration']) {
  const file = `data/test-results/${project}.json`;
  if (!existsSync(file)) continue;
  const j = JSON.parse(readFileSync(file, 'utf8'));
  for (const t of j.tests || []) {
    const key = String(t.file).split('\\').join('/');
    const rec = specStatus.get(key) || { passed: 0, failed: 0 };
    if (t.status === 'passed') rec.passed += 1;
    else if (t.status === 'failed' || t.status === 'timedOut') rec.failed += 1;
    specStatus.set(key, rec);
  }
  const age = (Date.now() - statSync(file).mtimeMs) / 3_600_000;
  resultsAge = resultsAge === null ? age : Math.min(resultsAge, age);
}

/** Results record specs without the leading `tests/` — accept either spelling. */
function statusOf(spec) {
  return specStatus.get(spec.replace(/^tests\//, '')) || specStatus.get(spec) || null;
}

// ── the issues, with priority and named test ─────────────────────────────────
if (!existsSync(MANIFEST)) {
  console.error(`${MANIFEST} missing — run: node scripts/build-priority-gate.mjs`);
  process.exit(2);
}
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));

const rows = [];
for (const [priority, list] of Object.entries(manifest.issues)) {
  for (const issue of list) {
    const files = citedIssues.get(issue.number);
    if (!files && !includeUntouched) continue;

    const test = issue.test || '';
    // A `test:` reading "drafted…" or "a spec is still wanted" is a note, not
    // proof. Only a real spec path or a runnable command counts as named.
    const spec = /\.spec\.ts(\s|$)/.test(test) ? test.split(/\s+/)[0] : null;
    const command = /^node\s/.test(test);
    const blockers = [];

    if (!files) blockers.push('no work in this tree');
    if (!test) blockers.push('no runnable test named');
    else if (!spec && !command) blockers.push(`test: is prose, not runnable ("${test.slice(0, 44)}")`);

    if (spec && !existsSync(spec)) {
      blockers.push(`named test not on disk (${spec})`);
    } else if (spec) {
      const st = statusOf(spec);
      if (!st) blockers.push('its test did not run in the last recorded run — unproven');
      else if (st.failed) blockers.push(`its test FAILED last run (${st.failed} of ${st.passed + st.failed})`);
    }

    rows.push({
      number: issue.number,
      priority: Number(priority),
      title: issue.title,
      test,
      files: files ? [...files] : [],
      blockers,
      ready: blockers.length === 0,
    });
  }
}

rows.sort((a, b) => Number(b.ready) - Number(a.ready) || a.priority - b.priority || a.number - b.number);

if (readyOnly) {
  console.log(rows.filter((r) => r.ready).map((r) => r.number).join(' '));
  process.exit(0);
}

const ready = rows.filter((r) => r.ready);
const blocked = rows.filter((r) => !r.ready);

console.log(`commit readiness — ${changedFiles.length} changed path(s), ${citedIssues.size} issue(s) cited in the diff`);
if (resultsAge === null) {
  console.log('  ⚠️  no test results on record — nothing below can be called proven');
} else if (resultsAge > 24) {
  console.log(`  ⚠️  last results are ${Math.round(resultsAge)}h old — re-run before trusting them`);
} else {
  console.log(`  last results: ${Math.round(resultsAge)}h old, ${specStatus.size} specs recorded`);
}

console.log(`\n✅ READY (${ready.length})`);
for (const r of ready) {
  console.log(`   P${r.priority}  #${r.number}  ${r.title.slice(0, 62)}`);
  console.log(`         test ${r.test}`);
  console.log(`         files ${r.files.slice(0, 4).join(', ')}${r.files.length > 4 ? ` +${r.files.length - 4}` : ''}`);
}

console.log(`\n⛔ NOT READY (${blocked.length})`);
for (const r of blocked) {
  console.log(`   P${r.priority}  #${r.number}  ${r.title.slice(0, 62)}`);
  console.log(`         ${r.blockers.join('; ')}`);
}

// Changed files citing no issue at all — the "no issue, no fix" rule, checked.
const cited = new Set([...citedIssues.values()].flatMap((s) => [...s]));
const uncited = changedFiles.filter((f) => !cited.has(f) && /\.(js|ts|css|html|mjs)$/.test(f));
if (uncited.length) {
  console.log(`\n📎 changed but citing no issue (${uncited.length}) — every fix needs one:`);
  for (const f of uncited.slice(0, 15)) console.log('     ' + f);
  if (uncited.length > 15) console.log(`     … and ${uncited.length - 15} more`);
}
