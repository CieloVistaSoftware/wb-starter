/**
 * Nav link scroll behavior (#165 follow-up).
 *
 * Spec:
 *  - Clicking a nav link the FIRST time lands the page at the top, with its
 *    content ~1rem below the sticky header (not scrolled under it).
 *  - Returning to a page you've already visited restores the scroll position
 *    you left it at.
 *
 * #siteBody is the scroll container (.site is 100dvh, overflow hidden; #1186),
 * and scroll memory lives on the in-memory site-engine instance, so navigation must be SPA (clicking nav links), never a
 * full reload — a reload would reset the memory.
 */
import { test, expect, Page } from '../fixtures/offline';
import fs from 'node:fs';
import { pagePath } from '../helpers/page-path';

// #1432: read from the site's own menu. A hard-coded list kept 'components',
// which 4.0.0 removed, so 14 tests failed on "nav link not found" and the
// pages added since (releases, issues, ...) were never checked.
const LINKS: string[] = JSON.parse(fs.readFileSync('config/site.json', 'utf8'))
  .navigationMenu.map((item: { pageToLoad?: string }) => item.pageToLoad)
  .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0);

/** Navigates; returns #siteBody's scrollTop at the instant of the click (#1462). */
async function clickNav(page: Page, id: string): Promise<number> {
  // The links live in the off-canvas drawer on mobile (not pointer-actionable),
  // so dispatch the link's own click — it still fires the SPA's navigation
  // handler exactly as a user tap would. The scroll offset is read in the same
  // task as the click: that is the moment the site remembers, and a page still
  // building can move between a separate read and the click.
  const leftAt = await page.evaluate(({ p, href }) => {
    const link = document.querySelector(`.nav__item[href="${href}"]`) as HTMLElement;
    if (!link) throw new Error('nav link not found: ' + p);
    const y = document.getElementById('siteBody')!.scrollTop;
    link.click();
    return y;
  }, { p: id, href: pagePath(id) });
  await page.waitForFunction(
    (p) => (window as any).WBSite?.currentPage === p && !!document.querySelector(`#mainPage-${p}`),
    id,
    { timeout: 15000 }
  );
  await page.waitForTimeout(1000); // let the page render to full height + scroll settle
  return leftAt;
}

// #1462: three navigations (15s + 1s each) and a 15s restore poll is 63s of
// named waits. Under the default 30s test timeout a slow step died as an
// anonymous "Test timeout of 30000ms exceeded" before its own wait could say
// which step it was.
const RETURN_TEST_BUDGET = 3 * (15000 + 1000) + 15000 + 10000;

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
      scrollY: document.getElementById('siteBody')!.scrollTop,
      headerBottom: Math.round(headerBottom),
      contentTop: top != null ? Math.round(top) : null,
      mainPaddingTop: Math.round(parseFloat(getComputedStyle(main).paddingTop)),
      // 1rem as this page computes it: the root font is not 16px on every
      // device (18px on the phone profiles), so a literal 16 is not 1rem.
      oneRem: Math.round(parseFloat(getComputedStyle(document.documentElement).fontSize)),
    };
  });
}

test.describe('Nav link scroll behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?page=home');
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
      // The Behaviors page halves it on a phone on purpose: its example has to
      // start right under the header (src/styles/pages/behaviors.css, "Main's
      // 1rem top padding sat between the header and the example").
      const gap = id === 'behaviors' ? s.oneRem / 2 : s.oneRem;
      expect(s.mainPaddingTop, `${id}: content area must start ${gap}px below the header`).toBe(Math.round(gap));
      expect(s.contentTop!, `${id}: content must not be clipped under the sticky header`).toBeGreaterThanOrEqual(s.headerBottom - 1);
    });

    test(`returning to "${id}" restores the prior scroll position`, async ({ page }) => {
      test.setTimeout(RETURN_TEST_BUDGET);
      await clickNav(page, id);
      // No sleep (#1516): the site reads siteBody.scrollTop when it leaves the page.
      await page.evaluate(() => { document.getElementById('siteBody')!.scrollTop = 400; });

      const other = id === 'home' ? LINKS.find((l) => l !== 'home')! : 'home';
      const before = await clickNav(page, other);
      test.skip(before < 50, `${id}: page too short to scroll; restore N/A`);
      const remembered = await page.evaluate((p) => (window as any).WBSite._scrollMemory?.[p], id);
      expect(remembered, `${id}: the site must remember the offset it was left at`).toBe(before);
      await clickNav(page, id);

      // Polled, not read once after a fixed sleep: a page that builds
      // asynchronously (Behaviors loads its catalogue first) is restored as it
      // grows, and under a parallel run that took longer than the sleep (#1432).
      const state = () => page.evaluate(() => {
        const sb = document.getElementById('siteBody')!;
        return `scrollTop ${sb.scrollTop}, scrollHeight ${sb.scrollHeight}, clientHeight ${sb.clientHeight}`;
      });
      await expect.poll(
        () => page.evaluate(() => document.getElementById('siteBody')!.scrollTop),
        { timeout: 15000, message: `${id}: returning should restore scroll near ${before}` },
      ).toBeGreaterThanOrEqual(before - 24).catch(async (e) => {
        // #1462: CI once read 0 for the full 15s. Say what the page looked like.
        throw new Error(`${e.message}\n(${id} at failure: ${await state()})`);
      });
    });
  }
});
