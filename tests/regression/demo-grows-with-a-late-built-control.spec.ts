import { test, expect } from '../fixtures/offline';
import { waitForWB, wbIdle } from '../base';

/**
 * #1759: a single-item x-demo measures its control and commits one width
 * (#985). When the control's behavior builds after that commit, the control
 * grows and the demo used to keep the old width, so the control overflowed.
 * On demos/site/cards.html the "Large Card" demo committed ~387px, then
 * <article size="lg"> grew to 420px (`.x-card--lg`'s min-width).
 *
 * Reproduced the way the issue found it: card.js is held until the demo's
 * code panel exists, so measure() settles on the plain article.
 */
// page.route() below holds card.js back; sw.js would answer first from its
// cache and the hold would never happen (#1349).
test.use({ serviceWorkers: 'block' });

test('a demo grows to fit its control when the control builds after the width commit', async ({ page }) => {
  let release!: () => void;
  const released = new Promise<void>((r) => { release = r; });
  await page.route('**/wb-viewmodels/card.js', async (route) => {
    await released;
    await route.continue();
  });

  // Growing from inside the observer's callback logged "ResizeObserver loop
  // completed with undelivered notifications", which the page's error logger
  // shows as an error panel (overlap.spec.ts caught it on shop-now).
  const loopErrors: string[] = [];
  page.on('console', (m) => { if (/ResizeObserver loop/.test(m.text())) loopErrors.push(m.text()); });
  await page.goto('/demos/site/cards.html');
  const demo = page.locator('[x-demo]', { has: page.locator('article[size="lg"][title="Large Card"]') });
  await demo.scrollIntoViewIfNeeded();
  // The width is committed (x-demo--measured) while the card is still a plain article.
  await expect(demo).toHaveClass(/x-demo--measured/, { timeout: 15000 });
  release();
  await waitForWB(page);
  await wbIdle(page);

  const card = demo.locator('article[size="lg"]');
  await expect(card).toHaveClass(/x-card--lg/, { timeout: 15000 });
  // The card's 0.2s transition has to finish before the widths are final.
  await expect.poll(async () => {
    const [cardBox, demoBox] = await Promise.all([card.boundingBox(), demo.boundingBox()]);
    return Math.round(cardBox!.x + cardBox!.width) <= Math.round(demoBox!.x + demoBox!.width);
  }, { message: 'the card ends inside its demo' }).toBe(true);
  expect(loopErrors, 'growing the demo raised no ResizeObserver loop error').toEqual([]);
});
