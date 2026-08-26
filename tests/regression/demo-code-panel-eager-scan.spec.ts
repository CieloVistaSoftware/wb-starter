import { test, expect } from '@playwright/test';

/**
 * demo.js builds its "view source" <pre x-behavior="pre"><code
 * x-behavior="code">...</code></pre> panel synchronously, then called
 * `await window.WB.scan(pre)` with NO eager option -- await WB.scan()'s default lazy
 * path defers [x-behavior] elements to an IntersectionObserver instead of
 * applying them synchronously. Confirmed live on public/doc-viewer.html:
 * the nested <code> got its hljs syntax highlighting while the wrapping
 * <pre> sat with no `x-pre` class at the same snapshot -- an
 * indeterminate, inconsistent delay for content that's already
 * synchronously appended to the DOM (no actual lazy-load benefit).
 */
async function ready(page) {
  await page.goto('/demos/site/overlays.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
}

test('[x-demo] code panel is fully styled immediately, not lazily', async ({ page }) => {
  await ready(page);
  const pre = page.locator('.x-demo__code').first();
  await expect(pre).toBeVisible({ timeout: 5000 });
  // Both the pre AND its nested code must be processed within a short,
  // deterministic window -- not "eventually, whenever the observer fires".
  await expect(pre).toHaveClass(/x-pre/, { timeout: 1500 });
  const code = pre.locator('code').first();
  await expect(code).toHaveClass(/hljs/, { timeout: 1500 });
});
