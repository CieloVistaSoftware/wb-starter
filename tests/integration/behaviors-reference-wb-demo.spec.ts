import { test, expect } from '@playwright/test';

/**
 * #323: docs/behaviors-reference.md must follow DEMOS-AND-DOCS-STANDARDS.md §1/§16 —
 * every component example is a live <wb-demo> (renders the control AND shows its
 * source), never a static, non-live code fence.
 *
 * This file has MANY <wb-demo> blocks (intro syntax examples + a "Live Examples"
 * subsection per behavior category), unlike the one-file-one-case pattern in
 * doc-viewer-wb-demo.spec.ts. So this spec:
 *   1. Confirms every <wb-demo> on the page renders both the live grid AND the
 *      source code panel (the mechanical §1/§16 requirement), with no page errors.
 *   2. Spot-checks a representative subset of the added live examples to confirm
 *      they actually upgraded (real behavior ran), not just inert markup sitting
 *      inside a <wb-demo> wrapper.
 *
 * Note: the two "Auto Injection" demos (bare <dialog>, bare <img>) intentionally
 * are NOT in the upgrade-check subset — that section documents a feature that is
 * "optional and disabled by default" (WB.init({ scan:false, observe:false }) on
 * the doc-viewer never passes autoInject:true), so those two elements are not
 * expected to upgrade on this page; they still satisfy §1 (live render + source).
 *
 * Every check here scrolls its target into view first. <wb-demo> (src/wb-viewmodels/
 * wb-demo.js) only builds its first EAGER_BUILD_COUNT=5 blocks synchronously on
 * connect — every block after that is deferred behind an IntersectionObserver
 * (rootMargin 400px) so a long, many-demo page doesn't build 30+ syntax-highlighted
 * panels no one has scrolled to yet. With 32 blocks on this page, most of them are
 * only built once scrolled near — asserting visibility without scrolling first
 * would just time out waiting for a build that correctly never starts.
 */

test.describe('docs/behaviors-reference.md: live <wb-demo> examples', () => {
  test('every <wb-demo> renders both a live grid and a source panel, no page errors', async ({ page }) => {
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(String(e)));

    await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/behaviors-reference.md'), {
      waitUntil: 'domcontentloaded',
    });

    const demos = page.locator('wb-demo');
    await expect(demos.first().locator('.wb-demo__grid')).toBeVisible({ timeout: 20000 });

    const count = await demos.count();
    // The doc has 32 <wb-demo> blocks as of this test's writing (5 intro/auto-inject
    // examples + 27 "Live Examples" entries across the 6 categories). Assert a floor
    // rather than an exact count so future additions don't need this test touched.
    expect(count).toBeGreaterThanOrEqual(30);

    // Scroll the whole page in a handful of large steps so every deferred
    // <wb-demo> passes through the IntersectionObserver's 400px rootMargin and
    // starts building. Doing this once, in a few jumps, is what a real reader
    // scrolling the page would trigger — 32 individual scrollIntoViewIfNeeded()
    // + per-element waits was correct but slow enough (each build does real
    // DOM writes + a highlight pass) to occasionally miss this test's overall
    // timeout under parallel load; this reaches the same end state much faster.
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

    for (let i = 0; i < count; i++) {
      const demo = demos.nth(i);
      await expect(demo.locator('.wb-demo__grid')).toBeVisible({ timeout: 10000 });
      await expect(demo.locator('.wb-demo__code, pre').first()).toBeVisible();
    }

    expect(errs, 'no page errors while rendering docs/behaviors-reference.md').toEqual([]);
  });

  type Case = { selector: string; label: string; upgradeAttr?: string };
  const CASES: Case[] = [
    { selector: 'wb-audio', label: 'audio live example' },
    { selector: 'wb-video', label: 'video live example' },
    { selector: 'img[x-image]', label: 'img/image live example', upgradeAttr: 'class' },
    { selector: 'code[x-code]', label: 'code live example', upgradeAttr: 'class' },
    { selector: 'wb-input', label: 'input live example' },
    { selector: 'wb-textarea', label: 'textarea live example' },
    { selector: 'wb-select', label: 'select live example' },
    { selector: 'wb-checkbox', label: 'checkbox live example' },
    { selector: 'wb-switch', label: 'switch live example' },
    { selector: 'wb-rating', label: 'rating live example' },
    // wb-details is replaced in the DOM with a real native <details
    // class="wb-details"> (element.replaceWith(), matching wb-form's own
    // documented pattern) -- the wb-details TAG never exists post-upgrade,
    // so select by the class the replacement carries instead.
    { selector: 'details.wb-details', label: 'details live example' },
    { selector: 'wb-dialog', label: 'dialog live example' },
    { selector: 'wb-button', label: 'button live example', upgradeAttr: 'role' },
    { selector: 'wb-card', label: 'card live example' },
    { selector: 'wb-cardlink', label: 'cardlink live example' },
    { selector: 'wb-progress', label: 'progressbar live example' },
    { selector: 'wb-tabs', label: 'tabs live example' },
    { selector: 'wb-drawer-layout', label: 'drawerLayout live example' },
    { selector: 'wb-carddraggable', label: 'draggable live example' },
    { selector: 'wb-themecontrol', label: 'themecontrol live example' },
    { selector: 'wb-mdhtml', label: 'mdhtml live example' },
    { selector: 'wb-confetti', label: 'confetti live example' },
  ];

  for (const c of CASES) {
    test(`${c.label}: upgrades inside its <wb-demo>`, async ({ page }) => {
      await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/behaviors-reference.md'), {
        waitUntil: 'domcontentloaded',
      });

      // Scroll the *raw* <wb-demo> (has: selector still matches pre-build markup)
      // into view first so its lazy build actually starts.
      const container = page.locator('wb-demo', { has: page.locator(c.selector) }).first();
      await container.scrollIntoViewIfNeeded();

      const live = container.locator(`.wb-demo__grid ${c.selector}`).first();
      await expect(live).toBeVisible({ timeout: 20000 });

      if (c.upgradeAttr) {
        await expect
          .poll(() => live.getAttribute(c.upgradeAttr as string), {
            message: `${c.selector} should have [${c.upgradeAttr}] set (upgraded)`,
            timeout: 10000,
          })
          .toBeTruthy();
      } else {
        await expect
          .poll(() => live.evaluate((el) => el.children.length), {
            message: `${c.selector} should render internal DOM (upgraded)`,
            timeout: 10000,
          })
          .toBeGreaterThan(0);
      }
    });
  }
});
