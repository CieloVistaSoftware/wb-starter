#!/usr/bin/env node
/*
  scripts/auto-pr.mjs
  - Run focused tests, create branch, commit staged changes, push, and open a PR using `gh`.
  - Respects repository lock files in Lock/ and will abort if conflicting locks are present.

  Usage:
    node ./scripts/auto-pr.mjs --branch "fix/…" --title "fix(...) : ..." --body-file ./pr-body.md --test "tests/path.spec.ts"
*/
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: true, ...opts });
  return r.status;
}

function readArgs() {
  const args = process.argv.slice(2);
  const out = {};
  args.forEach(a => {
    if (a.startsWith('--')) {
      const [k, v='true'] = a.split('=');
      out[k.replace(/^--/, '')] = v;
    }
  });
  return out;
}

const argv = readArgs();
const branch = argv.branch || `chore/auto/${Date.now()}`;
const title = argv.title || `chore: automated changes ${new Date().toISOString().slice(0,10)}`;
const test = argv.test || 'npm run test:integrity';
const bodyFile = argv['body-file'];
const body = bodyFile ? fs.readFileSync(bodyFile, 'utf8') : (argv.body || `Automated PR created by auto-pr`);

// 1) Check for locks
const lockDir = path.resolve(process.cwd(), 'Lock');
if (fs.existsSync(lockDir)) {
  const locks = fs.readdirSync(lockDir).filter(f => f.startsWith('LOCKED-'));
  if (locks.length) {
    console.error('Repository contains lock files. Aborting to avoid conflicting edits:');
    locks.forEach(l => console.error(`  - ${l}`));
    process.exit(2);
  }
}

// 2) Run the validation test(s)
console.log('\n[auto-pr] Running validation test: ', test);
const testStatus = run(test.split(' ')[0], test.split(' ').slice(1));
if (testStatus !== 0) {
  console.error('\n[auto-pr] Validation tests failed — aborting PR creation.');
  process.exit(testStatus || 1);
}

// 3) Create branch
if (run('git', ['checkout', '-b', branch]) !== 0) process.exit(1);

// 4) Stage changes (only tracked changes by default)
if (run('git', ['add', '-A']) !== 0) process.exit(1);

// 5) Commit
const commitMsg = argv['commit-msg'] || `${title}\n\nAutomated by scripts/auto-pr.mjs`;
if (run('git', ['commit', '-m', commitMsg]) !== 0) {
  console.log('[auto-pr] Nothing to commit (no changes). Exiting.');
  process.exit(0);
}

// 6) Push
if (run('git', ['push', '--set-upstream', 'origin', branch]) !== 0) process.exit(1);

// 7) Create PR via gh
console.log('\n[auto-pr] Creating PR on GitHub...');
const ghArgs = ['pr', 'create', '--title', JSON.stringify(title), '--body', JSON.stringify(body)];
const ghStatus = run('gh', ghArgs);
if (ghStatus !== 0) {
  console.error('[auto-pr] gh CLI failed to create PR.');
  process.exit(ghStatus);
}

console.log('\n[auto-pr] PR created successfully — branch:', branch);
process.exit(0);
