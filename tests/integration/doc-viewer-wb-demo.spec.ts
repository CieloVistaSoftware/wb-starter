import { test, expect } from '@playwright/test';

/**
 * A raw <wb-demo> embedded directly in a Markdown doc must render in the viewer:
 * the LIVE control on top, its SOURCE code underneath. Authors get "both the
 * rendered view and the code" from one tag — no ```demo fence needed.
 *
 * The doc-viewer boots WB whenever a rendered doc contains any <wb-*> element or
 * x-* behavior (not only for ```demo fences), which is what makes this work.
 */
type Case = { file: string; liveSelector: string; label: string };
const CASES: Case[] = [
  { file: 'docs/behaviors/wb-demo.md', liveSelector: 'wb-button', label: 'wb-demo behavior doc' },
  { file: 'docs/components/cards/cardhero.md', liveSelector: 'wb-cardhero', label: 'cardhero component doc' },
];

test.describe('raw <wb-demo> in Markdown renders live control + source', () => {
  for (const c of CASES) {
    test(`${c.label}: <wb-demo> upgrades and shows both`, async ({ page }) => {
      const errs: string[] = [];
      page.on('pageerror', (e) => errs.push(String(e)));

      await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent(c.file), {
        waitUntil: 'domcontentloaded',
      });

      // wb-demo upgraded → it builds a live grid + a source panel.
      const demo = page.locator('wb-demo').first();
      await expect(demo.locator('.wb-demo__grid')).toBeVisible({ timeout: 20000 });
      await expect(demo.locator('.wb-demo__code, pre').first()).toBeVisible();

      // The live control actually rendered (upgraded custom element, not inert markup).
      const live = demo.locator(`.wb-demo__grid ${c.liveSelector}`).first();
      await expect(live).toBeVisible();
      const childCount = await live.evaluate((el) => el.children.length);
      expect(childCount, `${c.liveSelector} should have rendered internal DOM`).toBeGreaterThan(0);

      expect(errs, `no page errors while rendering ${c.file}`).toEqual([]);
    });
  }
});
