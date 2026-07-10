import { test, expect } from '@playwright/test';

/**
 * A raw <wb-demo> embedded directly in a Markdown doc must render in the viewer:
 * the LIVE control on top, its SOURCE code underneath. Authors get "both the
 * rendered view and the code" from one tag — no ```demo fence needed.
 *
 * The doc-viewer boots WB whenever a rendered doc contains any <wb-*> element or
 * x-* behavior (not only for ```demo fences), which is what makes this work.
 */
// Most components build real internal DOM structure on upgrade, so
// children.length > 0 is a solid "did it actually upgrade" proxy. wb-button
// is the exception: its behavior (src/wb-viewmodels/semantics/button.js)
// deliberately does NO DOM restructuring for a plain-text button — no icon,
// no loading state, so no child spans — it only sets tabindex/role="button"
// on the element itself. Element children were only ever added by a
// competing schema $view that has since been removed as a duplicate/buggy
// renderer (see button.schema.json's _view_note). For wb-button, checking
// role="button" is the correct "did it upgrade" signal instead.
type Case = { file: string; liveSelector: string; label: string; upgradeAttr?: string };
const CASES: Case[] = [
  { file: 'docs/behaviors/wb-demo.md', liveSelector: 'wb-button', label: 'wb-demo behavior doc', upgradeAttr: 'role' },
  { file: 'docs/components/cards/cardhero.md', liveSelector: 'wb-cardhero', label: 'cardhero component doc' },
  { file: 'docs/components/cards/card.md', liveSelector: 'wb-card', label: 'card component doc' },
  { file: 'docs/behaviors/wb-column.md', liveSelector: 'wb-column', label: 'wb-column behavior doc' },
  { file: 'docs/components/cards/carddraggable.md', liveSelector: 'wb-carddraggable', label: 'carddraggable component doc' },
  { file: 'docs/components/components.md', liveSelector: 'wb-button', label: 'components composition doc', upgradeAttr: 'role' },
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
      // Poll rather than read once — some components (e.g. carddraggable) upgrade a
      // beat later, which made a one-shot childCount read flaky.
      const live = demo.locator(`.wb-demo__grid ${c.liveSelector}`).first();
      await expect(live).toBeVisible();
      if (c.upgradeAttr) {
        await expect
          .poll(() => live.getAttribute(c.upgradeAttr as string), {
            message: `${c.liveSelector} should have [${c.upgradeAttr}] set (upgraded)`,
            timeout: 10000,
          })
          .toBeTruthy();
      } else {
        await expect
          .poll(() => live.evaluate((el) => el.children.length), {
            message: `${c.liveSelector} should render internal DOM (upgraded)`,
            timeout: 10000,
          })
          .toBeGreaterThan(0);
      }

      expect(errs, `no page errors while rendering ${c.file}`).toEqual([]);
    });
  }
});
