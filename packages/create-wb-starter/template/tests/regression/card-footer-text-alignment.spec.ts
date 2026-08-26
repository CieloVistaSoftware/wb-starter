import { test, expect } from '@playwright/test';
import { waitForWB } from '../base';

/**
 * #350: John reported a card footer's text ("This is the footer") rendering
 * visually CENTERED, despite `.x-card__footer { text-align: left; }`
 * (card.css). A prior investigation checked `getComputedStyle(footer)
 * .textAlign` (correctly "left") and bounding-rect measurements on desktop
 * viewports and could not reproduce it -- closed as "needs repro details."
 *
 * Root cause (found via a fresh trace, not a guess -- Law 7): card.js
 * documents `<footer>` as the correct semantic tag for a card's footer
 * ("Footer content (actions, buttons): <footer>"), and every variant that
 * uses `base.createFooter()` (cardBase, card.js) literally
 * `document.createElement('footer')`s it and classes it `.x-card__footer`.
 * But WB's generic native-tag auto-injection (tag-map.js: `'footer':
 * 'footer'`, gated behind config/site.json's `autoInjectComponents: true`,
 * which the real site enables) scans EVERY bare `<footer>` tag on the page
 * -- including one a card already built and classed itself -- and
 * unconditionally runs the SITE-CHROME footer behavior (footer.js) on it,
 * which adds a second class: `.x-footer`. So a card's footer ends up
 * `class="x-card__footer x-footer"`. footer.css's `.x-footer` sets
 * `display:flex; align-items:center`, and at <=768px switches to
 * `flex-direction:column` -- which turns the footer's own text content into
 * a single anonymous flex item and CENTERS it via flexbox `align-items`, a
 * completely different mechanism from `text-align`. That is exactly why the
 * prior investigation's `getComputedStyle().textAlign` check found nothing
 * wrong: it correctly read "left" the entire time. Confirmed live
 * (pages/components.html's "This is the title" / "This is the footer"
 * card, the only place that exact footer text exists) at a 500px viewport:
 * leftGap and rightGap were both ~124.6px -- genuinely centered -- despite
 * computed text-align:left.
 *
 * This is a class-name collision between card.js's semantic `<footer>` and
 * WB's generic native-tag footer behavior, not a text-align bug at all --
 * the same collision pattern card.js's cardprofile already works around for
 * `<header>` (see its "a literal <header> tag is auto-injected as the SITE
 * header behavior" comment) just never got applied to `<footer>`.
 *
 * IMPORTANT: this only reproduces on a page where `autoInjectComponents` is
 * on (config/site.json -- the real served site). The isolated behavior-test
 * harness (index.html, tests/base.ts's setupTestContainer) does NOT load
 * that config, so `autoInject` defaults to false there and the collision
 * never fires -- confirmed by running this test against index.html first
 * and seeing the `.x-footer` class never get added. Using a real served
 * page is required for a faithful repro, not a stylistic choice.
 *
 * Fix (card.css): `.x-card__footer.x-footer` (0,2,0 specificity, always
 * beats `.x-footer`'s 0,1,0 regardless of viewport/media-query) reasserts
 * the card's own block layout and left alignment.
 *
 * This test asserts the actual rendered TEXT POSITION via bounding-box
 * measurement, not just computed text-align, per the issue's own lesson
 * that computed style alone can be misleading here.
 */
const VARIANTS = [
  // The exact real card from the report -- already on the page, no
  // synthetic injection needed.
  { selector: 'x-card[title="This is the title"][footer="This is the footer"]', inject: null },
  {
    selector: '#footer-repro-cardprofile',
    inject: `<div x-cardprofile id="footer-repro-cardprofile" title="This is the title" name="Jane Doe" footer="This is the footer"></div>`,
  },
  {
    selector: '#footer-repro-carddraggable',
    inject: `<div x-carddraggable id="footer-repro-carddraggable" title="This is the title" footer="This is the footer"></div>`,
  },
];

const VIEWPORTS = [
  { width: 1280, height: 800, label: 'desktop' },
  { width: 500, height: 900, label: 'mobile (<=768px breakpoint)' },
];

for (const { width, height, label } of VIEWPORTS) {
  test.describe(`card footer text stays left-aligned at ${label} (#350)`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/pages/components.html');
      await waitForWB(page);
    });

    for (const { selector, inject } of VARIANTS) {
      test(`${selector}: footer text bounding box hugs the left edge, not centered`, async ({ page }) => {
        if (inject) {
          await page.evaluate(async (html) => {
            const holder = document.createElement('div');
            holder.innerHTML = html;
            const el = holder.firstElementChild as HTMLElement;
            document.querySelector('#autogen-components-html-0')!.appendChild(el);
            if ((window as any).WB?.scan) {
              await (window as any).WB.scan(el);
            }
          }, inject);
        }

        const card = page.locator(selector).first();
        await expect(card).toHaveCount(1);
        const footer = card.locator('.x-card__footer').first();
        await expect(footer).toHaveCount(1);

        // Confirm this test actually exercises the #350 collision -- the
        // generic native-tag scanner should still be adding .x-footer
        // alongside .x-card__footer. If this ever stops being true (e.g.
        // tag-map.js changes to skip nested/already-classed footers), that's
        // fine and this assertion should be relaxed -- but it should not
        // silently start passing for a different reason than the fix below.
        await expect(footer).toHaveClass(/\bwb-footer\b/);

        const { leftGap, rightGap, textAlign } = await footer.evaluate((node) => {
          const rect = node.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(node);
          const textRect = range.getBoundingClientRect();
          return {
            leftGap: textRect.left - rect.left,
            rightGap: rect.right - textRect.right,
            textAlign: getComputedStyle(node).textAlign,
          };
        });

        // Sanity check only -- #350's whole lesson is that this alone is
        // NOT sufficient proof of left alignment (it reads "left" even in
        // the broken/centered state, since the real mechanism was flexbox
        // align-items, not text-align).
        expect(textAlign).toBe('left');

        // The real check: the text must hug the left padding, with visibly
        // more empty space on the right than the left. A centered footer
        // has leftGap ~= rightGap (confirmed live: both ~124.6px at 500px
        // wide before the fix); a left-aligned one does not.
        expect(leftGap).toBeLessThan(24);
        expect(rightGap - leftGap).toBeGreaterThan(30);
      });
    }
  });
}
