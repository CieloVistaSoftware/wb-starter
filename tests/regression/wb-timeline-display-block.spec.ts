import { test, expect } from '@playwright/test';

/**
 * <wb-timeline> is a custom element; timeline.css's `.wb-timeline` rule
 * never declared `display`, so the browser's default for an unknown tag
 * (`inline`) applied. That broke the absolutely-positioned `::before`
 * connecting line (an inline containing block gives `top:0;bottom:0` no
 * sane block height to span) and mixed badly with the `display:block`
 * .wb-timeline-item children built by src/wb-viewmodels/semantics/timeline.js.
 * Confirmed live on ?page=components: the items rendered (text was there)
 * but the timeline read as broken/unstyled -- "why is this not working?".
 * Fixed by adding `display: block` to `.wb-timeline`.
 */

test.describe('wb-timeline renders as a real block with a visible connecting line', () => {
  test('?page=components: wb-timeline is display:block with a real-height ::before line', async ({ page }) => {
    await page.goto('/?page=components');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });

    const timeline = page.locator('wb-timeline').first();
    await timeline.scrollIntoViewIfNeeded();
    await expect(timeline).toBeVisible({ timeout: 20000 });

    await expect(timeline).toHaveCSS('display', 'block');

    const items = timeline.locator('.wb-timeline-item');
    await expect(items).toHaveCount(5);
    await expect(items.first()).toContainText('Project Kickoff');

    const lineHeight = await timeline.evaluate((el) => {
      const before = getComputedStyle(el, '::before');
      return parseFloat(before.height);
    });
    expect(lineHeight, 'the ::before connecting line must span a real, non-zero height').toBeGreaterThan(50);
  });
});
