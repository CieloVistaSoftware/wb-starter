#!/usr/bin/env node
/**
 * The real state of every issue, derived from evidence, written onto the issue.
 * =============================================================================
 * John, 2026-09-05: "state must be way more granular — we have to know what real
 * state the issue is in at any time."
 *
 * Nothing here is asserted by a human. Every state is computed from four sources
 * that already exist, so the answer cannot drift from reality:
 *
 *   the issue body      Signature block: kind/subject/observed/expected/test/fix
 *   data/test-results/  per-spec status from the last recorded run
 *   git                 which commits cite the issue, and whether they are pushed
 *   git status/diff     whether uncommitted work in this tree cites it
 *
 * THE STATES, in lifecycle order. The first one that matches wins, checked from
 * the bottom up (most advanced first), so a closed issue is never reported as
 * "triaged" because it also happens to lack a test.
 *
 *   no-signature       no Signature block — nothing can be said about it yet
 *   triaged            diagnosed, but no test named and no work anywhere
 *   needs-test         work exists (tree or commit) and NO runnable test names it
 *                      -- "all of the fixes should have also had a test for that
 *                      fix"; this is the state that should never persist
 *   test-missing       a test is named but the spec is not on disk
 *   unproven           test named and present, but it did not run last time
 *   failing            its test ran and FAILED — the work is not done
 *   ready              test passed, fix is in this tree, uncommitted
 *                      -> a possible committable entity
 *   stale              test passed, but files it touches changed AFTER that run
 *                      -- the green is about older code
 *   committed          a commit cites it, not yet pushed
 *   pushed             that commit is on the remote
 *   regressed          issue is CLOSED but its test is failing again
 *   closed-unverified  closed without a test or without a fix line
 *   closed-verified    closed with both, and its test passing
 *
 *   node scripts/issue-state.mjs                 # report
 *   node scripts/issue-state.mjs --apply         # write state: label + line
 *   node scripts/issue-state.mjs --only 1020
 *   node scripts/issue-state.mjs --state ready   # list one state
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, writeFileSync, statSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
};
const ONLY = arg('--only') ? Number(arg('--only')) : null;
const FILTER = arg('--state');

const gh = (a) => execFileSync('gh', a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const git = (a) => {
  try { return execFileSync('git', a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); }
  catch { return ''; }
};

export const STATES = [
  'no-signature', 'triaged', 'needs-test', 'test-missing', 'unproven', 'failing',
  'ready', 'stale', 'committed', 'pushed', 'regressed', 'closed-unverified', 'closed-verified',
];

// ── evidence 1: the last recorded run, per spec ──────────────────────────────
const specStatus = new Map();
let ranAt = null;
for (const project of ['compliance', 'regression', 'behaviors', 'base', 'integration']) {
  const f = `data/test-results/${project}.json`;
  if (!existsSync(f)) continue;
  const j = JSON.parse(readFileSync(f, 'utf8'));
  for (const t of j.tests || []) {
    const key = String(t.file).split('\\').join('/');
    const rec = specStatus.get(key) || { passed: 0, failed: 0 };
    if (t.status === 'passed') rec.passed += 1;
    else if (t.status === 'failed' || t.status === 'timedOut') rec.failed += 1;
    specStatus.set(key, rec);
  }
  if (j.timestamp) ranAt = j.timestamp;
}
const runMs = ranAt ? new Date(ranAt).getTime() : 0;
const statusOf = (spec) => specStatus.get(spec.replace(/^tests\//, '')) || specStatus.get(spec) || null;

/**
 * Files that TALK about issues rather than fix them (#1041).
 *
 * A citation is evidence of pending work only when it sits in something that
 * could carry a fix. A handoff doc, a What's New entry, a standards document,
 * or the issue tooling's own source cite issue numbers as prose — and any such
 * citation set `files`, which suppresses `committed`/`pushed` entirely and made
 * a shipped fix report as un-started.
 *
 * The sharpest case: this file's own rationale comments name #1003, #1020 and
 * #1023 as worked examples, so the engine reported the wrong state for those
 * three BECAUSE OF THE SENTENCES IN ITSELF EXPLAINING THEM.
 */
