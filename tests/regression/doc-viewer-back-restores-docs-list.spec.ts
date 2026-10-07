/**
 * BACK TO DOCS RETURNS THE READER TO WHERE THEY WERE (#1184)
 * ==========================================================
 * John, 2026-09-18: clicking "← Back to Docs" in the doc viewer does not
 * return the user to where they were in the docs list. Expected: the same
 * filter/search/section and scroll position (browser-back semantics).
 *
 * Measured on 4.0.6: every doc card opened in a NEW tab (target="_blank"), and
 * the viewer's Back link was hard-set to `?page=docs`, so Back loaded a fresh,
 * unfiltered list scrolled to the top in that new tab -- the list the reader
 * had filtered and scrolled was left behind in the other one. The filter was
 * never in the URL either, so nothing could have restored it.
 *
 * The list scrolls inside #siteBody (the site shell's main panel), not the
 * window, so that is the position measured.
 */
import { test, expect, Page } from '../fixtures/offline';

const listScroll = (page: Page) =>
  page.evaluate(() => document.getElementById('siteBody')!.scrollTop);

test('filter, open a doc, Back to Docs: same filter, same scroll, same tab', async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/?page=docs');
  await expect(page.locator('.docs-card').first()).toBeVisible({ timeout: 20_000 });

  // Filter the way a reader does, then scroll to a card well down the list.
  await page.locator('#docs-search').fill('behavior');
  const cards = page.locator('.docs-card');
  await expect.poll(() => cards.count()).toBeGreaterThan(12);
  // #961: the behavior sections above the list build asynchronously. Clicked
  // before they finish, the layout above the card differs between leaving and
  // coming back, so the page rightly puts the card back where it was on screen
  // while the raw scroll lands off by the difference (48px in a full-gate run).
  // The same layout on both sides is what makes both measurements below exact.
  await expect(page.locator('#behaviors-sections')).toHaveAttribute('data-built', '1', { timeout: 20_000 });
  const target = cards.nth(10);
  await target.scrollIntoViewIfNeeded();
  const href = await target.getAttribute('href');

  // Open it. A new tab is the defect: Back would then act in the wrong tab.
  // #1551: the position is read in the SAME task that clicks. A separate read
  // followed by Playwright's click() was stale ~3 runs in 10: when a click
  // attempt is intercepted, Playwright re-scrolls the card to the top before
  // clicking, the page saves (and later restores) THAT position, and the test
  // compared it with the earlier number. The click itself is queued for the
  // next task so the navigation does not destroy this evaluate mid-call.
  const popup = context.waitForEvent('page', { timeout: 3000 }).catch(() => null);
  const clickedAt = await target.evaluate((card) => {
    const sb = document.getElementById('siteBody')!;
    const at = { scroll: sb.scrollTop, offset: card.getBoundingClientRect().top - sb.getBoundingClientRect().top };
    setTimeout(() => (card as HTMLElement).click(), 0);
    return at;
  });
  const scrolledTo = clickedAt.scroll;
  expect(scrolledTo, 'the list must actually be scrolled for this to prove anything').toBeGreaterThan(200);
  expect(await popup, 'a doc opens in the same tab, so Back returns to this list').toBeNull();
  await expect(page).toHaveURL(/doc-viewer\.html\?file=/);
  await expect(page.locator('#back-to-docs')).toBeVisible();

  await page.locator('#back-to-docs').click();
  await expect(page).toHaveURL(/[?&]page=docs/);
  await expect(page.locator('#docs-search'), 'the filter survives').toHaveValue('behavior');
  // The behavior chips above the list honour it too: they used to filter only
  // on typing, so a returned-to filter showed every chip unfiltered.
  await expect(page.locator('#behaviors-sections')).toHaveAttribute('data-built', '1');
  const unfiltered = await page.$$eval('#behaviors-sections li:not([hidden])',
    (lis) => lis.filter((li) => !(li as HTMLElement).dataset.search?.includes('behavior')).length);
  expect(unfiltered, 'chips shown that do not match the filter').toBe(0);
  // The promise is "the card you opened is where it was on screen", which is
  // what the page saves (its offset) -- and the raw scroll follows from it.
  // Polled both ways: the page re-places the card while the sections above it
  // settle, so one read could land mid-settle.
  const cardOffset = () => page.evaluate((h) => {
    const c = [...document.querySelectorAll('a.docs-card')].find((a) => a.getAttribute('href') === h);
    const sb = document.getElementById('siteBody');
    return c && sb ? c.getBoundingClientRect().top - sb.getBoundingClientRect().top : Number.NaN;
  }, href);
  await expect.poll(async () => Math.abs((await cardOffset()) - clickedAt.offset),
    { message: `the card returns to where it was on screen (${Math.round(clickedAt.offset)}px down)` }).toBeLessThan(40);
  await expect.poll(async () => Math.abs((await listScroll(page)) - scrolledTo),
    { message: `the scroll position survives (${Math.round(scrolledTo)})` }).toBeLessThan(40);
});

test('a viewer opened directly still offers a way to the docs list', async ({ page }) => {
  await page.goto('/public/doc-viewer.html?file=docs%2Fbehaviors%2Fcard.md');
  const back = page.locator('#back-to-docs');
  await expect(back).toBeVisible();
  await back.click();
  await expect(page).toHaveURL(/[?&]page=docs/);
  await expect(page.locator('.docs-card').first()).toBeVisible({ timeout: 20_000 });
});
