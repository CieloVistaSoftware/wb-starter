#!/usr/bin/env node
/*
 * scripts/validate-and-mark-fixed.mjs
 * - For each issue in data/issues-todo.json that is not fixed and has a test file,
 *   run its test (Playwright, compliance project).
 * - If the test passes, mark the issue fixed using existing script `mark-issue-fixed.mjs`.
 * - Respect Lock/ (abort if locked) and produce a summary JSON for the PR body.
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const lockPath = path.join(root, 'Lock', 'LOCKED-issues-todo.json.md');
if (fs.existsSync(lockPath) === false) {
  console.error('[validate-and-mark-fixed] Aborting: lock not found at', lockPath);
  console.error('Create the lock before running this script to comply with repo protocol.');
  process.exit(2);
}

const dataPath = path.join(root, 'data', 'issues-todo.json');
if (!fs.existsSync(dataPath)) {
  console.error('[validate-and-mark-fixed] issues data not found at', dataPath);
  process.exit(3);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const issues = data.issues || [];

function sanitizeId(id){
  return id.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
}

const results = [];
for (const it of issues){
  if (it.fixed === true) {
    results.push({id: it.id, status: 'skipped-already-fixed'});
    continue;
  }
  const testFile = path.join(root, 'tests', 'issues', `issue-${sanitizeId(it.id)}.spec.ts`);
  if (!fs.existsSync(testFile)){
    results.push({id: it.id, status: 'no-test'});
    continue;
  }

  // Use POSIX-style path for Playwright CLI (Windows path.sep can break the runner when passed as an arg)
  const rel = path.relative(root, testFile).split(path.sep).join(path.posix.sep);
  console.log(`[validate-and-mark-fixed] Running test for ${it.id} -> ${rel}`);
  // Issue tests live under `tests/issues/` so run them without forcing a project
  const pwArgs = rel.startsWith('tests/issues/')
    ? ['playwright', 'test', rel, '--reporter=list']
    : ['playwright', 'test', rel, '--project=compliance', '--reporter=list'];
  const run = spawnSync('npx', pwArgs, { stdio: 'inherit', shell: true });
  if (run.status !== 0){
    console.log(`[validate-and-mark-fixed] TEST FAILED: ${it.id}`);
    results.push({id: it.id, status: 'test-failed'});
    continue;
  }

  // test passed -> mark fixed via existing helper script (explicitly allow unvalidated marking since we just validated)
  console.log(`[validate-and-mark-fixed] TEST PASSED: marking ${it.id} fixed`);
  const mark = spawnSync('node', ['scripts/mark-issue-fixed.mjs', it.id, '--allow-unvalidated'], { encoding: 'utf8', shell: true });
  if (mark.status !== 0){
    console.error('[validate-and-mark-fixed] Failed to mark issue fixed:', it.id, mark.stdout || mark.stderr);
    results.push({id: it.id, status: 'mark-failed', detail: mark.stdout || mark.stderr});
    continue;
  }
  results.push({id: it.id, status: 'marked-fixed'});
}

// sync MD table
spawnSync('node', ['scripts/sync-issue-fixed-field.mjs'], { stdio: 'inherit', shell: true });

// write summary
const summaryPath = path.join(root, 'tmp', `validate-and-mark-fixed-summary-${Date.now()}.json`);
fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
fs.writeFileSync(summaryPath, JSON.stringify({runAt: new Date().toISOString(), results}, null, 2), 'utf8');

console.log('\nSummary saved to', summaryPath);
console.table(results.map(r => ({id: r.id, status: r.status})));

// exit code: 0 if at least one was marked, 2 if none marked, 1 on error
if (results.some(r => r.status === 'marked-fixed')) process.exit(0);
if (results.every(r => r.status === 'skipped-already-fixed' || r.status === 'no-test' || r.status === 'test-failed')) process.exit(2);
process.exit(1);