function isNarrative(file) {
  const f = file.replace(/\\/g, '/');
  return f.startsWith('docs/_today/')          // handoff logs cite everything
    || f.startsWith('data/')                   // generated reports cite everything
    || f.startsWith('docs/standards/')         // standards quote issues as examples
    || f === 'pages/whats-new.html'            // release notes cite what shipped
    || /^CHANGELOG/i.test(f)
    || /^scripts\/(issue-|commit-|check-issue|apply-issue|mark-issue|priority-gate|signature-field|build-priority)/.test(f);
}

// ── evidence 2: uncommitted work, and which issues it cites ──────────────────
const treeCites = new Map();            // issue -> Set(file)
{
  // Untracked files have no diff, so a `git diff` scan cannot see them — and the
  // NEW SPEC that proves a fix is almost always untracked. Measured: #1020 and
  // #1023 both had their proving test invisible to this scan, and the files had
  // to be staged by hand. Read those files directly.
  const NL = String.fromCharCode(10);
  let untracked = '';
  for (const line of git(['status', '--porcelain']).split(NL)) {
    if (!line.startsWith('??')) continue;
    const f = line.slice(3).trim();
    if (!/\.(js|mjs|ts|css|html|md)$/.test(f)) continue;
    if (isNarrative(f)) continue;
    try {
      const lines = readFileSync(f, 'utf8').split(NL).map((l) => '+' + l).join(NL);
      untracked += `+++ b/${f}` + NL + lines + NL;
    } catch { /* vanished between status and read */ }
  }

  const diff = git(['diff', 'HEAD', '-U0']) + git(['diff', '--cached', '-U0']) + untracked;
  let file = null;
  for (const line of diff.split('\n')) {
    const f = line.match(/^\+\+\+ b\/(.+)$/);
    if (f) { file = f[1]; continue; }
    if (!line.startsWith('+') || !file) continue;
    if (isNarrative(file)) continue;  // talks about issues; is not work on them
    for (const m of line.matchAll(/#(\d{3,4})\b/g)) {
      const n = Number(m[1]);
      if (!treeCites.has(n)) treeCites.set(n, new Set());
      treeCites.get(n).add(file);
    }
  }
}

// ── evidence 3: commits citing the issue, and whether they are pushed ────────
const commitCites = new Map();          // issue -> [{sha, pushed, subject}]
{
  // #1043: this was `--remotes`, which is EVERY remote branch. A commit pushed
  // to a working branch — where most work starts — therefore reported as
  // `pushed`, i.e. delivered, while it was on nothing anyone ships from. The
  // state engine exists to say how far a fix has travelled, and "on some branch
  // on the server" is not the end of that journey; it is the middle of it.
  //
  // Reachability from the remote DEFAULT branch is the honest test. A commit
  // that is only on a feature branch now stays `committed`, which is exactly
  // what it is: written down, not shipped.
  //
  // Falls back to all remotes if the default branch cannot be resolved (a fresh
  // clone with no origin, a detached CI checkout) — over-reporting travel is
  // better than reporting none at all, and the fallback is the old behaviour.
  // WB_DEFAULT_REF exists so this rule can be TESTED without mutating the repo.
  // The contract — "a commit not on the shipping branch is not pushed" — cannot
  // be exercised against origin/main itself, because everything in this history
  // is already on it; a test would have to create a branch and a commit to see
  // the difference. Pointing the ref at an older commit produces the same shape
  // (commits that exist but are not reachable from the ref) with no side effects.
  const defaultRef = [process.env.WB_DEFAULT_REF, 'origin/main', 'origin/master']
    .filter(Boolean)
    .find((ref) => git(['rev-parse', '--verify', '--quiet', ref]).trim());
  const pushed = new Set(
    git(defaultRef
      ? ['rev-list', '--max-count=4000', defaultRef]
      : ['rev-list', '--max-count=4000', '--remotes'],
    ).split('\n').filter(Boolean),
  );
  // #1042: fields are \x1f-separated, records are \x1e-terminated.
  //
  // This used to be `%H%x1f%s%x1e%b%x1e` split on '\x1e\x1e' — a doubled
  // separator that only ever appears when a commit body is EMPTY. Any commit
  // WITH a body did not produce that boundary, so it was glued to its
  // neighbours, and `const [head, body] = entry.split('\x1e')` then kept the
  // first commit of the run and silently discarded every other one.
  //
  // Measured on this repo: 1,056 commits in range, 119 recovered, 937 DROPPED.
  // 89% of the history was invisible to the state engine, so an issue that had
  // been fixed, committed and pushed still reported as never started — the
  // reason the queue kept saying no progress had happened.
  const log = git(['log', '--max-count=1500', '--format=%H%x1f%s%x1f%b%x1e']);
  for (const entry of log.split('\x1e')) {
    if (!entry.trim()) continue;
    const [sha, subject = '', body = ''] = entry.replace(/^\s+/, '').split('\x1f');
    if (!/^[0-9a-f]{40}$/.test(sha)) continue;
    for (const m of `${subject}\n${body}`.matchAll(/#(\d{3,4})\b/g)) {
      const n = Number(m[1]);
      if (!commitCites.has(n)) commitCites.set(n, []);
      if (!commitCites.get(n).some((c) => c.sha === sha)) {
        commitCites.get(n).push({ sha: sha.slice(0, 8), pushed: pushed.has(sha), subject: subject.slice(0, 60) });
      }
    }
  }
}

// ── the signature fields ─────────────────────────────────────────────────────
const field = (body, name) => {
  const m = (body || '').match(new RegExp('^' + name + ':[^\\S\\n]*(\\S.*?)[^\\S\\n]*$', 'm'));
  if (!m) return '';
  const v = m[1].replace(/^["']|["']$/g, '').trim();
  return v === 'null' ? '' : v;
};

/** Newest mtime among the tree files citing this issue, for staleness. */
function newestTouch(files) {
  let newest = 0;
  for (const f of files || []) {
    try { newest = Math.max(newest, statSync(f).mtimeMs); } catch { /* deleted */ }
  }
  return newest;
}

export function assess(issue) {
  const body = issue.body || '';
  const closed = issue.state === 'CLOSED' || issue.state === 'closed';
  const test = field(body, 'test');
  const fix = field(body, 'fix');
  const spec = /\.spec\.ts(\s|$)/.test(test) ? test.split(/\s+/)[0] : null;
  const command = /^node\s/.test(test);
  const files = treeCites.get(issue.number);
  const commits = commitCites.get(issue.number) || [];
  const st = spec ? statusOf(spec) : null;

  const detail = [];
  if (spec) detail.push(spec);
  if (st) detail.push(`${st.passed}/${st.passed + st.failed}`);
  if (files) detail.push(`${files.size} file(s) in tree`);
  if (commits.length) detail.push(`${commits.length} commit(s)${commits.some((c) => c.pushed) ? ', pushed' : ', local'}`);

  const say = (state, extra) => ({ state, detail: [extra, ...detail].filter(Boolean).join(' — ') });

  // Closed issues first: a closed issue's state is about evidence, not progress.
  if (closed) {
    if (spec && st && st.failed) return say('regressed', 'closed, but its test fails again');
    if (!test || !fix) return say('closed-unverified', `closed without ${!test ? 'a test' : 'a fix line'}`);
    return say('closed-verified', 'closed with test and fix recorded');
  }

  if (!/^##\s+Signature\s*$/m.test(body)) return say('no-signature', 'no Signature block');

  const hasWork = Boolean(files) || commits.length > 0;

  if (!test) return hasWork ? say('needs-test', 'work exists, no test names it') : say('triaged', 'diagnosed, not started');
  if (!spec && !command) {
    return hasWork ? say('needs-test', `test: is prose ("${test.slice(0, 30)}")`) : say('triaged', 'test: is prose');
  }
  if (command) return say('unproven', 'test is a command the suite does not run');
  if (!existsSync(spec)) return say('test-missing', 'named spec is not on disk');
  // #1042: TRAVEL is decided before PROOF, because travel does not depend on the
  // last test run at all. A fix that is committed and pushed is pushed whether or
  // not its spec happened to be included in the last run.
  //
  // This used to sit BELOW `if (!st) return unproven`, so an issue whose spec was
  // simply not in the last run reported `unproven` no matter how far its fix had
  // actually travelled. Almost every run is filtered — the pre-commit gate runs
  // the priority-1 specs and project-integrity only — so almost every issue read
  // `unproven` right after a commit. John, looking at three issues that were
  // committed AND pushed: "These show as ready, why are they committed and
  // pushed?" and "I must always have accurate state on all of our issues."
  //
  // A FAILING test still wins over travel: shipping it does not make it work, and
  // that is the one thing more urgent than where the code sits.
  //
  // Uncommitted work still wins over history: an issue with a commit AND edits
  // still sitting in the tree has something left to commit, and calling that
  // "committed" would hide it. #1003 read as committed while three of its files
  // were still uncommitted.
  if (!files && commits.length) {
    if (st && st.failed) return say('failing', 'its test failed');
    return commits.some((c) => c.pushed)
      ? say('pushed', commits[0].sha)
      : say('committed', commits[0].sha);
  }

  if (!st) return say('unproven', 'did not run in the last recorded run');
  if (st.failed) return say('failing', 'its test failed');

  // Passing from here down, and nothing committed — the fix is still in the tree.
  if (files) {
    if (runMs && newestTouch(files) > runMs) {
      return say('stale', 'files changed after the run that proved it');
    }
    return say('ready', 'test passing, fix in tree, uncommitted');
  }
  return say('unproven', 'test passes but nothing in this tree or history cites the issue');
}

// ── run ──────────────────────────────────────────────────────────────────────
const issues = JSON.parse(gh(['issue', 'list', '--state', 'all', '--limit', '400',
  '--json', 'number,title,labels,body,state']));

const counts = Object.fromEntries(STATES.map((s) => [s, 0]));
const rows = [];
for (const issue of issues) {
  if (ONLY && issue.number !== ONLY) continue;
  const { state, detail } = assess(issue);
  counts[state] += 1;
  rows.push({ issue, state, detail });
}

const shown = FILTER ? rows.filter((r) => r.state === FILTER) : rows;
shown.sort((a, b) => STATES.indexOf(b.state) - STATES.indexOf(a.state) || a.issue.number - b.issue.number);

for (const r of shown) {
  if (!FILTER && r.state === 'no-signature') continue;      // 135 of these; the count says it
  console.log(`#${String(r.issue.number).padEnd(5)} ${r.state.padEnd(18)} ${r.detail.slice(0, 78)}`);
}

console.log('');
for (const s of STATES) if (counts[s]) console.log(`  ${s.padEnd(19)} ${counts[s]}`);
console.log(`\nlast recorded run: ${ranAt || 'none'}`);

if (!APPLY) {
  console.log('Dry run — nothing written. Re-run with --apply.');
  process.exit(0);
}

let changed = 0;
for (const r of rows) {
  const labels = r.issue.labels.map((l) => l.name);
  const want = `state:${r.state}`;
  const stale = labels.filter((n) => n.startsWith('state:') && n !== want);
  const line = `verified: ${r.state} — ${r.detail}`;
  const already = field(r.issue.body, 'verified');
  if (already === line.replace(/^verified:\s*/, '') && labels.includes(want) && !stale.length) continue;

  const body = /^verified:/m.test(r.issue.body)
    ? r.issue.body.replace(/^verified:.*$/m, line)
    : (/^test:.*$/m.test(r.issue.body)
      ? r.issue.body.replace(/^test:.*$/m, (m) => `${m}\n${line}`)
      : r.issue.body);
  writeFileSync('.issue-body.tmp', body, 'utf8');

  const args = ['issue', 'edit', String(r.issue.number), '--add-label', want];
  if (body !== r.issue.body) args.push('--body-file', '.issue-body.tmp');
  for (const l of stale) args.push('--remove-label', l);
  try { gh(args); changed += 1; }
  catch (e) { console.log(`  #${r.issue.number} FAILED: ${String(e.message).split('\n')[0].slice(0, 80)}`); }
}
console.log(`${changed} issue(s) updated.`);
