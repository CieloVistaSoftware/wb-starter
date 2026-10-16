import { test, expect } from '../fixtures/offline';

/**
 * x-cardhero's headingLevel rows say which tag they render.
 *
 * John, 2026-10-16: "None of the heading levels affect the look and feel."
 * By design: headingLevel is document structure (the title's tag), not size,
 * and John chose to keep it that way -- "headingLevel stays semantic only (same
 * look). Make the 6 example rows show which tag they produce". The schema says
 * so with `rendersTag: "h{{value}}"`, and the Behaviors list shows <h1>..<h6>.
 */
test('each headingLevel row shows <hN>, and picking it renders an <hN> title', async ({ page }) => {
  await page.goto('/?page=behaviors');
  await expect(page.locator('.behaviors-live__body')).toBeVisible({ timeout: 20000 });
  const rows = page.locator('.behaviors-search-results__row[data-prop="headingLevel"]');
  await expect(rows).toHaveCount(6, { timeout: 15000 });

  for (let n = 1; n <= 6; n++) {
    const row = page.locator(`.behaviors-search-results__row[data-prop="headingLevel"][data-variant="${n}"]`);
    await expect(row.locator('.behaviors-search-results__tag')).toHaveText(`<h${n}>`);
  }

  // The badge tells the truth: level 5 builds an <h5> title.
  await page.evaluate(() => (document.querySelector('.behaviors-search-results__row[data-prop="headingLevel"][data-variant="5"]') as HTMLElement).click());
  await expect(page.locator('#behaviors-live-stage .x-card__hero-title').first()).toHaveJSProperty('tagName', 'H5', { timeout: 15000 });
});
