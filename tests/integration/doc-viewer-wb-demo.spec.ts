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
  { file: 'docs/components/cards/cardlink.md', liveSelector: 'wb-cardlink', label: 'cardlink component doc' },
  { file: 'docs/components/components.md', liveSelector: 'wb-button', label: 'components composition doc', upgradeAttr: 'role' },
  { file: 'docs/components/cards/cardbutton.md', liveSelector: 'wb-cardbutton', label: 'cardbutton component doc' },
  { file: 'docs/components/cards/cardexpandable.md', liveSelector: 'wb-cardexpandable', label: 'cardexpandable component doc' },
  { file: 'docs/components/cards/cardfile.md', liveSelector: 'wb-cardfile', label: 'cardfile component doc' },
  { file: 'docs/components/cards/cardhorizontal.md', liveSelector: 'wb-cardhorizontal', label: 'cardhorizontal component doc' },
  { file: 'docs/components/cards/cardminimizable.md', liveSelector: 'wb-cardminimizable', label: 'cardminimizable component doc' },
  { file: 'docs/components/cards/cardnotification.md', liveSelector: 'wb-cardnotification', label: 'cardnotification component doc' },
  { file: 'docs/components/cards/cardoverlay.md', liveSelector: 'wb-cardoverlay', label: 'cardoverlay component doc' },
  { file: 'docs/components/cards/cardportfolio.md', liveSelector: 'wb-cardportfolio', label: 'cardportfolio component doc' },
  { file: 'docs/components/cards/cardpricing.md', liveSelector: 'wb-cardpricing', label: 'cardpricing component doc' },
  { file: 'docs/components/cards/cardproduct.md', liveSelector: 'wb-cardproduct', label: 'cardproduct component doc' },
  { file: 'docs/components/cards/cardprofile.md', liveSelector: 'wb-cardprofile', label: 'cardprofile component doc' },
  { file: 'docs/components/cards/cardstats.md', liveSelector: 'wb-cardstats', label: 'cardstats component doc' },
  { file: 'docs/components/cards/cardtestimonial.md', liveSelector: 'wb-cardtestimonial', label: 'cardtestimonial component doc' },
  { file: 'docs/components/cards/cardvideo.md', liveSelector: 'wb-cardvideo', label: 'cardvideo component doc' },
  { file: 'docs/components/semantics/audio.md', liveSelector: 'wb-audio', label: 'audio semantics doc' },
  { file: 'docs/components/semantics/code.md', liveSelector: 'code', label: 'code semantics doc', upgradeAttr: 'class' },
  { file: 'docs/components/semantics/details.md', liveSelector: 'wb-details', label: 'details semantics doc' },
  { file: 'docs/components/semantics/dialog.md', liveSelector: 'wb-dialog', label: 'dialog semantics doc' },
  { file: 'docs/components/semantics/form.md', liveSelector: 'wb-form', label: 'form semantics doc' },
  { file: 'docs/components/semantics/img.md', liveSelector: 'img', label: 'img semantics doc', upgradeAttr: 'class' },
  { file: 'docs/components/semantics/input.md', liveSelector: 'wb-input', label: 'input semantics doc' },
  { file: 'docs/components/semantics/checkbox.md', liveSelector: 'wb-checkbox', label: 'checkbox semantics doc' },
  { file: 'docs/components/semantics/switch.md', liveSelector: 'wb-switch', label: 'switch semantics doc' },
  { file: 'docs/components/semantics/select.md', liveSelector: 'wb-select', label: 'select semantics doc' },
  { file: 'docs/components/semantics/rating.md', liveSelector: 'wb-rating', label: 'rating semantics doc' },
  { file: 'docs/components/semantics/textarea.md', liveSelector: 'wb-textarea', label: 'textarea semantics doc' },
  { file: 'docs/components/semantics/video.md', liveSelector: 'wb-video', label: 'video semantics doc' },
  { file: 'docs/components/semantics/button.md', liveSelector: 'wb-button', label: 'button semantics doc', upgradeAttr: 'role' },
  { file: 'docs/components/effects/confetti.md', liveSelector: 'wb-confetti', label: 'confetti effects doc' },
  { file: 'docs/components/effects/fireworks.md', liveSelector: 'wb-fireworks', label: 'fireworks effects doc' },
  { file: 'docs/components/effects/snow.md', liveSelector: 'wb-snow', label: 'snow effects doc' },
  { file: 'docs/components/mdhtml.md', liveSelector: 'wb-mdhtml', label: 'mdhtml component doc' },
  { file: 'docs/components/drawer.md', liveSelector: 'wb-drawer-layout', label: 'drawer component doc' },
  { file: 'docs/components/tabs.md', liveSelector: 'wb-tabs', label: 'tabs component doc' },
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
