import { test, expect } from '@playwright/test';

/**
 * #264: Demos page → click a demo card (opens in a NEW TAB, target=_blank) →
 * return to the original tab → the demo links must still be there. Reported:
 * "when clicking on any of these links and then returning, none of these links
 * show."
 *
 * Covers both return paths:
 *  1. plain back/forward navigation (goto + goBack)
 *  2. the real click path — popup opens, user closes it / switches back
 *
 * #268 follow-up: category sections are <details>/<summary>, collapsed by
 * default — cards exist in the DOM (count() sees them) but aren't visible
 * or clickable until their category is expanded. The exact card count also
 * shrank hugely once most single-demo pages moved into demos/site/*.html,
 * so this no longer asserts a specific number, just "at least one".
 */
async function expandFirstCategory(page: import('@playwright/test').Page) {
  const firstSummary = page.locator('#app details.demos-category summary').first();
  await firstSummary.click();
}

test('links survive goto + goBack', async ({ page }) => {
  await page.goto('/?page=demos', { waitUntil: 'domcontentloaded' });
  const cards = page.locator('#app wb-card-link');
  await expect.poll(() => cards.count(), { timeout: 20000 }).toBeGreaterThan(0);
  await expandFirstCategory(page);
  // Not just present — RENDERED. (#264 root cause: wb-card-link had no behavior
  // mapping, so the elements existed but hydrated empty/invisible.)
  await expect(cards.first()).toBeVisible({ timeout: 15000 });

  const href = (await cards.first().getAttribute('href')) || '';
  expect(href, 'demo card must carry an href').toBeTruthy();
  await page.goto('/' + href.replace(/^\/+/, ''), { waitUntil: 'domcontentloaded' });
  await page.goBack({ waitUntil: 'domcontentloaded' });

  await expect
    .poll(() => page.locator('#app wb-card-link').count(), { timeout: 15000 })
    .toBeGreaterThan(0);
});

test('links survive opening a demo in a new tab and returning (#264)', async ({ page, context }) => {
  await page.goto('/?page=demos', { waitUntil: 'domcontentloaded' });
  const cards = page.locator('#app wb-card-link');
  await expect.poll(() => cards.count(), { timeout: 20000 }).toBeGreaterThan(0);
  await expandFirstCategory(page);
  // Not just present — RENDERED. (#264 root cause: wb-card-link had no behavior
  // mapping, so the elements existed but hydrated empty/invisible.)
  await expect(cards.first()).toBeVisible({ timeout: 15000 });

  // Real click path: the card opens the demo in a new tab.
  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    cards.first().click(),
  ]);
  await popup.waitForLoadState('domcontentloaded');
  await popup.close();

  // Back on the original tab, the links must still be there.
  await page.bringToFront();
  await page.waitForTimeout(500); // let any visibility/pageshow handlers run
  await expect
    .poll(() => page.locator('#app wb-card-link').count(), {
      timeout: 10000,
      message: 'demo links must survive returning from a new tab (#264)',
    })
    .toBeGreaterThan(0);
});
