/**
 * THE SHOWCASE MUST LIST EVERY BEHAVIOUR THE RUNTIME RESOLVES
 * ==========================================================
 * #1056. `pages/behaviors.html` built its list from `src/core/tag-map.js` alone.
 * The behaviour registry lives in TWO places — tag-map's `extensionMap` and
 * wb-lazy's `WB_LAZY_ONLY_ATTRIBUTES` — so 39 behaviours that work perfectly
 * well had no row on the page whose entire purpose is to list behaviours:
 * lightbox, masonry, popover, pagination, breadcrumb, share, print, countdown,
 * and every animation effect.
 *
 * wb-lazy.js says so in its own comment, naming this page: "34 x-* attributes
 * used by real demos on pages/behaviors.html live only here, so anything reading
 * tag-map alone reports an incomplete behavior list."
 *
 * The expected set is DERIVED from both registries at run time, never listed
 * here. A hardcoded count would pass while a behaviour added tomorrow went
 * missing — which is the same failure mode as the attribute allowlist in #1047
 * and the hand-listed rows in the first draft of the sub-path gate. The point is
 * that this test cannot go stale without failing.
 */

import { test, expect } from '@playwright/test';

/**
 * Every x-* attribute the runtime can actually resolve, from both registries.
 *
 * The `new URL(...)` is already a file: URL and is imported as-is. Running it
 * through pathToFileURL() first produced `C:\C:\Users\...` on Windows, because
 * the URL's pathname begins `/C:/` and pathToFileURL treats that as relative.
 */
async function registeredAttributes(): Promise<string[]> {
  const tag = await import(new URL('../../src/core/tag-map.js', import.meta.url).href);
  let lazy: Record<string, unknown> = {};
  try {
    lazy = await import(new URL('../../src/core/wb-lazy.js', import.meta.url).href);
  } catch { /* the page tolerates this too; the assertion below still holds */ }

  const merged = {
    ...((lazy as { WB_LAZY_ONLY_ATTRIBUTES?: Record<string, string> }).WB_LAZY_ONLY_ATTRIBUTES || {}),
    ...tag.extensionMap,
  };
  return Object.keys(merged);
}

test('every registered behaviour has a row on the behaviours page', async ({ page, baseURL }) => {
  test.slow();

  const expected = await registeredAttributes();
  expect(
    expected.length,
    'Neither registry resolved any attributes — the derivation is broken, which would ' +
    'silently reduce this test to asserting nothing.',
  ).toBeGreaterThan(100);

  await page.goto(`${baseURL}/?page=behaviors`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.behaviors-search-results__row', { timeout: 20_000 });
  await page.waitForTimeout(1000);

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
    'The page reads one registry; the runtime uses two. Merge WB_LAZY_ONLY_ATTRIBUTES\n' +
    'into extensionMap where the list is built, rather than adding names by hand.',
  ).toEqual([]);
});
