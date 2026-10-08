import { test, expect } from '../fixtures/offline';

/**
 * #1759: a single-item x-demo commits its width once (#985). When the control's
 * behavior arrived after that commit, the demo kept the width of the plain
 * markup and the built control grew past it: on demos/site/cards.html the
 * "Large Card" demo committed about 387px, then card.js made the
 * <article size="lg"> 420px wide (`.x-card--lg`, min-width 420px), so it
 * overflowed the demo's edge.
 *
 * Reproduced exactly: card.js is held until that demo has committed, then
 * released. demo.js now listens for the control's bubbling `wb:ready` and
 * measures again, so the second commit is the built card's width.
 */
test('a demo whose control builds after its width commit is measured again (#1759)', async ({ page }) => {
  let release!: () => void;
  const cardJsHeld = new Promise<void>((r) => { release = r; });
  await page.route('**/wb-viewmodels/card.js*', async (route) => {
    await cardJsHeld;
    await route.continue();
  });

  await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });
  const card = page.locator('#card-card article[title="Large Card"][size="lg"]');
  const demo = card.locator('xpath=ancestor::*[@x-demo][1]');
  await card.scrollIntoViewIfNeeded();

  // The commit happens while the card is still plain markup.
  await expect(demo).toHaveClass(/x-demo--measured/, { timeout: 15_000 });
  await expect(card, 'card.js is held, so the card must not be built yet').not.toHaveClass(/x-card--lg/);
  const committedBefore = await demo.evaluate((d) => d.getBoundingClientRect().width);

  release();
  await expect(card).toHaveClass(/x-card--lg/, { timeout: 15_000 });

  // The demo follows the built card: re-measured, recommitted, and the card
  // fits inside the demo's content box.
  await expect.poll(async () => card.evaluate((c) => {
    const d = c.closest('[x-demo]')!;
    const cs = getComputedStyle(d);
    const inner = d.getBoundingClientRect().right - (parseFloat(cs.paddingRight) || 0) - (parseFloat(cs.borderRightWidth) || 0);
    return Math.round(c.getBoundingClientRect().right - inner);
  }), { timeout: 10_000, message: 'the built card overflows the demo it is in (px past its edge)' }).toBeLessThanOrEqual(0);
  await expect(demo).toHaveClass(/x-demo--measured/);
  const committedAfter = await demo.evaluate((d) => d.getBoundingClientRect().width);
  expect(committedAfter, 'the demo grew to hold the built card').toBeGreaterThan(committedBefore);
});
