/**
 * Nav link scroll behavior (#165 follow-up).
 *
 * Spec:
 *  - Clicking a nav link the FIRST time lands the page at the top, with its
 *    content ~1rem below the sticky header (not scrolled under it).
 *  - Returning to a page you've already visited restores the scroll position
 *    you left it at.
 *
 * The window is the scroll container and scroll memory lives on the in-memory
 * site-engine instance, so navigation must be SPA (clicking nav links), never a
 * full reload — a reload would reset the memory.
 */
import { test, expect, Page } from '@playwright/test';

const LINKS = ['home', 'components', 'behaviors', 'themes', 'docs', 'about'];

async function clickNav(page: Page, id: string) {
  // The links live in the off-canvas drawer on mobile (not pointer-actionable),
  // so dispatch the link's own click — it still fires the SPA's navigation
  // handler exactly as a user tap would.
  await page.evaluate((p) => {
    const link = document.querySelector(`.nav__item[href="?page=${p}"]`) as HTMLElement;
    if (!link) throw new Error('nav link not found: ' + p);
    link.click();
  }, id);
  await page.waitForFunction(
    (p) => (window as any).WBSite?.currentPage === p && !!document.querySelector(`#mainPage-${p}`),
    id,
    { timeout: 15000 }
  );
  await page.waitForTimeout(1000); // let the page render to full height + scroll settle
}

async function scrollState(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector('.site__header')!;
    const headerBottom = header.getBoundingClientRect().bottom;
    const main = document.getElementById('main')!;
    // First actually-rendered element (skip <style>/<script>/hidden nodes whose
    // rect is 0,0 and would read as "clipped").
    const first = [...main.querySelectorAll('.page *')].find((el) => {
      const r = el.getBoundingClientRect();
      return r.height > 5 && r.width > 5;
    }) || null;
    const top = first ? first.getBoundingClientRect().top : null;
    return {
      scrollY: window.scrollY,
      headerBottom: Math.round(headerBottom),
      contentTop: top != null ? Math.round(top) : null,
      mainPaddingTop: Math.round(parseFloat(getComputedStyle(main).paddingTop)),
    };
  });
}

test.describe('Nav link scroll behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/?page=home');
    await page.waitForFunction(() => (window as any).WBSite?.currentPage, { timeout: 15000 });
    await page.waitForTimeout(400);
  });

  for (const id of LINKS) {
    test(`first click on "${id}" → top, content ~1rem below the header (not clipped)`, async ({ page }) => {
      await clickNav(page, id);
      const s = await scrollState(page);
      expect(s.scrollY, `${id}: first visit must land at the top`).toBeLessThanOrEqual(2);
      // "1rem down from the top" = the content area starts 1rem below the sticky
      // header. That gap is .site__main's top padding (1rem); each page's first
      // element then sits at/below it (never clipped under the header).
      expect(s.mainPaddingTop, `${id}: content area must start 1rem (16px) below the header`).toBe(16);
      expect(s.contentTop!, `${id}: content must not be clipped under the sticky header`).toBeGreaterThanOrEqual(s.headerBottom - 1);
    });

    test(`returning to "${id}" restores the prior scroll position`, async ({ page }) => {
      await clickNav(page, id);
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(150);
      const before = await page.evaluate(() => window.scrollY);
      test.skip(before < 50, `${id}: page too short to scroll; restore N/A`);

      const other = id === 'home' ? 'components' : 'home';
      await clickNav(page, other);
      await clickNav(page, id);

      const after = await page.evaluate(() => window.scrollY);
      expect(after, `${id}: returning should restore scroll near ${before}, got ${after}`).toBeGreaterThanOrEqual(before - 24);
    });
  }
});
