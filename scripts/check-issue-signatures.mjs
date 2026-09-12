#!/usr/bin/env node
/**
 * Issue signature-block validator.
 *
 * Every issue carries a Signature block — the machine-readable half of what the
 * prose already says. See docs/standards/ISSUE-SIGNATURE-BLOCK.md.
 *
 * This exists because "the signature is in the text" is true and useless: an
 * extractor built on error-string patterns scored the issue set at 51% and
 * reported #1005 as evidence-free, when #1005 states its signature four times.
 * A fixed shape is the difference between information being present and being
 * readable.
 *
 *   node scripts/check-issue-signatures.mjs            # open issues missing a block
 *   node scripts/check-issue-signatures.mjs --closed   # closed issues missing test/fix
 *   node scripts/check-issue-signatures.mjs --since 2026-09-01
 *   node scripts/check-issue-signatures.mjs --number 1031   # exactly one issue
 *   node scripts/check-issue-signatures.mjs --json
 *   node scripts/check-issue-signatures.mjs --kinds     # repo-wide: kind only
 *
 * Exit 1 when anything is missing, so it can gate.
 *
 * `--number` is what CI uses (.github/workflows/issue-signature-check.yml): the
 * check fires when an issue is opened or edited and looks at THAT issue alone.
 * Scoping is the point — a repo-wide run would fail every new issue over the 135
 * already in the backlog, which is how a gate becomes something people route
 * around rather than satisfy.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { SCHEMA, parseSignature, kindProblem } from './lib/signature-schema.mjs';

const args = process.argv.slice(2);
const wantClosed = args.includes('--closed');
const asJson = args.includes('--json');
const sinceIdx = args.indexOf('--since');
const since = sinceIdx >= 0 ? args[sinceIdx + 1] : null;
// `--kinds` sweeps the WHOLE open backlog against one rule: every issue has a
// Signature block and its kind is one of the six. See kindProblem() for why that
// single field is the only part of the standard that can be gated repo-wide.
const kindsOnly = args.includes('--kinds');
const numberIdx = args.indexOf('--number');
const only = numberIdx >= 0 ? args[numberIdx + 1] : null;

// The field list, the kinds and the never-a-field list all come from the tables
// in docs/standards/ISSUE-SIGNATURE-BLOCK.md. They used to be hardcoded here as
// well, which made this file a second definition of a standard it is supposed to
// merely enforce -- and the doc, the copy people read, had no authority over it.
const { requiredAtFiling: REQUIRED_AT_FILING, requiredOnClose: REQUIRED_ON_CLOSE,
        requiredWith: REQUIRED_WITH, kinds: KINDS, banned: BANNED,
        reasonFor: BANNED_BECAUSE } = SCHEMA;

function gh(jsonArgs) {
  const out = execFileSync('gh', jsonArgs, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return JSON.parse(out);
}

function fetchIssues() {
  // One issue, by number — CI's path. `issue view` is the same REST endpoint as
  // `issue list` below, so it has the same freshness guarantee: an issue edited
  // a second ago validates against what was just written, not against a search
  // index that has yet to catch up.
  if (only) {
    const one = gh(['issue', 'view', only, '--json', 'number,title,body,state,createdAt']);
    return [one];
  }

  // NOT `--search`: that hits GitHub's search index, which is eventually
  // consistent. Backfilling seven issues and validating immediately reported all
  // of them as missing a block that `gh issue view` showed was present -- the
  // index simply had not caught up. Plain `issue list` uses the REST endpoint
  // and returns current bodies, so `--since` is filtered here instead.
  const issues = gh([
    'issue', 'list',
    '--state', wantClosed ? 'closed' : 'open',
    '--limit', '400',
    '--json', 'number,title,body,state,createdAt',
  ]);
  if (!since) return issues;
  return issues.filter((i) => (i.createdAt || '').slice(0, 10) >= since);
}

/**
 * The template's own headings, read from the template.
 *
 * Measured 2026-09-07 across 190 open issues: ZERO followed
 * .github/ISSUE_TEMPLATE/bug.md completely, including the 20 filed after it
 * landed. Section uptake was "Signature" 63%, "Fix" 17%, "Guard" 3%,
 * "In plain English" 2%, "What is actually happening" 0% — and the one section
 * with real uptake is the one this checker already gated. The parts with a gate
 * get filled in; the parts without do not.
 *
 * Parsed, not restated, so the template stays the single definition — the same
 * rule the signature schema follows.
 */
function templateSections() {
  try {
    const tpl = readFileSync(new URL('../.github/ISSUE_TEMPLATE/bug.md', import.meta.url), 'utf8');
    return [...tpl.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());
  } catch {
    return [];
  }
}

const SECTIONS = templateSections();

