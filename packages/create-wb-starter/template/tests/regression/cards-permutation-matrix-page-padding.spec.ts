import { test, expect } from '@playwright/test';

/**
 * "every page on our web site must follow our standards" -- including
 * tests/fixtures/cards-permutation-matrix.html, even though it's a test
 * fixture rather than a curated demo page. It shipped with ZERO body
 * padding (no `.page`/wrapper at all), so <h1>/<nav>/<p> sat flush at
 * x=0 against the viewport edge -- the same DEMOS-AND-DOCS-STANDARDS.md
 * #13 violation (>=1rem clearance from any edge) already fixed for
 * demos/site/*.html (see demos-site-page-padding.spec.ts), just never
 * applied here since this file lives outside the demos/pages globs those
 * fixes/tests scan.
 */

test('tests/fixtures/cards-permutation-matrix.html: page content keeps >=1rem clearance from the viewport edge', async ({ page }) => {
  await page.goto('/tests/fixtures/cards-permutation-matrix.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).WB, { timeout: 20000 });
  await page.waitForTimeout(500);

  const bodyPaddingLeft = await page.evaluate(() => parseFloat(getComputedStyle(document.body).paddingLeft));
  expect(bodyPaddingLeft, 'body (or its content wrapper) must have >=1rem left padding').toBeGreaterThanOrEqual(16);

  const h1 = page.locator('h1').first();
  await expect(h1).toBeVisible();
  const x = await h1.evaluate((el) => el.getBoundingClientRect().x);
  expect(x, 'h1 must not sit flush against the viewport edge').toBeGreaterThanOrEqual(16);
});
