#!/usr/bin/env node
/**
 * Build the priority gate's manifest.
 * =============================================================================
 * John, 2026-09-05: "each issue will have a priority 1 through 5 assessed based
 * on negative impact to the project… now change our gates based on priorities."
 *
 * The gate itself must run offline and fast — a pre-commit hook that needs the
 * network is one people learn to bypass, and this repo has already lived that
 * once (#743: 16 commits in one day used --no-verify to dodge a version bump,
 * skipping every other check with it). So the GitHub read happens HERE, ahead of
 * time, and lands in data/priority-gate.json for the hook to read.
 *
 *   node scripts/build-priority-gate.mjs           # refresh the manifest
 *   node scripts/build-priority-gate.mjs --check   # report, write nothing
 *
 * Refreshed by .github/workflows/priority-gate-refresh.yml whenever an issue
 * changes, and by hand when working offline.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const OUT = 'data/priority-gate.json';
const checkOnly = process.argv.includes('--check');

const issues = JSON.parse(execFileSync('gh', [
  'issue', 'list', '--state', 'open', '--limit', '400',
  '--json', 'number,title,labels,body',
], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));

/** The `test:` line of a Signature block, or null. Empty means "not yet". */
function namedTest(body) {
  // [^\S\n] not \s -- \s eats the newline, so an EMPTY `test:` swallows the next
  // line and reports `fix:` as the test name. That mistake made 11 of 13
  // priority-1 issues look covered when 3 were.
  const m = (body || '').match(/^test:[ \t]*(\S.*?)[ \t]*$/m);
  if (!m) return null;
  const value = m[1].replace(/^["']|["']$/g, '').trim();
  if (!value || value === 'null') return null;
  // A prose note ("a spec is still wanted") is not a runnable test.
  return /\.spec\.ts|\.mjs|^node /.test(value) ? value : null;
}

const priorityOf = (i) => {
  const l = i.labels.map((x) => x.name).find((n) => /^priority:[1-5]$/.test(n));
  return l ? Number(l.split(':')[1]) : null;
};

const manifest = { generated: new Date().toISOString(), issues: {} };
for (const p of [1, 2, 3, 4, 5]) manifest.issues[p] = [];

for (const i of issues) {
  const p = priorityOf(i);
  if (!p) continue;
  manifest.issues[p].push({
    number: i.number,
    title: i.title.slice(0, 100),
    test: namedTest(i.body),
  });
}

const p1 = manifest.issues[1];
const covered = p1.filter((x) => x.test);
manifest.summary = {
  p1: p1.length,
  p1WithTest: covered.length,
  p1WithoutTest: p1.length - covered.length,
  p2: manifest.issues[2].length,
  p2WithTest: manifest.issues[2].filter((x) => x.test).length,
};

console.log(`priority 1: ${p1.length} open, ${covered.length} name a runnable test`);
console.log(`priority 2: ${manifest.summary.p2} open, ${manifest.summary.p2WithTest} name one`);
for (const x of p1) console.log(`   #${x.number}  ${x.test ? x.test : '— NO TEST —'}`);

if (checkOnly) process.exit(0);

const previous = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
const next = JSON.stringify(manifest, null, 2) + '\n';
writeFileSync(OUT, next);
console.log(`\n${OUT} ${previous === next ? 'unchanged' : 'updated'}`);
