/**
 * THE SHOWCASE MUST LIST EVERY BEHAVIOUR THE RUNTIME RESOLVES
 * ==========================================================
 * #1056. `pages/behaviors.html` built its list from `src/core/tag-map.js` alone.
 * The behaviour registry lived in TWO places — tag-map's `extensionMap` and
 * wb-lazy's `WB_LAZY_ONLY_ATTRIBUTES` (one since #831) — so 39 behaviours that work perfectly
 * well had no row on the page whose entire purpose is to list behaviours:
 * lightbox, masonry, popover, pagination, breadcrumb, share, print, countdown,
 * and every animation effect.
 *
 * wb-lazy.js said so in its own comment, naming this page: "34 x-* attributes
 * used by real demos on pages/behaviors.html live only here, so anything reading
 * tag-map alone reports an incomplete behavior list."
 *
 * The expected set is DERIVED from the registry at run time, never listed
 * here. A hardcoded count would pass while a behaviour added tomorrow went
 * missing — which is the same failure mode as the attribute allowlist in #1047
 * and the hand-listed rows in the first draft of the sub-path gate. The point is
 * that this test cannot go stale without failing.
 *
 * It is the ONLY guard for this rule (#1390): a second spec checking the
 * lazy-only subset the same way (behaviors-list-includes-lazy-only-attributes)
 * was folded in and deleted.
 */

import { test, expect } from '../fixtures/offline';

/**
 * Every x-* attribute the runtime can actually resolve. Since #831 that is
 * tag-map.js's extensionMap alone: wb-lazy's WB_LAZY_ONLY_ATTRIBUTES, the
 * second registry this spec was written against, was folded into it.
 *
 * The `new URL(...)` is already a file: URL and is imported as-is. Running it
 * through pathToFileURL() first produced `C:\C:\Users\...` on Windows, because
 * the URL's pathname begins `/C:/` and pathToFileURL treats that as relative.
 */
async function registeredAttributes(): Promise<string[]> {
  const tag = await import(new URL('../../src/core/tag-map.js', import.meta.url).href);
  return Object.keys(tag.extensionMap);
}

test('every registered behaviour has a row on the behaviours page', async ({ page, baseURL }) => {
  test.slow();

  const expected = await registeredAttributes();
  expect(
    expected.length,
    'The registry resolved no attributes — the derivation is broken, which would ' +
    'silently reduce this test to asserting nothing.',
  ).toBeGreaterThan(100);

  await page.goto(`${baseURL}/?page=behaviors`, { waitUntil: 'domcontentloaded' });
  // #1390: wait for the list to be POPULATED, not for its first row to be
  // visible. waitForSelector judged the first of 1316 rows, which can be
  // hidden, and timed out with the whole list present (PR #1354's CI). The
  // fixed 1000 ms sleep after it guessed at "done"; the count says it.
  await expect.poll(
    () => page.locator('.behaviors-search-results__row').count(),
    { timeout: 30_000, message: 'the Behaviors list never populated' },
  ).toBeGreaterThan(100);

  // Rows are labelled by what the reader would TYPE, which for an auto-injected
  // behaviour is its semantic host (`dialog`, not `x-dialog`). So a behaviour
  // counts as present if either spelling appears.
  const labels = await page.evaluate(() =>
    [...document.querySelectorAll('.behaviors-search-results__token')]
      .map((s) => (s.textContent || '').trim())
      .filter(Boolean));

  const shown = new Set(labels);
  const missing = expected.filter((attr) => !shown.has(attr) && !shown.has(attr.replace(/^x-/, '')));

  expect(
    missing,
    `${missing.length} of ${expected.length} registered behaviours have no row.\n` +
    'Build the page list from tag-map.js extensionMap, the registry the runtime\n' +
    'reads, rather than adding names by hand.',
  ).toEqual([]);
});
