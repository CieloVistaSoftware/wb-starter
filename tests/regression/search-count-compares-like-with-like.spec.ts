/**
 * "SHOWING X OF Y" MUST COUNT THE SAME THING ON BOTH SIDES OF "OF"
 * ===============================================================
 * #1019. The behaviours list renders one ROW PER VARIANT — 767 of them for far
 * fewer behaviours. The search counter read "Showing 1 of 767" where the 1 was
 * a row and the 767 was… also large, but arrived at differently. Two different
 * units either side of "of" is not a ratio, and the reader has no way to know
 * which is which.
 *
 * The rule this pins down: whatever the numerator counts, the denominator
 * counts too. It is checked by MEASURING both against the DOM rather than
 * reading the source, because the source has been consistent-looking through
 * every version of this bug.
 */

import { test, expect } from '../fixtures/offline';

test('the search counter measures rows against rows, not rows against behaviours', async ({ page }) => {
  test.slow();

  await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.behaviors-search-results__row', { timeout: 20_000 });
  // The list is complete once the unfiltered counter reads "N behaviors"
  // (#1516), not after 800ms: applyFilter renders every row, then sets it.
  await expect(page.locator('#behaviors-search-count')).toHaveText(/^\d+ behaviors$/, { timeout: 20_000 });

  const rowsUnfiltered = await page.locator('.behaviors-search-results__row').count();
  expect(rowsUnfiltered, 'no rows rendered — nothing to count').toBeGreaterThan(50);

  const search = page.locator('input[type="search"], .behaviors-search input').first();
  await expect(search, 'no search box on the behaviours page').toBeVisible();

  // A query that matches something, but not everything.
  await search.fill('avatar');
  // Wait for the filter to apply (#1516): the counter's shown number drops
  // below the total.
  await expect.poll(async () => {
    const t = (await page.locator('text=/Showing \\d+ of \\d+/').first().textContent()) || '';
    const mm = t.match(/Showing\s+(\d+)\s+of\s+(\d+)/);
    return !!mm && Number(mm[1]) < Number(mm[2]);
  }, { message: 'the "avatar" query never narrowed the list' }).toBe(true);

  const rowsFiltered = await page.locator('.behaviors-search-results__row').count();
  const label = (await page.locator('text=/Showing \\d+ of \\d+/').first().textContent()) || '';
  const m = label.match(/Showing\s+(\d+)\s+of\s+(\d+)/);

  expect(m, `the counter did not render a "Showing X of Y" label (saw: "${label.trim()}")`).toBeTruthy();

  const [, shownStr, totalStr] = m!;
  const shown = Number(shownStr);
  const total = Number(totalStr);

  expect(
    shown,
    `the counter says ${shown} rows are shown but ${rowsFiltered} are in the DOM`,
  ).toBe(rowsFiltered);

  expect(
    total,
    `"of ${total}" does not match the ${rowsUnfiltered} rows this list actually holds. ` +
    'If the denominator counts behaviours while the numerator counts variant rows, the ' +
    'ratio is meaningless — one behaviour can contribute a dozen rows.',
  ).toBe(rowsUnfiltered);

  // #1019's done-when: the unit is named, so "of 767" is not read against the
  // header's "184 behaviors".
  expect(label, 'the counter names what it counts').toMatch(/Showing \d+ of \d+ examples/);

  // And the filter has to have done something, or both numbers could agree
  // while proving nothing.
  expect(
    shown,
    'the query matched every row, so this comparison could not distinguish the units',
  ).toBeLessThan(rowsUnfiltered);
});
