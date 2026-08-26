import { test, expect } from '@playwright/test';

/**
 * A single-item demo's `--x-demo-shrink-width` (demo.js, #486) sizes the
 * WHOLE x-demo -- code panel included, since `.x-demo__code` is
 * width:100% of its parent -- to the rendered control's own natural width.
 * For a small control (a plain text <article>, ~250-340px) that left the
 * code panel just as cramped, even though `.x-demo__code`'s own max-width
 * already allows up to 50vw: a max-width can never make an element WIDER
 * than its constrained parent, only narrower. Live report: pages/
 * components.html's "This is the title" card demo rendered source at
 * ~250px with a horizontal scrollbar cutting off every attribute value
 * mid-word.
 *
 * Fix: `min-width: 50vw` on `x-demo[data-code-width="50vw"]` itself
 * (src/styles/behaviors/demo.css) -- min-width always wins over the JS-set
 * `width` in the box model, so the demo (and the code panel inside it)
 * grows to 50vw regardless of how narrow the shrink-measurement was.
 */
test.describe('x-demo[data-code-width="50vw"] actually reaches 50vw', () => {
  test('components.html: the "This is the title" card demo code panel is not cramped', async ({ page }) => {
    await page.goto('/?page=components', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#cardComponentDemo', { timeout: 20000 });
    await page.waitForTimeout(1500); // shrink-width rAF measurement + settle

    const demo = page.locator('#cardComponentDemo');
    await expect(demo).toHaveAttribute('data-code-width', '50vw');

    const viewportWidth = page.viewportSize()!.width;
    const codePanel = demo.locator('.x-demo__code');
    const codeWidth = await codePanel.evaluate((el) => el.getBoundingClientRect().width);

    // Allow generous slack (padding/scrollbar) -- just prove it's not still
    // clamped to the card's own ~250-340px natural width.
    expect(codeWidth, `code panel width ${codeWidth}px should be near 50vw (${viewportWidth / 2}px)`).toBeGreaterThan(
      viewportWidth * 0.4
    );
  });
});
