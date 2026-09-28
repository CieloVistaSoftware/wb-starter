import { test, expect } from '../fixtures/offline';

/**
 * A single-item demo's `--x-demo-shrink-width` (demo.js, #486) sizes the
 * WHOLE x-demo -- code panel included, since `.x-demo__code` is
 * width:100% of its parent -- to the rendered control's own natural width.
 * For a small control (a plain text <article>, ~250-340px) that left the
 * code panel just as cramped, even though `.x-demo__code`'s own max-width
 * already allows up to 50vw: a max-width can never make an element WIDER
 * than its constrained parent, only narrower. Live report: pages/
 * behaviors.html's "This is the title" card demo rendered source at
 * ~250px with a horizontal scrollbar cutting off every attribute value
 * mid-word.
 *
 * Fix: `min-width: 50vw` on `x-demo[data-code-width="50vw"]` itself
 * (src/styles/behaviors/demo.css) -- min-width always wins over the JS-set
 * `width` in the box model, so the demo (and the code panel inside it)
 * grows to 50vw regardless of how narrow the shrink-measurement was.
 */
// Mounted on the test harness rather than read off pages/behaviors.html:
// #664 replaced that page's static demo sections with an on-demand panel, and
// #cardComponentDemo went with them -- no page carries data-code-width="50vw"
// any more, so waiting for it timed out. The CSS contract (demo.css) is
// unchanged and is what this checks: a narrow single-item demo that opts in to
// 50vw gets a code panel near 50vw. The markup is the retired demo's own card.
const DEMO = `<div x-demo id="cardComponentDemo" data-code-width="50vw">
  <article title="This is the title" subtitle="Subtitle">Short card body.</article>
</div>`;

test.describe('x-demo[data-code-width="50vw"] actually reaches 50vw', () => {
  test('behaviors.html: the "This is the title" card demo code panel is not cramped', async ({ page }) => {
    await page.goto('/demos/test-harness.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 20000 },
    );
    await page.evaluate(async (html: string) => {
      const host = document.createElement('div');
      host.id = 'code-width-host';
      host.innerHTML = html;
      document.body.prepend(host);
      await (window as any).WB.scan(host);
    }, DEMO);

    const demo = page.locator('#cardComponentDemo');
    await expect(demo).toHaveAttribute('data-code-width', '50vw');
    const codePanel = demo.locator('.x-demo__code');
    await expect(codePanel).toBeVisible({ timeout: 20000 });
    // The card must have built before the shrink-width measurement means anything.
    await expect(demo.locator('article')).toHaveAttribute('x-ready', '', { timeout: 20000 });

    const viewportWidth = page.viewportSize()!.width;
    // Allow generous slack (padding/scrollbar) -- just prove it's not still
    // clamped to the card's own ~250-340px natural width.
    await expect.poll(
      () => codePanel.evaluate((el) => el.getBoundingClientRect().width),
      { timeout: 10000, message: `code panel should be near 50vw (${viewportWidth / 2}px)` },
    ).toBeGreaterThan(viewportWidth * 0.4);
  });
});
