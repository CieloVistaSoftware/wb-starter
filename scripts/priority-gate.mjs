#!/usr/bin/env node
/**
 * The priority gate — severity decides how hard the check bites.
 * =============================================================================
 * Runs the tests named by open PRIORITY 1 issues. Nothing else. It is deliberately
 * small: a gate that runs in a minute on every commit catches the regressions
 * that matter most, where a 40-minute full matrix runs once in ten commits and,
 * on this suite, samples a nondeterministic pool (#961).
 *
 *   node scripts/priority-gate.mjs           # run the P1 tests
 *   node scripts/priority-gate.mjs --list    # show what it would run
 *
 * Reads data/priority-gate.json — built by scripts/build-priority-gate.mjs — so
 * this never touches the network. A missing or stale manifest WARNS and passes:
 * blocking a commit because a cache is old would teach people to bypass the
 * hook, and a bypassed hook takes every other check down with it (#743).
 *
 * What it does NOT do, deliberately:
 *   - fail because a priority-1 issue has no test. That is real (10 of 13 today)
 *     but it is not this commit's fault, so it belongs in CI where it can be
 *     seen without blocking work: .github/workflows/issue-priority-check.yml.
 *   - run priority 2-5 tests. Those live in the 10th-commit ratchet.
 */
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const MANIFEST = 'data/priority-gate.json';
const STALE_DAYS = 7;
const listOnly = process.argv.includes('--list');

if (!existsSync(MANIFEST)) {
  console.log(`⚠️  ${MANIFEST} missing — priority gate skipped.`);
  console.log('   Build it with: node scripts/build-priority-gate.mjs');
  process.exit(0);
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const ageDays = (Date.now() - new Date(manifest.generated).getTime()) / 86_400_000;
if (ageDays > STALE_DAYS) {
  console.log(`⚠️  ${MANIFEST} is ${Math.floor(ageDays)} days old — it may miss new priority-1 issues.`);
  console.log('   Refresh: node scripts/build-priority-gate.mjs');
}

const p1 = manifest.issues['1'] || [];
const runnable = p1.filter((x) => x.test && x.test.endsWith('.spec.ts'));
const commands = p1.filter((x) => x.test && !x.test.endsWith('.spec.ts'));
const uncovered = p1.filter((x) => !x.test);

console.log(`🔴 priority-1 gate — ${p1.length} open, ${runnable.length} with a spec, ${uncovered.length} with no test`);
for (const x of uncovered) console.log(`     #${x.number} has no test — CI reports this, see issue-priority-check`);

const specs = [...new Set(runnable.map((x) => x.test.split(/\s+/)[0]))]
  .filter((f) => existsSync(f) || existsSync(join(process.cwd(), f)));
const missing = [...new Set(runnable.map((x) => x.test.split(/\s+/)[0]))].filter((f) => !specs.includes(f));
for (const f of missing) console.log(`     ⚠️  named test not on disk: ${f}`);

if (listOnly) {
  console.log('\nwould run:');
  for (const s of specs) console.log('   ' + s);
  for (const c of commands) console.log('   ' + c.test + '   (#' + c.number + ')');
  process.exit(0);
}

if (!specs.length) {
  console.log('   nothing runnable — passing.');
  process.exit(0);
}

const cli = join('node_modules', '@playwright', 'test', 'cli.js');
if (!existsSync(cli)) {
  console.log('   Playwright not installed — priority gate skipped.');
  process.exit(0);
}

const res = spawnSync(process.execPath, [cli, 'test', ...specs, '--reporter=line'], {
  encoding: 'utf8',
  stdio: 'inherit',
  env: { ...process.env, WB_TEST_PORT: process.env.WB_TEST_PORT || '3399' },
});

if (res.status !== 0) {
  console.log('\n❌ A priority-1 test failed. These are the defects rated as');
  console.log('   "destroys work, blinds the gates, or blocks everyone" — fix before committing.');
  process.exit(1);
}
console.log('✅ priority-1 tests pass.');
