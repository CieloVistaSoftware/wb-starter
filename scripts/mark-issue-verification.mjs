#!/usr/bin/env node
/**
 * Write each issue's verification state INTO the issue.
 * =============================================================================
 * John, 2026-09-05:
 *   "the field should be in the issue itself"
 *   "if the tests for that issue pass then it is a possible committable entity"
 *   "all of the fixes should have also had a test for that fix"
 *   "if that test for the fix passed it is a preliminary pass"
 *
 * So the Signature block gains one machine-maintained line, and the issue gains
 * one label. Both say the same thing, because the line is readable where the
 * evidence is and the label is filterable in the issues table.
 *
 *   verified: ready — regression/foo.spec.ts, 5/5 on 2026-09-06T04:07Z
 *
 * The four states, and what each one licenses:
 *
 *   ready              its named test ran and passed. A possible committable
 *                      entity — still preliminary in the sense that one green
 *                      spec is not the suite, and the run it cites can go
 *                      stale, which is why the line carries the date.
 *   failing            its named test ran and failed. The work is not done.
 *   unproven           the test is named but did not run in the last recorded
 *                      run. Absence from a failure list is not a pass.
 *   no-test            no runnable test named. A fix without one is a change,
 *                      not a fix — this is the state that should never persist.
 *
 *   node scripts/mark-issue-verification.mjs           # report, write nothing
 *   node scripts/mark-issue-verification.mjs --apply   # update issues + labels
 *   node scripts/mark-issue-verification.mjs --apply --only 1020
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, writeFileSync, statSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');
const onlyIdx = process.argv.indexOf('--only');
const ONLY = onlyIdx >= 0 ? Number(process.argv[onlyIdx + 1]) : null;

const gh = (args) => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const STATES = ['ready', 'failing', 'unproven', 'no-test'];
const LABEL = (s) => `state:${s}`;

// ── the last recorded run, per spec ─────────────────────────────────────────
const specStatus = new Map();
let ranAt = null;
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
  if (j.timestamp) ranAt = j.timestamp;
}
if (!ranAt && existsSync('data/test-results/summary.json')) {
  ranAt = JSON.parse(readFileSync('data/test-results/summary.json', 'utf8')).timestamp;
}

const statusOf = (spec) => specStatus.get(spec.replace(/^tests\//, '')) || specStatus.get(spec) || null;

const field = (body, name) => {
  const m = (body || '').match(new RegExp('^' + name + ':[^\\S\\n]*(\\S.*?)[^\\S\\n]*$', 'm'));
  if (!m) return '';
  const v = m[1].replace(/^["']|["']$/g, '').trim();
  return v === 'null' ? '' : v;
};

function assess(body) {
  const test = field(body, 'test');
  const spec = /\.spec\.ts(\s|$)/.test(test) ? test.split(/\s+/)[0] : null;
  const command = /^node\s/.test(test);

  if (!test) return { state: 'no-test', detail: 'no test named in the Signature block' };
  if (!spec && !command) return { state: 'no-test', detail: `test: is prose, not runnable ("${test.slice(0, 40)}")` };
  if (command) return { state: 'unproven', detail: `${test.split(/\s+/).slice(0, 2).join(' ')} — a command, not run by the suite` };
  if (!existsSync(spec)) return { state: 'no-test', detail: `named test not on disk (${spec})` };

  const st = statusOf(spec);
  if (!st) return { state: 'unproven', detail: `${spec} did not run in the last recorded run` };
  if (st.failed) return { state: 'failing', detail: `${spec}, ${st.failed} failed of ${st.passed + st.failed}` };
  return { state: 'ready', detail: `${spec}, ${st.passed}/${st.passed} on ${ranAt || 'an unrecorded run'}` };
}

/** Insert or replace the `verified:` line inside the Signature block's yaml. */
function withVerified(body, line) {
  if (/^verified:/m.test(body)) {
    return body.replace(/^verified:.*$/m, line);
  }
  // After `test:` if present, else at the end of the yaml fence.
  if (/^test:.*$/m.test(body)) {
    return body.replace(/^test:.*$/m, (m) => `${m}\n${line}`);
  }
  return body.replace(/^```\s*$/m, `${line}\n\`\`\``);
}

const issues = JSON.parse(gh([
  'issue', 'list', '--state', 'open', '--limit', '400', '--json', 'number,title,labels,body',
]));

const counts = Object.fromEntries(STATES.map((s) => [s, 0]));
let changed = 0;

for (const issue of issues) {
  if (ONLY && issue.number !== ONLY) continue;
  if (!/^##\s+Signature\s*$/m.test(issue.body || '')) continue;   // nothing to write into

  const { state, detail } = assess(issue.body);
  counts[state] += 1;

  const line = `verified: ${state} — ${detail}`;
  const already = field(issue.body, 'verified');
  const wanted = line.replace(/^verified:\s*/, '');
  const labels = issue.labels.map((l) => l.name);
  const hasLabel = labels.includes(LABEL(state));
  const staleLabels = labels.filter((n) => n.startsWith('state:') && n !== LABEL(state));

  if (already === wanted && hasLabel && !staleLabels.length) continue;
  changed += 1;

  console.log(`#${issue.number}  ${state.padEnd(17)} ${detail.slice(0, 74)}`);
  if (!APPLY) continue;

  const next = withVerified(issue.body, line);
  writeFileSync('.issue-body.tmp', next, 'utf8');
  const args = ['issue', 'edit', String(issue.number), '--body-file', '.issue-body.tmp', '--add-label', LABEL(state)];
  for (const l of staleLabels) args.push('--remove-label', l);
  try {
    gh(args);
  } catch (e) {
    console.log(`   FAILED: ${String(e.message).split('\n')[0].slice(0, 90)}`);
  }
}

console.log('');
for (const s of STATES) console.log(`  ${s.padEnd(18)} ${counts[s]}`);
console.log(`\n${changed} issue(s) ${APPLY ? 'updated' : 'would change'} — last run ${ranAt || 'unknown'}`);
if (!APPLY) console.log('Dry run. Re-run with --apply to write into the issues.');
