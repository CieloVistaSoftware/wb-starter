/**
 * The priority triage rules, shared by scripts/triage-issue-priority.mjs (the
 * backlog tool) and .github/workflows/issue-priority-check.yml (which shows the
 * proposal in its comment on a new unrated issue).
 *
 * The rules, and the audit that shaped them, are explained in
 * scripts/triage-issue-priority.mjs. Pure functions; no gh, no network.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The five levels, read from the workflow's own posted table. */
export function loadRubric(wf = readFileSync(path.join(root, '.github/workflows/issue-priority-check.yml'), 'utf8')) {
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
export const SIGNALS = [
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

export function propose(issue) {
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

export const hasRunnableTest = (body) => /^\s*test:\s*\S/m.test(body || '');
