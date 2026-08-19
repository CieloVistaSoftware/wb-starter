/**
 * test-summary-parse.mjs — regression tests for the run tally (#652).
 *
 * The bug: two compliance runs of identical code reported different totals
 * (5545 vs 5546) and both exceeded the real collected count (4959, measured
 * deterministically via `--list` across repeated runs). The suite was never
 * unstable; the PARSE of Playwright's output was.
 *
 * Run: npm run test:summary-parse
 */

import { parsePlaywrightSummary } from './lib/playwright-summary.mjs';

let passed = 0;
let failed = 0;

function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name}`);
    console.log(`     expected ${e}`);
    console.log(`     actual   ${a}`);
  }
}

// ─── THE REGRESSION ────────────────────────────────────────────────
console.log('\nA progress line must not be mistaken for the summary:');
{
  // This is the shape that caused #652. The progress line contains
  // "4959 passed" as a substring of "4898/4959 passed".
  const output = [
    'Running 4959 tests using 8 workers',
    '  ✓ compliance: 4898/4959 passed',
    '  ✘ compliance: 83/4959 failed',
    '',
    '  83 failed',
    '  12 flaky',
    '  565 skipped',
    '  4898 passed (7.0m)',
  ].join('\n');

  check('reads the real summary, not the denominator',
    parsePlaywrightSummary(output),
    { passed: 4898, failed: 83, skipped: 565, flaky: 12, total: 5558 });

  // Pin the old behaviour so nobody reintroduces it.
  const naive = output.match(/(\d+) passed/);
  check('the old first-match regex really did capture the denominator',
    naive[1], '4959');
}

console.log('\nFlaky is counted (retries: 1 makes it reachable):');
{
  const output = ['  2 flaky', '  10 passed (3.0s)'].join('\n');
  check('flaky included in the total',
    parsePlaywrightSummary(output),
    { passed: 10, failed: null, skipped: null, flaky: 2, total: 12 });
}

console.log('\nA clean run:');
{
  const output = '  4 passed (5.2s)';
  check('passed only',
    parsePlaywrightSummary(output),
    { passed: 4, failed: null, skipped: null, flaky: null, total: 4 });
}

console.log('\nSingle-spec output with an inline project progress line:');
{
  // Real output captured from a passing single-spec run.
  const output = ['  ✓ regression: 4/4 passed', '  4 passed (5.2s)'].join('\n');
  check('the "4/4 passed" progress line is ignored',
    parsePlaywrightSummary(output),
    { passed: 4, failed: null, skipped: null, flaky: null, total: 4 });
}

console.log('\nNot-reported is distinguishable from zero:');
{
  check('nothing printed at all',
    parsePlaywrightSummary(''),
    { passed: null, failed: null, skipped: null, flaky: null, total: 0 });
  check('null/undefined input does not throw',
    parsePlaywrightSummary(undefined),
    { passed: null, failed: null, skipped: null, flaky: null, total: 0 });
}

console.log('\nLater summary wins over an earlier lookalike in test output:');
{
  // A test's own captured stdout can contain a summary-shaped line.
  const output = [
    '  console.log: 999 passed',
    '',
    '  1 failed',
    '  7 passed (2.0s)',
  ].join('\n');
  check('takes the LAST anchored match',
    parsePlaywrightSummary(output),
    { passed: 7, failed: 1, skipped: null, flaky: null, total: 8 });
}

console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
