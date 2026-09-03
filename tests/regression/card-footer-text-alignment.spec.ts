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
 * `class="x-card__footer .x-footer"`. footer.css's `.x-footer` sets
 * `display:flex; align-items:center`, and at <=768px switches to
 * `flex-direction:column` -- which turns the footer's own text content into
 * a single anonymous flex item and CENTERS it via flexbox `align-items`, a
 * completely different mechanism from `text-align`. That is exactly why the
 * prior investigation's `getComputedStyle().textAlign` check found nothing
 * wrong: it correctly read "left" the entire time. Confirmed live
 * (pages/behaviors.html's "This is the title" / "This is the footer"
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
  // #953: was `x-card[title=...][footer=...]`, a TAG selector for a card that
  // used to sit on pages/behaviors.html. There are no custom element tags
  // (Law 0) -- querySelectorAll('x-card') returns 0 -- and that page no longer
  // carries the card at all, so it is authored here on its semantic host.
  {
    selector: '#footer-repro-card',
    inject: `<article x-card id="footer-repro-card" title="This is the title" footer="This is the footer"></article>`,
  },
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
      // #953: behaviors.html was rebuilt into a searchable browser and no
      // longer hosts these cards. cards.html is a real served page with
      // autoInject on, which the header above rightly insists is required --
      // the isolated harness never reproduces the collision.
      await page.goto('/demos/site/cards.html');
      await waitForWB(page);
    });

    for (const { selector, inject } of VARIANTS) {
      test(`${selector}: footer text bounding box hugs the left edge, not centered`, async ({ page }) => {
        if (inject) {
          await page.evaluate(async (html) => {
            const holder = document.createElement('div');
            holder.innerHTML = html;
            const el = holder.firstElementChild as HTMLElement;
            // #953: was '#autogen-components-html-0', which no longer exists
            // -- every injected variant died on null.appendChild.
            document.body.appendChild(el);
            if ((window as any).WB?.scan) {
              // #953: eager. cards.html boots wb-lazy.js, whose plain scan()
              // only registers an IntersectionObserver -- an element appended
              // below the fold of a long page never upgrades, so the card
              // existed but never built its .x-card__footer.
              await (window as any).WB.scan(el, { eager: true });
            }
          }, inject);
        }

        const card = page.locator(selector).first();
        await expect(card).toHaveCount(1);
        const footer = card.locator('.x-card__footer').first();
        await expect(footer).toHaveCount(1);

        // #953: this used to assert the collision STILL fires -- that a card's
        // <footer> also picks up the site-chrome `.x-footer`. It no longer
        // does: the generic footer behavior now skips footers a card built, so
        // #350's cause is fixed structurally rather than out-specified by
        // `.x-card__footer.x-footer` in card.css. The header above authorised
        // relaxing this ("that's fine and this assertion should be relaxed"),
        // with the caveat that it must not start passing for the wrong reason.
        //
        // So it is INVERTED rather than deleted, and paired with a control: a
        // card footer must not carry .x-footer, AND a bare <footer> on this
        // same page must -- otherwise this would pass simply because
        // auto-injection had stopped running at all.
        await expect(footer).not.toHaveClass(/\bx-footer\b/);
        const chrome = await page.evaluate(async () => {
          const bare = document.createElement('footer');
          bare.id = 'footer-repro-chrome-control';
          bare.textContent = 'site chrome footer';
          document.body.appendChild(bare);
          if ((window as any).WB?.scan) await (window as any).WB.scan(bare, { eager: true });
          await new Promise((r) => setTimeout(r, 300));
          const cls = bare.className;
          bare.remove();
          return cls;
        });
        expect(chrome, 'the generic footer behavior must still be live on this page')
          .toMatch(/\bx-footer\b/);

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
