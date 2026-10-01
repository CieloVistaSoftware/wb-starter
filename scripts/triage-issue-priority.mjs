#!/usr/bin/env node
/**
 * FIND THE ISSUES THE PRIORITY CHECK IS COMPLAINING ABOUT, AND RATE THEM
 * =====================================================================
 * `.github/workflows/issue-priority-check.yml` posts a comment when an issue
 * carries no `priority:1-5` label, and that comment IS the signal — an `issues`
 * event produces no check run on the issue itself, so nothing else shows it.
 * A comment at the bottom of an issue is also the thing nobody scrolls to: on
 * 2026-09-07 eight open issues had been sitting on that complaint unanswered.
 *
 * WHERE THE RUBRIC COMES FROM
 * ---------------------------
 * Parsed out of the workflow, not restated here. It already exists twice in
 * that file (a comment block and the markdown table it posts) and in no .md at
 * all; a third copy in this script would be the thing that drifts. If the
 * workflow's table changes, this follows it.
 *
 * HOW WELL IT ACTUALLY WORKS — measured, not assumed
 * --------------------------------------------------
 * `--audit` scores issues that already carry a human rating and compares.
 * Against 190 rated issues on 2026-09-07:
 *
 *     first version, broad keywords :  60 agree,  88 differ, 42 no opinion
 *     this version, narrow rules    :  11 agree,   4 differ, 175 no opinion
 *
 * So it is right about 3 times in 4 WHEN IT SPEAKS, and says nothing about 92%
 * of the backlog. That is the intended shape: severity is a judgement about
 * impact, and impact is mostly not stated in words a regex can find. The four
 * it still gets wrong all match a phrase inside a QUOTATION or a reference to
 * another issue rather than the issue's own claim — a context problem, not a
 * vocabulary one.
 *
 * Treat every proposal as a suggestion to check. `--apply` exists, and given
 * one in four is wrong, reading the evidence line before trusting it is the
 * whole job.
 *
 * WHAT IT WILL NOT DO
 * -------------------
 * Assign `priority:1` on its own. The workflow requires a priority:1 to name a
 * runnable `test:` in its Signature block ("a defect rated 'destroys work or
 * blocks everyone' that nothing can prove fixed is not actionable"), and
 * deciding something blocks everyone is a judgement, not a keyword match. Those
 * are proposed and left for a person.
 *
 *   node scripts/triage-issue-priority.mjs              # propose, change nothing
 *   node scripts/triage-issue-priority.mjs --apply      # set the labels
 *   node scripts/triage-issue-priority.mjs --only 1047
 *   node scripts/triage-issue-priority.mjs --suggest issue.json   # one issue, no gh
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRubric, propose, hasRunnableTest } from './lib/priority-triage.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

const MARKER = '<!-- priority-check -->';

function gh(a) {
  return JSON.parse(execFileSync('gh', a, { cwd: root, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 }));
}

const rubric = loadRubric();

// --suggest FILE: one issue (JSON with title and body, as `gh issue view
// --json title,body` writes it) in, one markdown line out -- or nothing when no
// rule matches. Used by issue-priority-check.yml to put the proposal in its
// comment. Never labels anything: one proposal in four is wrong (see header).
if (args.includes('--suggest')) {
  const issue = JSON.parse(readFileSync(args[args.indexOf('--suggest') + 1], 'utf8'));
  const p = propose(issue);
  if (p) {
    const testNote = p.level === 1 && !hasRunnableTest(issue.body)
      ? ' A `priority:1` also needs a runnable `test:` in the Signature block.'
      : '';
    console.log(`**Suggested: \`priority:${p.level}\`** (${rubric.get(p.level)}), because it says: "${p.why.replace(/"/g, "'")}". ` +
      `This is a keyword match and is wrong about one time in four, so check it before you apply it.${testNote}`);
  }
  process.exit(0);
}
const issues = ONLY
  ? [gh(['issue', 'view', ONLY, '--json', 'number,title,body,labels,comments'])]
  : gh(['issue', 'list', '--state', 'open', '--limit', '400', '--json', 'number,title,body,labels,comments']);

// --audit: score issues that ALREADY carry a rating and compare. A triage tool
// that runs on an empty backlog reports success while demonstrating nothing —
// this is the only way to see whether its reading matches a person's.
if (args.includes('--audit')) {
  let agree = 0, differ = 0, silent = 0;
  for (const issue of issues) {
    const has = (issue.labels || []).filter((l) => /^priority:[1-5]$/.test(l.name));
    if (has.length !== 1) continue;
    const actual = Number(has[0].name.split(':')[1]);
    const p = propose(issue);
    if (!p) { silent++; console.log(`  ?  #${issue.number} rated ${actual}, script has no opinion — ${issue.title.slice(0, 54)}`); continue; }
    if (p.level === actual) { agree++; continue; }
    differ++;
    console.log(`  ✗  #${issue.number} human ${actual} vs script ${p.level} — ${issue.title.slice(0, 54)}`);
    console.log(`       evidence: "${p.why.slice(0, 100)}"`);
  }
  console.log(`\naudit: ${agree} agree, ${differ} differ, ${silent} no opinion`);
  process.exit(0);
}

let flagged = 0, proposed = 0, applied = 0, needsHuman = 0;

for (const issue of issues) {
  const priorities = (issue.labels || []).filter((l) => /^priority:[1-5]$/.test(l.name));
  if (priorities.length === 1) continue;

  const complained = (issue.comments || []).some((c) => (c.body || '').includes(MARKER));
  flagged++;

  const p = propose(issue);
  const head = `#${issue.number}  ${issue.title.slice(0, 68)}`;
  const tag = complained ? '' : '  (no bot comment yet)';

  if (!p) {
    needsHuman++;
    console.log(`${head}${tag}\n    NO PROPOSAL — nothing in it matches the rubric; rate by hand.`);
    continue;
  }

  if (priorities.length > 1) {
    console.log(`${head}${tag}\n    HAS ${priorities.length} priority labels (${priorities.map((l) => l.name).join(', ')}) — remove all but one by hand.`);
    needsHuman++;
    continue;
  }

  if (p.level === 1 && !hasRunnableTest(issue.body)) {
    needsHuman++;
    console.log(`${head}${tag}\n    reads as priority:1 (${rubric.get(1)})\n    but its Signature names no runnable test:, which the workflow requires. Left for a person.\n    evidence: "${p.why}"`);
    continue;
  }

  proposed++;
  console.log(`${head}${tag}\n    -> priority:${p.level}  (${rubric.get(p.level)})\n    evidence: "${p.why}"`);

  if (APPLY) {
    if (p.level === 1) continue; // never auto-applied; see the header
    try {
      execFileSync('gh', ['issue', 'edit', String(issue.number), '--add-label', `priority:${p.level}`], { cwd: root, encoding: 'utf8' });
      applied++;
    } catch (e) {
      console.log(`    FAILED to label: ${e.message}`);
    }
  }
}

console.log(`\nunrated open issues: ${flagged}`);
console.log(`  proposed: ${proposed}${APPLY ? `, applied: ${applied}` : ' (dry run — pass --apply to set them)'}`);
console.log(`  need a person: ${needsHuman}`);
