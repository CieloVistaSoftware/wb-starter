/**
 * demo.js tags its dynamically-created <pre x-behavior="pre">/<code
 * x-behavior="code"> panel using the generic [x-behavior="name"] attribute
 * convention. wb.js's scan() (the EAGER runtime used by the main SPA's
 * pages/*.html, via ?page=X) never handled that attribute at all -- only
 * wb-lazy.js (used by standalone demos/*.html pages) and wb.js's own
 * observe() MutationObserver (and only for attribute VALUE CHANGES on
 * already-tracked nodes, never a brand-new node arriving with the attribute
 * already set) did.
 *
 * This was invisible for a long time because <pre>/<code> are ALSO in
 * nativeMap, and autoInject used to leak `true` everywhere regardless of a
 * page's real config (see autoinject-default-false.spec.ts) -- so the
 * auto-inject path independently caught every <pre>/<code> tag and papered
 * over this gap. Fixing that default exposed it: every <wb-demo> code panel
 * on the main SPA (autoInject correctly off there, per config/site.json)
 * lost syntax highlighting entirely.
 *
 * Fixed in src/core/wb.js: scan() and observe()'s childList handler now both
 * process [x-behavior="name1 name2"] directly, independent of nativeMap/
 * autoInject.
 */
import { test, expect } from '@playwright/test';

test.describe('wb-demo code panel is syntax-highlighted on the eager (main SPA) runtime', () => {
  test('a <wb-demo> code block on pages/components.html gets real hljs spans', async ({ page }) => {
    await page.goto('/?page=components');
    await page.waitForTimeout(1000);

    const codeEl = page.locator('wb-demo code').first();
    await codeEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    await expect(codeEl).toHaveAttribute('data-highlighted', 'yes');
    await expect(codeEl).toHaveClass(/hljs/);

    const spanCount = await codeEl.locator('span').count();
    expect(spanCount).toBeGreaterThan(0);
  });

  test('multiple <wb-demo> code blocks on the same page all get highlighted', async ({ page }) => {
    test.slow();
    await page.goto('/?page=components');

    // <wb-demo> builds its code panel lazily (IntersectionObserver-gated,
    // a deliberate perf optimization — see demo.js) regardless of which WB
    // runtime the page uses, so only viewport-near panels exist at first.
    // Force several distinct <wb-demo> hosts into view to trigger their
    // build, then verify each one highlights.
    const demoHosts = page.locator('wb-demo');
    // The SPA fetches/injects the page fragment async — wait for the SPA
    // itself to actually finish navigating before expecting any content.
    await expect(demoHosts.first()).toBeAttached({ timeout: 15000 });
    const hostCount = await demoHosts.count();
    expect(hostCount).toBeGreaterThan(5);

    const sampleSize = Math.min(hostCount, 10);
    for (let i = 0; i < sampleSize; i++) {
      await demoHosts.nth(i).scrollIntoViewIfNeeded();
    }

    for (let i = 0; i < sampleSize; i++) {
      const codeInHost = demoHosts.nth(i).locator('code');
      if (await codeInHost.count() === 0) continue; // this demo has no HTML source panel (e.g. non-markup example)
      await expect(codeInHost.first()).toHaveAttribute('data-highlighted', 'yes', { timeout: 8000 });
    }
  });

  test('the pre panel chrome (copy button) also renders via x-behavior="pre"', async ({ page }) => {
    await page.goto('/?page=components');
    await page.waitForTimeout(1000);

    const demo = page.locator('wb-demo').filter({ has: page.locator('pre.wb-demo__code') }).first();
    await demo.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // pre.js's chrome adds a copy button (button.x-pre__copy), positioned as
    // a sibling control alongside <pre>, not necessarily nested inside it.
    const copyButton = demo.locator('.x-pre__copy');
    await expect(copyButton.first()).toBeVisible();
  });
});