function problemsFor(issue) {
  // The repo-wide sweep judges one rule and says nothing about the rest, so a
  // backlog that has not yet been brought up to the full standard still gives a
  // meaningful pass/fail on the field a future error matches on first.
  if (kindsOnly) {
    const p = kindProblem(issue.body);
    return { problems: p ? [p] : [], advice: [] };
  }

  const problems = [];

  // ADVICE, NOT FAILURE -- and the distinction is the whole point.
  //
  // A missing section is a different complaint from a missing signature field:
  // an issue can carry a perfect Signature block inside an otherwise shapeless
  // body. It used to fail the run all the same, and the consequence is measured
  // in this very file's own notes: ZERO of 190 open issues follow the template
  // completely, and the "What is actually happening" section has 0% uptake. The
  // check was therefore red for practically every issue it ever looked at.
  //
  // A gate that is always red is not a gate. #1068, #1069 and #1074 each went
  // red at filing time for a REAL violation -- a `kind` that does not exist in
  // the standard -- and all three landed in the backlog regardless, because red
  // was the colour that check always was. Nobody could tell the wolf from the
  // noise, and the invalid kinds survived until someone counted them by hand
  // three weeks later (#1121).
  //
  // Template conformance is worth reporting; the standard does not make it
  // required. The Signature fields ARE required, and they are satisfiable. Only
  // those fail the run now.
  const advice = [];
  for (const heading of SECTIONS) {
    const re = new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'im');
    if (!re.test(issue.body || '')) advice.push(`missing section: ## ${heading}`);
  }

  // parseSignature returns { fields, block, full } so callers that REWRITE a
  // block can find it; this one only reads, so it takes the fields.
  const parsed = parseSignature(issue.body);
  if (!parsed) return { problems: [...problems, 'no Signature block'], advice };
  const sig = parsed.fields;

  for (const key of REQUIRED_AT_FILING) {
    if (!sig[key] || !String(sig[key]).trim()) problems.push(`${key} is empty`);
  }
  if (sig.kind && !KINDS.has(String(sig.kind).trim())) {
    problems.push(`kind "${sig.kind}" is not one of: ${[...KINDS].join(', ')}`);
  }
  // A dead-declaration signature is computable by definition -- if it has no
  // detect, the most reusable thing about it was thrown away.
  if (String(sig.kind).trim() === 'dead-declaration' && !String(sig.detect || '').trim()) {
    problems.push('kind is dead-declaration but detect is empty (this class is always computable)');
  }
  // Conditional requirements, e.g. evidence <- detect: a detect nobody ran is a
  // guess with syntax highlighting (#1055 was filed on one that reported 1
  // instance where there were 48).
  for (const [field, trigger] of Object.entries(REQUIRED_WITH)) {
    if (String(sig[trigger] || '').trim() && !String(sig[field] || '').trim()) {
      problems.push(`${trigger} is present but ${field} is empty — paste what it printed, and date it`);
    }
  }
  if (issue.state === 'CLOSED') {
    for (const key of REQUIRED_ON_CLOSE) {
      if (!String(sig[key] || '').trim()) {
        problems.push(key === 'test'
          ? 'CLOSED without test — closed as claimed, not verified'
          : `CLOSED without ${key}`);
      }
    }
  }
  // Ship state is derived, never declared. A block that writes it down has
  // created a second copy of something git already knows, which is how
  // pages/whats-new.html came to claim uncommitted work was on main.
  for (const banned of BANNED) {
    if (String(sig[banned] || '').trim()) {
      problems.push(`${banned} is written down — ${BANNED_BECAUSE[banned]}`);
    }
  }
  return { problems, advice };
}

const issues = fetchIssues();
const scored = issues.map((i) => {
  const { problems, advice } = problemsFor(i);
  return { number: i.number, title: i.title, state: i.state, problems, advice };
});
const failing = scored.filter((r) => r.problems.length);
const advised = scored.filter((r) => !r.problems.length && r.advice.length);

if (asJson) {
  console.log(JSON.stringify({ scanned: issues.length, failing }, null, 2));
} else {
  const scope = wantClosed ? 'closed' : 'open';
  console.log(`Scanned ${issues.length} ${scope} issue(s)${since ? ` created >= ${since}` : ''}.`);
  if (!failing.length) {
    console.log(kindsOnly ? 'All carry a valid kind.' : 'All carry a complete Signature block.');
  } else {
    console.log(`\n${failing.length} missing or incomplete:\n`);
    for (const f of failing) {
      console.log(`  #${f.number}  ${f.title.slice(0, 68)}`);
      for (const p of f.problems) console.log(`      - ${p}`);
      for (const a of f.advice) console.log(`      ~ ${a}   (advice — does not fail)`);
    }
    console.log(`\nFormat: docs/standards/ISSUE-SIGNATURE-BLOCK.md`);
  }
  // Printed after the verdict so it can never read as a reason for the verdict.
  if (advised.length) {
    console.log(`\n${advised.length} pass the standard but do not follow the template:`);
    for (const a of advised) console.log(`  #${a.number}  ${a.advice.join('; ')}`);
  }
}

process.exit(failing.length ? 1 : 0);
