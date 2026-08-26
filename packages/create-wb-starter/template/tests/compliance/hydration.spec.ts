import { test, expect } from '@playwright/test';

// #562: this used to `page.goto()` the bare fragment directly
// (http://localhost:3000/pages/components.html) instead of through the SPA
// shell (`/?page=components`, the pattern every other compliance spec uses --
// see hero-no-nested-sections.spec.ts, footer-viewport-anchor.spec.ts,
// stock-indicator-spacing.spec.ts). pages/components.html's own <audio
// src="demos/sample.wav"> is intentionally base-relative (#531/9b183bc --
// absolute breaks under GitHub Pages' /wb-starter/ sub-path), which only
// resolves correctly when the fragment is loaded at the site root. Navigated
// to directly, "demos/sample.wav" resolved against /pages/ instead of /,
// 404'd, and x-audio logged a real runtime error to the SHARED
// data/errors.json on every compliance run -- exactly the false-failure
// source error-log-empty.spec.ts (#562) was tripping over. Going through the
// SPA route renders the identical fragment from the correct base, with no
// side-effect page-load error.
test.describe('Runtime hydration markers', () => {
  test('x-mdhtml sets hydration marker when present', async ({ page }) => {
    await page.goto('/?page=components', { waitUntil: 'networkidle' });
    const md = page.locator('x-mdhtml').first();
    const count = await md.count();
    test.skip(count === 0, 'x-mdhtml example not present');
    // Wait for x-mdhtml to report hydrated (fallback to class removal)
    await page.waitForFunction(sel => {
      const el = document.querySelector(sel);
      return !!el && (el.dataset.wbHydrated === '1' || !el.classList.contains('x-mdhtml--loading'));
    }, 'x-mdhtml', { timeout: 5000 });
    const hydrated = await md.evaluate(el => el.dataset.wbHydrated === '1' || !el.classList.contains('x-mdhtml--loading'));
    expect(hydrated).toBe(true);
  });

  test('x-cardstats marks hydrated when present', async ({ page }) => {
    await page.goto('/?page=components', { waitUntil: 'networkidle' });
    const stats = page.locator('x-cardstats').first();
    const count = await stats.count();
    test.skip(count === 0, 'x-cardstats example not present');
    await page.waitForFunction(sel => {
      const el = document.querySelector(sel);
      return !!el && (el.dataset.wbHydrated === '1' || el.classList.contains('x-stats'));
    }, 'x-cardstats', { timeout: 4000 });
    const hydrated = await stats.evaluate(el => el.dataset.wbHydrated === '1' || el.classList.contains('x-stats'));
    expect(hydrated).toBe(true);
  });
});
