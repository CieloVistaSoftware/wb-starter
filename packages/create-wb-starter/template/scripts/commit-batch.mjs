#!/usr/bin/env node
/**
 * Commit every READY issue as one batch.
 * =============================================================================
 * John, 2026-09-05: "we still want to batch our work due to how long our total
 * test takes."
 *
 * The full matrix runs once every ten commits and takes the better part of an
 * hour. So work should ARRIVE in batches and pay that cost once, rather than
 * ten separate commits each risking the gate. This gathers everything the state
 * machine calls `ready` — its own test ran and passed, its fix is in this tree —
 * stages exactly those files, and writes a message that names each issue with
 * the test that proves it and the fix line it recorded.
 *
 *   node scripts/commit-batch.mjs            # what it would commit
 *   node scripts/commit-batch.mjs --apply    # stage and commit
 *
 * It refuses to run when:
 *   - nothing carries state:ready (there is no batch to make)
 *   - the tree has staged changes already (it would sweep them into the batch)
 *
 * It does NOT need local test results. The state was recorded on the issue when
 * it was verified, and that record is what the batch is assembled from.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');
const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const git = (args) => { try { return run('git', args); } catch { return ''; } };

// READY IS READ FROM THE ISSUE, not re-derived here.
//
// John: "ready is indicated in the issue not in test-results." That is the point
// of writing the state onto the issue — the record survives, so this tool does
// not need the local results to exist. The first version shelled out to
// issue-state.mjs, which re-derives from data/test-results/, and collapsed the
// moment a gate run wiped them at onBegin: nothing looked committable during a
// run, which is exactly when a finished batch is most likely to be waiting.
//
// scripts/issue-state.mjs is what PUTS the state there. This reads it.
const ready = JSON.parse(run('gh', [
  'issue', 'list', '--state', 'open', '--label', 'state:ready',
  '--limit', '200', '--json', 'number,title,body',
]));

if (!ready.length) {
  console.log('Nothing is ready. `node scripts/issue-state.mjs` shows what each issue is waiting on.');
  process.exit(1);
}
if (git(['diff', '--cached', '--name-only']).trim()) {
  console.log('Something is already staged — commit or reset it first, or this batch would sweep it in.');
  process.exit(1);
}

// Which files belong to which ready issue. Same citation rule the state machine
// uses, including untracked files (the proving spec is usually untracked).
const NL = String.fromCharCode(10);
let corpus = git(['diff', 'HEAD', '-U0']);
for (const line of git(['status', '--porcelain']).split(NL)) {
  if (!line.startsWith('??')) continue;
  const f = line.slice(3).trim();
  if (!/\.(js|mjs|ts|css|html|md)$/.test(f)) continue;
  if (f.startsWith('docs/_today/') || f.startsWith('data/')) continue;
  try {
    corpus += `+++ b/${f}` + NL + readFileSync(f, 'utf8').split(NL).map((l) => '+' + l).join(NL) + NL;
  } catch { /* gone */ }
}

const wanted = new Set(ready.map((r) => r.number));
const byIssue = new Map();
{
  let file = null;
  for (const line of corpus.split(NL)) {
    const f = line.match(/^\+\+\+ b\/(.+)$/);
    if (f) { file = f[1]; continue; }
    if (!line.startsWith('+') || !file) continue;
    if (file.startsWith('docs/_today/') || file.startsWith('data/')) continue;
    for (const m of line.matchAll(/#(\d{3,4})\b/g)) {
      const n = Number(m[1]);
      if (!wanted.has(n)) continue;
      if (!byIssue.has(n)) byIssue.set(n, new Set());
      byIssue.get(n).add(file);
    }
  }
}

const files = [...new Set([...byIssue.values()].flatMap((s) => [...s]))].sort();

// The issue's own words for the message: title, the test that proves it, the
// fix line it recorded. Read from GitHub so the commit and the issue agree.
// Straight from the payload already fetched — no second call per issue, and no
// chance of the message disagreeing with the issue it cites.
const meta = new Map();
for (const r of ready) {
  const field = (name) => {
    const m = (r.body || '').match(new RegExp('^' + name + ':[^\\S\\n]*(\\S.*?)[^\\S\\n]*$', 'm'));
    return m ? m[1].replace(/^["']|["']$/g, '').trim() : '';
  };
  meta.set(r.number, {
    title: r.title,
    test: field('test'),
    fix: field('fix'),
    verified: field('verified'),      // what the issue itself says proved it
  });
}

const numbers = ready.map((r) => r.number).sort((a, b) => a - b);
const subject = `fix(${numbers.map((n) => '#' + n).join(',')}): batch of ${numbers.length} verified fixes`;

const body = [
  '',
  'Every issue here is in state `ready`: its own test ran and passed in the last',
  'recorded run, and its fix is in this tree. Batched into one commit because the',
  'full matrix runs once every ten commits and takes the better part of an hour —',
  'so the work arrives together and pays that cost once.',
  '',
];
for (const n of numbers) {
  const m = meta.get(n);
  body.push(`  #${n}  ${m.title}`);
  if (m.fix) body.push(`        fix:  ${m.fix}`);
  if (m.test) body.push(`        test: ${m.test}`);
  if (m.verified) body.push(`        state: ${m.verified}`);
  body.push('');
}
body.push('Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>');

console.log(subject);
console.log(body.join(NL));
console.log(`${files.length} file(s):`);
for (const f of files) console.log('  ' + f);

if (!APPLY) {
  console.log('');
  console.log('Dry run. Re-run with --apply to stage and commit.');
  process.exit(0);
}

run('git', ['add', ...files]);
writeFileSync('.commit-batch.tmp', subject + NL + body.join(NL) + NL, 'utf8');
try {
  console.log(run('git', ['commit', '-F', '.commit-batch.tmp']));
} catch (e) {
  console.log(String(e.stdout || '') + String(e.stderr || ''));
  console.log('\nThe commit was rejected — the staged files are left staged so nothing is lost.');
  process.exit(1);
}
