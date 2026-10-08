import { test, expect } from '../fixtures/offline';

/**
 * #1759: a single-item x-demo commits its width once (#985). When the control's
 * behavior builds AFTER that commit, the control changes width inside a demo
 * that has already locked its own, and overflows it.
 *
 * Measured on demos/site/cards.html with card.js held until the demo's code
 * panel existed: the demo committed 387px, then <article size="lg"> became
 * .x-card--lg (min-width 420px) and ran 49px past the demo's right edge.
 *
 * Holding card.js back is how a slow network or a lazy chunk orders things;
 * it is not an artificial state. The demo must end up wide enough for the
 * control it holds.
 */
// page.route() cannot see a request the service worker answers (#1349).
test.use({ serviceWorkers: 'block' });

test('a demo grows to fit a control that finishes building after the demo committed (#1759)', async ({ page }) => {
  let releaseCardJs: () => void = () => {};
  const cardJsHeld = new Promise<void>((resolve) => { releaseCardJs = resolve; });
  await page.route('**/wb-viewmodels/card.js*', async (route) => {
    await cardJsHeld;
    await route.continue();
  });

  await page.goto('/demos/site/cards.html');
  // The first demo in the card section holding a size="lg" article.
  const demo = page.locator('#card-card [x-demo]').filter({ has: page.locator('article[size="lg"]') }).first();
  const card = demo.locator('article[size="lg"]').first();

  // The demo commits while the card is still a plain article.
  await expect(demo).toHaveClass(/x-demo--measured/, { timeout: 20000 });
  await expect(card).not.toHaveClass(/x-card--lg/);
  const committedBefore = await demo.evaluate((d) => d.getBoundingClientRect().width);

  releaseCardJs();
  await expect(card).toHaveClass(/x-card--lg/, { timeout: 20000 });
  await page.evaluate(() => (window as any).WB.settled({ timeout: 20000 }));

  // The card's own min-width transition (0.2s) ends before the demo re-measures;
  // poll the geometry rather than guess a duration.
  await expect.poll(async () => card.evaluate((c) => {
    const d = c.closest('[x-demo]') as HTMLElement;
    return Math.round(d.getBoundingClientRect().right - c.getBoundingClientRect().right);
  }), { timeout: 10000, message: 'the built card must sit inside its demo, not overflow it' }).toBeGreaterThanOrEqual(0);

  const after = await card.evaluate((c) => {
    const d = c.closest('[x-demo]') as HTMLElement;
    return { card: c.getBoundingClientRect().width, demo: d.getBoundingClientRect().width };
  });
  expect(after.card, 'the large card is built at its large size').toBeGreaterThanOrEqual(420);
  expect(after.demo, 'the demo grew from its first commit to fit the built card').toBeGreaterThan(committedBefore);
});
