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
 * over this gap. Fixing that default exposed it: every <div x-demo> code panel
 * on the main SPA (autoInject correctly off there, per config/site.json)
 * lost syntax highlighting entirely.
 *
 * Fixed in src/core/wb.js: scan() and observe()'s childList handler now both
 * process [x-behavior="name1 name2"] directly, independent of nativeMap/
 * autoInject.
 */
import { test, expect } from '@playwright/test';

test.describe('[x-demo] code panel is syntax-highlighted on the eager (main SPA) runtime', () => {
  test('a <div x-demo> code block on pages/demos.html gets real hljs spans', async ({ page }) => {
    await page.goto('/?page=demos');
    await page.waitForTimeout(1000);

    const codeEl = page.locator('[x-demo] code').first();
    await codeEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    await expect(codeEl).toHaveAttribute('data-highlighted', 'yes');
    await expect(codeEl).toHaveClass(/hljs/);

    const spanCount = await codeEl.locator('span').count();
    expect(spanCount).toBeGreaterThan(0);
  });

  test('multiple <div x-demo> code blocks on the same page all get highlighted', async ({ page }) => {
    test.slow();
    await page.goto('/?page=demos');

    // <div x-demo> builds its code panel lazily (IntersectionObserver-gated,
    // a deliberate perf optimization — see demo.js) regardless of which WB
    // runtime the page uses, so only viewport-near panels exist at first.
    // Force several distinct <div x-demo> hosts into view to trigger their
    // build, then verify each one highlights.
    const demoHosts = page.locator('[x-demo]');
    // The SPA fetches/injects the page fragment async — wait for the SPA
    // itself to actually finish navigating before expecting any content.
    await expect(demoHosts.first()).toBeAttached({ timeout: 15000 });
    const hostCount = await demoHosts.count();
    // The guard only ensures the page has enough demos for "multiple" to mean
    // something — the real assertion is the loop below, which checks EVERY
    // host highlights. The old >5 was calibrated to components.html, which no
    // longer exists; pages/demos.html carries 4.
    expect(hostCount, 'need at least two demos for this to test anything').toBeGreaterThan(1);

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
    await page.goto('/?page=demos');
    await page.waitForTimeout(1000);

    // pages/demos.html groups its demos inside <details class="demos-category">
    // accordions, which start CLOSED. A descendant of a closed <details> keeps
    // reporting display/visibility/opacity as visible and a non-zero
    // offsetWidth, so the usual style probes all say "fine" — but
    // checkVisibility() (what Playwright actually uses) is false. Open the
    // accordion first, the same thing a reader does.
    //
    // The panel itself is then built lazily (IntersectionObserver, see
    // demo.js), so a locator filtered on `pre.x-demo__code` matches nothing
    // until a demo has been scrolled into view. The original test only passed
    // because a demo happened to sit near the top of the old, un-grouped
    // page — an ordering assumption that broke when the page changed.
    for (const details of await page.locator('details.demos-category').all()) {
      await details.evaluate((el: HTMLDetailsElement) => { el.open = true; });
    }

    const firstDemo = page.locator('[x-demo]').first();
    await expect(firstDemo).toBeAttached({ timeout: 15000 });
    await firstDemo.scrollIntoViewIfNeeded();

    const panel = firstDemo.locator('pre.x-demo__code');
    await expect(panel.first()).toBeAttached({ timeout: 10000 });

    // pre.js's chrome adds a copy button, button.x-pre__copy.
    const copyButton = firstDemo.locator('.x-pre__copy');
    await expect(copyButton.first()).toBeVisible({ timeout: 10000 });
  });
});
