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

const args = process.argv.slice(2);
const wantClosed = args.includes('--closed');
const asJson = args.includes('--json');
const sinceIdx = args.indexOf('--since');
const since = sinceIdx >= 0 ? args[sinceIdx + 1] : null;
const numberIdx = args.indexOf('--number');
const only = numberIdx >= 0 ? args[numberIdx + 1] : null;

const KINDS = new Set([
  'runtime',
  'test-failure',
  'measured',
  'structural',
  'dead-declaration',
  'process',
]);

// Required at filing time. `test` and `fix` are required only on close, so they
// are checked separately -- an open issue has not been fixed yet, and demanding
// the fix up front would just get it filled with a guess.
const REQUIRED_AT_FILING = ['kind', 'subject', 'observed', 'expected'];

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
 * Pull the yaml block out of a `## Signature` section.
 *
 * Deliberately tolerant about the heading (Signature / signature / ### ) and
 * about the fence language, because rejecting a real signature over a heading
 * level would teach people the validator is noise.
 */
export function parseSignature(body) {
  if (!body) return null;
  // `$(?![\s\S])` is end-of-input. `\Z` is not a JavaScript anchor -- it matches a
  // literal "Z", so a Signature block in the final section would never terminate.
  const section = body.match(/^#{1,4}[ \t]*signature[ \t]*$([\s\S]*?)(?=^#{1,4}[ \t]|$(?![\s\S]))/im);
  if (!section) return null;
  const fence = section[1].match(/```(?:ya?ml)?\s*\n([\s\S]*?)```/i);
  if (!fence) return null;

  const fields = {};
  let currentKey = null;
  for (const raw of fence[1].split('\n')) {
    // Block scalar continuation (`detect: |`) -- indented lines belong to it.
    if (currentKey && /^\s+\S/.test(raw)) {
      fields[currentKey] = (fields[currentKey] ? fields[currentKey] + '\n' : '') + raw.trim();
      continue;
    }
    const m = raw.match(/^([a-z][\w-]*)\s*:\s*(.*)$/i);
    if (!m) continue;
    const [, key, rest] = m;
    if (rest.trim() === '|' || rest.trim() === '>') {
      currentKey = key;
      fields[key] = '';
    } else {
      currentKey = null;
      fields[key] = rest.trim().replace(/^["']|["']$/g, '');
    }
  }
  return fields;
}

function problemsFor(issue) {
  const sig = parseSignature(issue.body);
  if (!sig) return ['no Signature block'];

  const problems = [];
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
  if (issue.state === 'CLOSED') {
    if (!String(sig.test || '').trim()) problems.push('CLOSED without test — closed as claimed, not verified');
    if (!String(sig.fix || '').trim()) problems.push('CLOSED without fix');
  }
  return problems;
}

const issues = fetchIssues();
const failing = issues
  .map((i) => ({ number: i.number, title: i.title, state: i.state, problems: problemsFor(i) }))
  .filter((r) => r.problems.length);

if (asJson) {
  console.log(JSON.stringify({ scanned: issues.length, failing }, null, 2));
} else {
  const scope = wantClosed ? 'closed' : 'open';
  console.log(`Scanned ${issues.length} ${scope} issue(s)${since ? ` created >= ${since}` : ''}.`);
  if (!failing.length) {
    console.log('All carry a complete Signature block.');
  } else {
    console.log(`\n${failing.length} missing or incomplete:\n`);
    for (const f of failing) {
      console.log(`  #${f.number}  ${f.title.slice(0, 68)}`);
      for (const p of f.problems) console.log(`      - ${p}`);
    }
    console.log(`\nFormat: docs/standards/ISSUE-SIGNATURE-BLOCK.md`);
  }
}

process.exit(failing.length ? 1 : 0);
