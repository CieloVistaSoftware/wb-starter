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
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

const MARKER = '<!-- priority-check -->';

function gh(a) {
  return JSON.parse(execFileSync('gh', a, { cwd: root, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 }));
}

/** The five levels, read from the workflow's own posted table. */
function loadRubric() {
  const wf = readFileSync(path.join(root, '.github/workflows/issue-priority-check.yml'), 'utf8');
  const levels = new Map();
  for (const m of wf.matchAll(/\|\s*\\?`priority:([1-5])\\?`\s*\|\s*([^|]+?)\s*\|/g)) {
    levels.set(Number(m[1]), m[2].trim());
  }
  if (levels.size !== 5) {
    throw new Error(`rubric: parsed ${levels.size} levels from the workflow, expected 5 — the table shape changed`);
  }
  return levels;
}

/**
 * Signals per level, in the rubric's own terms. Ordered most severe first; the
 * first level whose evidence appears wins, so a "blinds the gate" phrase beats
 * a "cosmetic" one in the same issue.
 *
 * Deliberately conservative: anything with no match at all is left unrated
 * rather than defaulted, because a wrong rating is worse than an absent one —
 * the whole point of the field is that someone decided.
 */
// PRECISION, NOT COVERAGE.
//
// The first version scored on broad keywords and was audited against 190
// already-rated issues: 60 agreed, 88 DISAGREED, 42 no opinion. Roughly a third
// right, and `--apply` would have mislabelled most of the backlog. The failure
// was systematic rather than unlucky — "docs", "stale" and "generated" match
// nearly any documentation issue and dragged a human's 4 down to a 3, while
// #341 ("CI red on every run for weeks", i.e. blocks everyone, rated 1) matched
// "flaky" and came out 3.
//
// Severity is a judgement about IMPACT, and impact is mostly not stated in
// words a regex can find. So this keeps only rules that were right in the audit
// and says nothing otherwise. A tool that rates 20 issues correctly and stays
// silent on 170 is useful; one that rates all 190 at 31% accuracy is worse than
// the empty field it fills.
//
// Anything with no match is reported as needing a person. That is the honest
// default and it is deliberately the common case — re-run `--audit` after
// changing anything here.
const SIGNALS = [
  [1, [
    // Destroys work, or the gates stop reporting. Both phrased distinctively.
    /\boverwrit\w+\b[^.]{0,60}\bwith (?:76 bytes|nothing|an empty)/i,
    /\bred on every run\b|\bblocks every commit\b|\bblocks everyone\b/i,
    /\bdisables the (?:check|gate)s?\b|\bmatches nothing at all\b/i,
  ]],
  [2, [
    // Something a user meets, in the place users meet it.
    /\bdeployed site\b|\bevery visitor\b|\bon the deployed\b/i,
    /\bnever (?:applies|applied) on any\b/i,
  ]],
  [5, [
    // The repo's own conventions for a non-defect, and unambiguous.
    /^Q:\s/,
    /^Index:\s/,
  ]],
];

function propose(issue) {
  const text = `${issue.title}\n${issue.body || ''}`;
  for (const [level, patterns] of SIGNALS) {
    for (const re of patterns) {
      const m = text.match(re);
      if (m) {
        const at = text.indexOf(m[0]);
        return { level, why: text.slice(Math.max(0, at - 50), at + 70).replace(/\s+/g, ' ').trim() };
      }
    }
  }
  return null;
}

const hasRunnableTest = (body) => /^\s*test:\s*\S/m.test(body || '');

const rubric = loadRubric();
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
