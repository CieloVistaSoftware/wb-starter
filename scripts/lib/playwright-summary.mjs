/**
 * playwright-summary.mjs — parse Playwright's final counts out of its stdout.
 *
 * Why this is its own module (#652): the tally used to live inline in
 * test-async.mjs's monitor as three unanchored, first-match regexes, and it was
 * wrong in two ways that made every number this tooling reported untrustworthy.
 *
 *   1. FIRST match, unanchored. Playwright prints a per-project progress line
 *      like "  ✓ compliance: 4898/4959 passed" long before its final summary,
 *      and /(\d+) passed/ matches "4959 passed" inside it — capturing the
 *      DENOMINATOR (tests collected) as the passed count. Whichever progress
 *      line flushed first won, so two runs of identical code reported different
 *      totals. That drift is what #652 was filed for.
 *
 *   2. "flaky" was never counted. playwright.config.ts sets `retries: 1`, so a
 *      test that fails and then passes on retry is reported as flaky and
 *      appears in NONE of passed/failed/skipped. The total silently omitted it.
 *
 * Anchoring to the start of a line matches only Playwright's own summary lines
 * ("  4898 passed (7.0m)") and never a progress line, and taking the LAST match
 * survives any earlier lookalike in captured test output.
 *
 * Verified against the real suite: `npx playwright test --project=compliance
 * --list` collects 4959 tests deterministically across repeated runs, so the
 * variance was never in the suite — only in this parse.
 */

/**
 * @param {string} output  Combined stdout + stderr from a Playwright run.
 * @returns {{passed: number|null, failed: number|null, skipped: number|null,
 *            flaky: number|null, total: number}}
 *   Each count is null when Playwright never printed that line (e.g. no run has
 *   flaky tests), so a caller can tell "zero" apart from "not reported".
 */
export function parsePlaywrightSummary(output) {
  const text = String(output || '');

  const lastCount = (word) => {
    // NOTE the doubled backslashes: inside a template literal a lone `\s`
    // collapses to a bare "s", silently producing a regex that never matches.
    const all = [...text.matchAll(new RegExp(`^\\s*(\\d+) ${word}\\b`, 'gm'))];
    return all.length ? parseInt(all[all.length - 1][1], 10) : null;
  };

  const passed = lastCount('passed');
  const failed = lastCount('failed');
  const skipped = lastCount('skipped');
  const flaky = lastCount('flaky');

  return {
    passed,
    failed,
    skipped,
    flaky,
    total: (passed || 0) + (failed || 0) + (skipped || 0) + (flaky || 0),
  };
}

export default parsePlaywrightSummary;
