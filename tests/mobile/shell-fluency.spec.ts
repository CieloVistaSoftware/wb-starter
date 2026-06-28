/**
 * Mobile shell fluency — exercises the REAL SPA shell (index.html?page=…), not
 * the bare /pages/*.html fragments. The fragment-only tests (home-page-permutation,
 * mobile-validation) miss sidebar-induced overflow because partials have no shell.
 *
 * Spec (SCHEMA-SPECIFICATION.md / home-page.md): mobile-first, grid collapses to
 * one column, "fluent layout" with NO horizontal scroll. Runs under the
 * mobile-validation-pixel / -iphone device profiles. (#165)
 */
import { test, expect } from '@playwright/test';

const PAGES = [
  { name: 'home', url: 'http://localhost:3000/?page=home' },
  { name: 'components', url: 'http://localhost:3000/?page=components' },
  { name: 'docs', url: 'http://localhost:3000/?page=docs' },
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

    test(`sidebar is off-canvas (hidden, not just fixed) on mobile: ${pg.name}`, async ({ page }) => {
      await page.goto(pg.url);
      const nav = page.locator('.site__nav');
      await nav.waitFor({ state: 'attached', timeout: 15000 });
      await page.waitForTimeout(700); // let the drawer settle off-screen
      const box = await nav.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { right: r.right, position: getComputedStyle(el).position };
      });
      expect(box.position, `${pg.name}: sidebar must be position:fixed`).toBe('fixed');
      // The closed drawer must be translated OFF the left edge — not a visible
      // strip overlapping content (the #165 regression).
      expect(
        box.right,
        `${pg.name}: closed sidebar drawer must be off-screen (right<=1), was ${Math.round(box.right)}`
      ).toBeLessThanOrEqual(1);
    });
  }
});
