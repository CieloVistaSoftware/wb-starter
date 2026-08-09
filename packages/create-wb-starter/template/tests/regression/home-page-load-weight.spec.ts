import { test, expect } from '@playwright/test';

/**
 * #390: the home page's initial load was measured firing 150+ individual
 * network requests. Traced (not guessed) to src/core/wb-views.js's
 * loadViewsFromURL(), called unconditionally by every page's
 * WBSite.init() (site-engine.js), which eagerly fetched EVERY registered
 * view's template HTML immediately — including the whole page-builder
 * partial library (20+ files: hero-cosmic.html, pricing-three-tier.html,
 * testimonials-grid.html, landing-agency.html, ...) that the home page
 * itself never renders a single one of.
 *
 * Fixed in wb-views.js: registry-URL views now register their template
 * URL in `pendingViewUrls` instead of fetching immediately; the actual
 * fetch happens lazily in `ensureViewLoaded()`, called right before a
 * `<wb-view>`/registered-tag element is first rendered. A page that uses
 * none of the partial-library views (home) now fetches none of them.
 * Measured after the fix: request count dropped from ~150-200 to ~82.
 *
 * This regression test locks the fix in place — it must stay green.
 * (Unbundled ES modules are a deliberate architecture choice, not the
 * target here — "just HTML, no build step" is the whole pitch — so the
 * request-count ceiling below has headroom for that; it exists to catch
 * the *unnecessary* eager-fetch class of bug coming back, not to push
 * toward bundling.)
 */
test.describe('home page load weight (#390)', () => {
  test('loading "/" does not fetch the page-builder partial library', async ({ page }) => {
    const partialRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/src/wb-views/partials/')) {
        partialRequests.push(req.url());
      }
    });

    await page.goto('/');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
    await page.waitForTimeout(500);

    expect(partialRequests).toEqual([]);
  });

  test('loading "/" does not fetch a DIFFERENT page\'s HTML fragment or page-specific CSS', async ({ page }) => {
    const offPageRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      // Home's own fragment/CSS (pages/home.html, styles/pages/home.css) is
      // expected and excluded -- only a request for a DIFFERENT page's
      // resources indicates the bug this test guards against.
      if (/\/pages\/(?!home\.html)[a-z-]+\.html/.test(url) || /\/src\/styles\/pages\/(?!home\.css)[a-z-]+\.css/.test(url)) {
        offPageRequests.push(url);
      }
    });

    await page.goto('/');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
    await page.waitForTimeout(500);

    expect(offPageRequests).toEqual([]);
  });

  test('loading "/" fires fewer than 100 total requests', async ({ page }) => {
    let count = 0;
    page.on('request', () => { count++; });

    await page.goto('/');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
    await page.waitForTimeout(500);

    // Measured after the fix: ~82. 100 leaves headroom for incidental
    // variance (image/schema counts) without masking a real regression --
    // the pre-fix baseline was ~150-200, so this still catches that class
    // of bug coming back.
    expect(count).toBeLessThan(100);
  });

  test('loading "/" fires the window load event in under 2000ms', async ({ page }) => {
    // John's explicit ceiling: nothing over 2000ms on reload. Measured
    // clean (no contending background processes) after the #390 fix:
    // ~170-200ms. Uses the real Navigation Timing API (loadEventEnd),
    // not a wall-clock stopwatch around page.goto() -- that would also
    // count Playwright/CDP overhead that has nothing to do with the page
    // itself loading.
    await page.goto('/');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });

    const loadEventEnd = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return nav.loadEventEnd;
    });

    expect(loadEventEnd).toBeLessThan(2000);
  });
});
