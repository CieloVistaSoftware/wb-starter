/**
 * Mobile shell fluency — exercises the REAL SPA shell (index.html?page=…), not
 * the bare /pages/*.html fragments. The fragment-only tests (home-page-permutation,
 * mobile-validation) miss sidebar-induced overflow because partials have no shell.
 *
 * Spec (SCHEMA-SPECIFICATION.md / home-page.md): mobile-first, grid collapses to
 * one column, "fluent layout" with NO horizontal scroll. Runs under the
 * mobile-validation-pixel / -iphone device profiles. (#165)
 */
import { test, expect } from '../fixtures/offline';

const PAGES = [
  { name: 'home', url: '/?page=home' },
  { name: 'behaviors', url: '/?page=behaviors' },
  { name: 'docs', url: '/?page=docs' },
];

test.describe('Mobile shell fluency (real SPA, not fragments)', () => {
  for (const pg of PAGES) {
    test(`no horizontal overflow: ${pg.name}`, async ({ page }) => {
      await page.goto(pg.url);
      await page.locator('.site__main').waitFor({ state: 'attached', timeout: 15000 });
      await page.waitForTimeout(900); // let lazy components hydrate
      const m = await page.evaluate(() => {
        const de = document.documentElement;
        return { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth };
      });
      expect(
        m.scrollWidth,
        `${pg.name}: SPA shell is ${m.scrollWidth - m.clientWidth}px wider than the viewport — horizontal scroll on mobile`
      ).toBeLessThanOrEqual(m.clientWidth + 1);
    });

    // #1432: this used to demand an off-canvas drawer (position:fixed,
    // translated off the left edge). 75350e4e (#293) replaced that on phones
    // with an in-flow menu, hidden until the hamburger opens it, so the test
    // failed on every page while the nav worked as designed. It now checks
    // that design: closed takes no space, open sits in the flow below the
    // header and fits the screen.
    test(`phone nav is hidden until toggled, then in flow and on screen: ${pg.name}`, async ({ page }) => {
      await page.goto(pg.url);
      const nav = page.locator('.site__nav');
      await nav.waitFor({ state: 'attached', timeout: 15000 });
      await expect(nav, `${pg.name}: closed nav takes no space`).toHaveCSS('display', 'none');

      // The shell wires the toggle when it has loaded its first page.
      await page.waitForFunction(() => Boolean((window as any).WBSite?.currentPage), null, { timeout: 15000 });
      await page.locator('#navToggle').click();
      await expect(nav, `${pg.name}: the toggle opens it`).toHaveClass(/site__nav--mobile-open/);
      const box = await nav.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const header = document.querySelector('.site__header')!.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return { position: cs.position, display: cs.display, left: r.left, right: r.right, top: r.top,
          headerBottom: header.bottom, viewport: document.documentElement.clientWidth };
      });
      expect(box.display, `${pg.name}: open nav is shown`).not.toBe('none');
      expect(box.position, `${pg.name}: open nav is in the flow (#293), not a drawer`).toBe('static');
      expect(box.left, `${pg.name}: open nav starts at the left edge`).toBeGreaterThanOrEqual(-1);
      expect(box.right, `${pg.name}: open nav fits the screen`).toBeLessThanOrEqual(box.viewport + 1);
      expect(box.top, `${pg.name}: open nav sits below the header`).toBeGreaterThanOrEqual(box.headerBottom - 1);
    });
  }
});
