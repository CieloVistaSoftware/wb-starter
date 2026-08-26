import { test, expect } from '@playwright/test';

/**
 * #323: docs/behaviors-reference.md must follow DEMOS-AND-DOCS-STANDARDS.md §1/§16 —
 * every component example is a live <div x-demo> (renders the control AND shows its
 * source), never a static, non-live code fence.
 *
 * This file has MANY <div x-demo> blocks (intro syntax examples + a "Live Examples"
 * subsection per behavior category) on ONE doc page, unlike the one-file-one-case
 * pattern in doc-viewer-wb-demo.spec.ts. Everything below runs against a SINGLE
 * page load (not one goto() per behavior) for two reasons:
 *   1. It mirrors what a real reader does — load the page once, scroll through it.
 *   2. 20+ separate page loads of the same heavy page, running concurrently across
 *      Playwright's parallel workers, was measurably flaky (occasional timeouts
 *      under CPU contention, confirmed by re-running: same assertion passed in 2s
 *      once contention eased). One shared load removes that contention instead of
 *      papering over it with longer timeouts.
 *
 * <div x-demo> (src/wb-viewmodels/x-demo.js) only builds its first EAGER_BUILD_COUNT=5
 * blocks synchronously on connect — every block after that is deferred behind an
 * IntersectionObserver (rootMargin 400px) so a long, many-demo page doesn't build
 * 30+ syntax-highlighted panels no one has scrolled to yet. This test scrolls the
 * whole page in a few large steps up front so every block builds before assertions.
 *
 * Note: the two "Auto Injection" demos (bare <dialog>, bare <img>) are excluded from
 * the upgrade-check CASES below — that section documents a feature that is "optional
 * and disabled by default" (WB.init({ scan:false, observe:false }) on the doc-viewer
 * never passes autoInject:true), so those two elements aren't expected to upgrade on
 * this page; the "every <div x-demo> has a grid + source" check still covers them.
 */

type Case = { selector: string; label: string; upgradeAttr?: string };
const CASES: Case[] = [
  { selector: '.x-audio', label: 'audio' },
  { selector: '.x-video', label: 'video' },
  { selector: 'img[x-image]', label: 'img/image', upgradeAttr: 'class' },
  { selector: 'code[x-code]', label: 'code', upgradeAttr: 'class' },
  { selector: '[x-input]', label: 'input' },
  { selector: '.x-textarea', label: 'textarea' },
  { selector: '.x-select', label: 'select' },
  { selector: '[x-checkbox]', label: 'checkbox' },
  { selector: '[x-switch]', label: 'switch' },
  { selector: '[x-rating]', label: 'rating' },
  // x-details is replaced in the DOM with a real native <details class="x-details">
  // (element.replaceWith(), matching x-form's own documented pattern) -- the
  // x-details TAG never exists post-upgrade, so select by the class it carries.
  { selector: 'details.x-details', label: 'details' },
  { selector: '.x-dialog', label: 'dialog' },
  { selector: '.x-button', label: 'button', upgradeAttr: 'role' },
  { selector: '.x-card', label: 'card' },
  { selector: '[x-cardlink]', label: 'cardlink' },
  { selector: 'progress', label: 'progressbar' },
  { selector: '[x-tabs]', label: 'tabs' },
  { selector: '[x-drawer-layout]', label: 'drawerLayout' },
  { selector: '[x-carddraggable]', label: 'draggable' },
  { selector: '[x-themecontrol]', label: 'themecontrol' },
  { selector: '[x-mdhtml]', label: 'mdhtml' },
  { selector: '[x-confetti]', label: 'confetti' },
];

test.describe('docs/behaviors-reference.md: live <div x-demo> examples', () => {
  test('every <div x-demo> renders live + source, and the added Live Examples upgrade', async ({ page }) => {
    test.setTimeout(90000);

    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(String(e)));

    await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/behaviors-reference.md'), {
      waitUntil: 'domcontentloaded',
    });

    const demos = page.locator('[x-demo]');
    await expect(demos.first().locator('.x-demo__grid')).toBeVisible({ timeout: 20000 });

    const count = await demos.count();
    // The doc has 32 <div x-demo> blocks as of this test's writing (5 intro/auto-inject
    // examples + 27 "Live Examples" entries across the 6 categories). Assert a floor
    // rather than an exact count so future additions don't need this test touched.
    expect(count).toBeGreaterThanOrEqual(30);

    // Scroll the whole page in a handful of large steps so every deferred
    // <div x-demo> passes through the IntersectionObserver's 400px rootMargin and
    // starts building — what a real reader scrolling the page would trigger.
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = page.viewportSize()?.height || 800;
    const stepSize = Math.max(1, Math.floor(viewportHeight * 0.85));
    for (let y = 0; y <= scrollHeight; y += stepSize) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(150);
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(150);
    await page.evaluate(() => window.scrollTo(0, 0));

    // §1/§16: every <div x-demo> shows both a live grid and its source panel.
    for (let i = 0; i < count; i++) {
      const demo = demos.nth(i);
      await expect(demo.locator('.x-demo__grid')).toBeVisible({ timeout: 10000 });
      await expect(demo.locator('.x-demo__code, pre').first()).toBeVisible();
    }

    // Spot-check that the added "Live Examples" actually upgraded (real behavior
    // ran), not just inert markup sitting inside a <div x-demo> wrapper.
    for (const c of CASES) {
      const live = page.locator(`[x-demo] .x-demo__grid ${c.selector}`).first();
      await expect(live, `${c.label} live example should be visible`).toBeVisible({ timeout: 5000 });

      if (c.upgradeAttr) {
        await expect
          .poll(() => live.getAttribute(c.upgradeAttr as string), {
            message: `${c.label}: [${c.upgradeAttr}] should be set (upgraded)`,
            timeout: 5000,
          })
          .toBeTruthy();
      } else {
        await expect
          .poll(() => live.evaluate((el) => el.children.length), {
            message: `${c.label}: should render internal DOM (upgraded)`,
            timeout: 5000,
          })
          .toBeGreaterThan(0);
      }
    }

    expect(errs, 'no page errors while rendering docs/behaviors-reference.md').toEqual([]);
  });
});
