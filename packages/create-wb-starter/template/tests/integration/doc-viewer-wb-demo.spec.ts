import { test, expect } from '@playwright/test';

/**
 * A raw <div x-demo> embedded directly in a Markdown doc must render in the viewer:
 * the LIVE control on top, its SOURCE code underneath. Authors get "both the
 * rendered view and the code" from one tag — no ```demo fence needed.
 *
 * The doc-viewer boots WB whenever a rendered doc contains any <wb-*> element or
 * x-* behavior (not only for ```demo fences), which is what makes this work.
 */
// Most behaviors build real internal DOM structure on upgrade, so
// children.length > 0 is a solid "did it actually upgrade" proxy. x-button
// is the exception: its behavior (src/wb-viewmodels/semantics/button.js)
// deliberately does NO DOM restructuring for a plain-text button — no icon,
// no loading state, so no child spans — it only sets tabindex/role="button"
// on the element itself. Element children were only ever added by a
// competing schema $view that has since been removed as a duplicate/buggy
// renderer (see button.schema.json's _view_note). For x-button, checking
// role="button" is the correct "did it upgrade" signal instead.
type Case = { file: string; liveSelector: string; label: string; upgradeAttr?: string };
const CASES: Case[] = [
  { file: 'docs/behaviors/x-demo.md', liveSelector: 'x-button', label: 'x-demo behavior doc', upgradeAttr: 'role' },
  { file: 'docs/behaviors/cards/cardhero.md', liveSelector: 'x-cardhero', label: 'cardhero behavior doc' },
  { file: 'docs/behaviors/cards/card.md', liveSelector: 'x-card', label: 'card behavior doc' },
  { file: 'docs/behaviors/x-column.md', liveSelector: 'x-column', label: 'x-column behavior doc' },
  { file: 'docs/behaviors/cards/carddraggable.md', liveSelector: 'x-carddraggable', label: 'carddraggable behavior doc' },
  { file: 'docs/behaviors/cards/cardlink.md', liveSelector: 'x-cardlink', label: 'cardlink behavior doc' },
  { file: 'docs/behaviors/behaviors.md', liveSelector: 'x-button', label: 'behaviors composition doc', upgradeAttr: 'role' },
  { file: 'docs/behaviors/cards/cardbutton.md', liveSelector: 'x-cardbutton', label: 'cardbutton behavior doc' },
  { file: 'docs/behaviors/cards/cardexpandable.md', liveSelector: 'x-cardexpandable', label: 'cardexpandable behavior doc' },
  { file: 'docs/behaviors/cards/cardfile.md', liveSelector: 'x-cardfile', label: 'cardfile behavior doc' },
  { file: 'docs/behaviors/cards/cardhorizontal.md', liveSelector: 'x-cardhorizontal', label: 'cardhorizontal behavior doc' },
  { file: 'docs/behaviors/cards/cardminimizable.md', liveSelector: 'x-cardminimizable', label: 'cardminimizable behavior doc' },
  { file: 'docs/behaviors/cards/cardnotification.md', liveSelector: 'x-cardnotification', label: 'cardnotification behavior doc' },
  { file: 'docs/behaviors/cards/cardoverlay.md', liveSelector: 'x-cardoverlay', label: 'cardoverlay behavior doc' },
  { file: 'docs/behaviors/cards/cardportfolio.md', liveSelector: 'x-cardportfolio', label: 'cardportfolio behavior doc' },
  { file: 'docs/behaviors/cards/cardpricing.md', liveSelector: 'x-cardpricing', label: 'cardpricing behavior doc' },
  { file: 'docs/behaviors/cards/cardproduct.md', liveSelector: 'x-cardproduct', label: 'cardproduct behavior doc' },
  { file: 'docs/behaviors/cards/cardprofile.md', liveSelector: 'x-cardprofile', label: 'cardprofile behavior doc' },
  { file: 'docs/behaviors/cards/cardstats.md', liveSelector: 'x-cardstats', label: 'cardstats behavior doc' },
  { file: 'docs/behaviors/cards/cardtestimonial.md', liveSelector: 'x-cardtestimonial', label: 'cardtestimonial behavior doc' },
  { file: 'docs/behaviors/cards/cardvideo.md', liveSelector: 'x-cardvideo', label: 'cardvideo behavior doc' },
  { file: 'docs/behaviors/semantics/audio.md', liveSelector: 'x-audio', label: 'audio semantics doc' },
  { file: 'docs/behaviors/semantics/code.md', liveSelector: 'code', label: 'code semantics doc', upgradeAttr: 'class' },
  { file: 'docs/behaviors/semantics/details.md', liveSelector: 'details', label: 'details semantics doc' },
  { file: 'docs/behaviors/semantics/dialog.md', liveSelector: 'x-dialog', label: 'dialog semantics doc' },
  { file: 'docs/behaviors/semantics/form.md', liveSelector: 'form', label: 'form semantics doc' },
  { file: 'docs/behaviors/semantics/img.md', liveSelector: 'img', label: 'img semantics doc', upgradeAttr: 'class' },
  { file: 'docs/behaviors/semantics/input.md', liveSelector: 'x-input', label: 'input semantics doc' },
  { file: 'docs/behaviors/semantics/checkbox.md', liveSelector: 'x-checkbox', label: 'checkbox semantics doc' },
  { file: 'docs/behaviors/semantics/switch.md', liveSelector: 'x-switch', label: 'switch semantics doc' },
  { file: 'docs/behaviors/semantics/select.md', liveSelector: 'x-select', label: 'select semantics doc' },
  { file: 'docs/behaviors/semantics/rating.md', liveSelector: 'x-rating', label: 'rating semantics doc' },
  { file: 'docs/behaviors/semantics/textarea.md', liveSelector: 'x-textarea', label: 'textarea semantics doc' },
  { file: 'docs/behaviors/semantics/video.md', liveSelector: 'x-video', label: 'video semantics doc' },
  { file: 'docs/behaviors/semantics/button.md', liveSelector: 'x-button', label: 'button semantics doc', upgradeAttr: 'role' },
  { file: 'docs/behaviors/effects/confetti.md', liveSelector: 'x-confetti', label: 'confetti effects doc' },
  { file: 'docs/behaviors/effects/fireworks.md', liveSelector: 'x-fireworks', label: 'fireworks effects doc' },
  { file: 'docs/behaviors/effects/snow.md', liveSelector: 'x-snow', label: 'snow effects doc' },
  { file: 'docs/behaviors/mdhtml.md', liveSelector: 'x-mdhtml', label: 'mdhtml behavior doc' },
  { file: 'docs/behaviors/drawer.md', liveSelector: 'x-drawer-layout', label: 'drawer behavior doc' },
  { file: 'docs/behaviors/tabs.md', liveSelector: 'x-tabs', label: 'tabs behavior doc' },
  { file: 'docs/behaviors/x-cluster.md', liveSelector: '.x-cluster', label: 'x-cluster behavior doc' },
  { file: 'docs/behaviors/x-row.md', liveSelector: '.x-row', label: 'x-row behavior doc' },
  { file: 'docs/behaviors/x-stack.md', liveSelector: '.x-stack', label: 'x-stack behavior doc' },
  { file: 'docs/behaviors/x-audio.md', liveSelector: 'x-audio', label: 'x-audio behavior doc' },
  { file: 'docs/behaviors/help.md', liveSelector: 'span', label: 'help behavior doc', upgradeAttr: 'class' },
  { file: 'docs/behaviors/tooltip.md', liveSelector: 'button', label: 'tooltip behavior doc', upgradeAttr: 'aria-describedby' },
];

test.describe('raw <div x-demo> in Markdown renders live control + source', () => {
  for (const c of CASES) {
    test(`${c.label}: <div x-demo> upgrades and shows both`, async ({ page }) => {
      const errs: string[] = [];
      page.on('pageerror', (e) => errs.push(String(e)));

      await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent(c.file), {
        waitUntil: 'domcontentloaded',
      });

      // x-demo upgraded → it builds a live grid + a source panel.
      const demo = page.locator('x-demo').first();
      await expect(demo.locator('.x-demo__grid')).toBeVisible({ timeout: 20000 });
      await expect(demo.locator('.x-demo__code, pre').first()).toBeVisible();

      // The live control actually rendered (upgraded custom element, not inert markup).
      // Poll rather than read once — some behaviors (e.g. carddraggable) upgrade a
      // beat later, which made a one-shot childCount read flaky.
      const live = demo.locator(`.x-demo__grid ${c.liveSelector}`).first();
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
