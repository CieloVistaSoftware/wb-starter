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
  const target = cards.nth(10);
  await target.scrollIntoViewIfNeeded();
  const scrolledTo = await listScroll(page);
  expect(scrolledTo, 'the list must actually be scrolled for this to prove anything').toBeGreaterThan(200);

  // Open it. A new tab is the defect: Back would then act in the wrong tab.
  const popup = context.waitForEvent('page', { timeout: 3000 }).catch(() => null);
  await target.click();
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
  await expect.poll(() => listScroll(page), { message: 'the scroll position survives' })
    .toBeGreaterThan(scrolledTo - 40);
  expect(await listScroll(page)).toBeLessThan(scrolledTo + 40);
});

test('a viewer opened directly still offers a way to the docs list', async ({ page }) => {
  await page.goto('/public/doc-viewer.html?file=docs%2Fbehaviors%2Fcard.md');
  const back = page.locator('#back-to-docs');
  await expect(back).toBeVisible();
  await back.click();
  await expect(page).toHaveURL(/[?&]page=docs/);
  await expect(page.locator('.docs-card').first()).toBeVisible({ timeout: 20_000 });
});
