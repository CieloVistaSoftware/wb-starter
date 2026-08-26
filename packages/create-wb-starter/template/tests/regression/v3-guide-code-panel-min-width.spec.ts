import { test, expect } from '@playwright/test';

/**
 * Live-reported: docs/V3-GUIDE.md's bare <span x-spinner>/<progress> examples
 * (no size-driving attributes of their own -- a spinner is a small icon,
 * a progress bar has no explicit width) rendered as unreadable
 * single-character-wide vertical strips.
 *
 * Root cause: the single-item shrink-to-fit rule (#486,
 * `x-demo:has(> .x-demo__grid--cols-1 > :only-child) { width: var(--x-
 * demo-shrink-width, fit-content) }`) sizes the WHOLE demo -- code panel
 * included, since .x-demo__code is width:100% of its x-demo parent -- to
 * the control's own measured width. That's correct for a normally-sized
 * control, but a genuinely tiny one (measured 36-68px live) dragged the
 * code panel down to that same width, wrapping the source text one
 * CHARACTER per line. Standard §27 documents horizontal scroll for long
 * lines as the intended behavior, not vertical character-wrapping.
 *
 * Fix: .x-demo__code (and its x-demo parent, so the child's min-width
 * isn't just clipped by an ancestor with a smaller explicit `width`) get a
 * min-width floor of min(320px, 90vw) -- narrow enough to never overflow a
 * genuinely narrow mobile viewport, wide enough that source code is always
 * legible regardless of how small the control itself is.
 */
test.describe('x-demo code panels never collapse to unreadable vertical strips', () => {
  test('V3-GUIDE.md: no x-demo widget renders narrower than the readable-code floor', async ({ page }) => {
    await page.goto('/public/doc-viewer.html?file=docs%2FV3-GUIDE.md', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#content', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const demos = page.locator('x-demo');
    const count = await demos.count();
    expect(count, 'expected the guide to have multiple live x-demo examples').toBeGreaterThan(1);

    for (let i = 0; i < count; i++) {
      const box = await demos.nth(i).boundingBox();
      if (!box) continue; // not visible -- not this bug's concern
      expect(
        box.width,
        `x-demo[${i}] rendered only ${Math.round(box.width)}px wide -- collapsed to an unreadable strip.`
      ).toBeGreaterThan(150);
    }
  });

  test('the Spinner example specifically is readable, not a single-character-wide strip', async ({ page }) => {
    await page.goto('/public/doc-viewer.html?file=docs%2FV3-GUIDE.md', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#content', { timeout: 15000 });

    const label = page.getByText('Spinner —', { exact: false });
    await expect(label).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1500);

    const demo = label.locator('xpath=following-sibling::x-demo[1]');
    const box = await demo.boundingBox();
    expect(box, 'the Spinner x-demo must have a measurable box').not.toBeNull();
    expect(box!.width).toBeGreaterThan(150);

    const codeText = await demo.locator('.x-demo__code').innerText();
    expect(codeText, 'code panel text should read as normal wrapped lines, not one character per line').toContain('x-spinner');
  });
});
