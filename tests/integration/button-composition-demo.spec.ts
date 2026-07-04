import { test, expect } from '@playwright/test';

/**
 * button-composition-demo.html layout + code formatting.
 *
 * The demo was reworked to a vertical-first layout with real code formatting:
 *   - the "composition, not configuration" comparison stacks its two code
 *     samples VERTICALLY (was a 2-column horizontal grid), and
 *   - those hand-written code samples are syntax-highlighted. They are NOT
 *     WB-managed, so the page highlights them directly with the local
 *     highlight.js + theme-variable colors (same approach as the doc-viewer).
 *
 * This pins both so a regression (unhighlighted code / horizontal relapse) fails.
 */
const URL = '/demos/button-composition-demo.html';

test.describe('button-composition demo: vertical layout + highlighted code', () => {
  test('comparison code blocks are syntax-highlighted', async ({ page }) => {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });

    const firstCode = page.locator('.wb-compare code').first();
    // Direct hljs highlighting runs from the page module — wait for it to apply.
    await expect(firstCode).toHaveClass(/hljs/, { timeout: 15000 });

    // Real tokens, not one plain blob: the HTML tag name / attr / string differ.
    const tokenCount = await firstCode.locator('span[class*="hljs-"]').count();
    expect(tokenCount, 'code should be tokenized into colored spans').toBeGreaterThan(2);
  });

  test('comparison samples stack vertically with >= 1rem padding', async ({ page }) => {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    const compare = page.locator('.wb-compare');
    await expect(compare).toBeVisible();

    const flexDir = await compare.evaluate((el) => getComputedStyle(el).flexDirection);
    expect(flexDir, 'the two code samples must stack vertically').toBe('column');

    const pad = await page
      .locator('.wb-compare pre')
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).paddingTop));
    expect(pad, 'code padding should be at least 1rem (16px)').toBeGreaterThanOrEqual(16);
  });

  test('behavior tags render as a vertical list', async ({ page }) => {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    const list = page.locator('.wb-behaviors');
    await expect(list).toBeVisible();
    const dir = await list.evaluate((el) => getComputedStyle(el).flexDirection);
    expect(dir, 'behavior tags should be listed vertically, one per line').toBe('column');
  });
});
