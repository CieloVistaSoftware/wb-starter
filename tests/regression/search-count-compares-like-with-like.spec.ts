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

import { test, expect } from '@playwright/test';

test('the search counter measures rows against rows, not rows against behaviours', async ({ page }) => {
  test.slow();

  await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.behaviors-search-results__row', { timeout: 20_000 });
  await page.waitForTimeout(800);

  const rowsUnfiltered = await page.locator('.behaviors-search-results__row').count();
  expect(rowsUnfiltered, 'no rows rendered — nothing to count').toBeGreaterThan(50);

  const search = page.locator('input[type="search"], .behaviors-search input').first();
  await expect(search, 'no search box on the behaviours page').toBeVisible();

  // A query that matches something, but not everything.
  await search.fill('avatar');
  await page.waitForTimeout(600);

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

  // And the filter has to have done something, or both numbers could agree
  // while proving nothing.
  expect(
    shown,
    'the query matched every row, so this comparison could not distinguish the units',
  ).toBeLessThan(rowsUnfiltered);
});
