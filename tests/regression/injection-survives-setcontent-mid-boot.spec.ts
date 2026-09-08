import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#1078, under #961): a behavior stylesheet cancelled mid-load used
 * to poison every later injection of that behavior.
 *
 * `style-loader.js` caches one promise per CSS file, resolved by the `<link>`'s
 * `load` or `error` event. A `<link>` REMOVED before either fires gets neither —
 * the browser just cancels it — so the cached promise stayed pending forever,
 * and `WB.inject()` awaits `ensureBehaviorCss()` before running the behavior.
 * Every subsequent injection of that behavior therefore waited on a corpse.
 *
 * `page.setContent()` wipes `<head>`, which is exactly this, and 29 spec files
 * call it right after a `goto`. Whether a run was poisoned depended only on how
 * far the SPA's boot had got — i.e. on machine load. That is #961's signature.
 *
 * SEEN TO FAIL, 2026-09-08, this exact shape at --repeat-each=6 --workers=6:
 *
 *   1 run in 6 (pre-fix):
 *     {"phase":"imported","pendingCount":23,
 *      "pendingBehaviors":"ripple x14, release, themecontrol, notes,
 *                          button x4, header, footer",
 *      "btnClass":"","links":[]}
 *
 *   `links: []` is the proof — no behavior <link> in the document at all, yet
 *   `button x4` injections in flight. They were awaiting CACHED promises, not
 *   live loads. `WB.init()` never resolved; the page was never built.
 *
 * The wait below is `WB.whenIdle()`, not a sleep: it resolves when the runtime
 * says it has stopped working, and REJECTS (naming the stuck behaviors) if it
 * has not. A sleep here would pass over a half-wedged runtime, which is the
 * habit this whole issue exists to break.
 */
test('a mid-boot setContent does not leave injections stuck forever (#1078)', async ({ page }) => {
  // No settle wait between these two on purpose: setContent must land while the
  // SPA's own boot injections are still in flight. That is the failing case.
  await page.goto('/');
  await page.setContent(`
    <button id="autoBtn">Auto</button>
    <script type="module">
      import WB from '/src/core/wb.js';
      window.__WB = WB;
      window.__done = null;
      WB.init({ autoInject: true })
        .then(() => WB.scan(document.body))
        .then(() => WB.whenIdle({ timeout: 20000 }))
        .then(() => { window.__done = { ok: true, pending: WB.pendingCount }; })
        .catch(e => { window.__done = { ok: false, error: String(e) }; });
    </script>
  `);

  await page.waitForFunction(() => (window as any).__done !== null, { timeout: 30000 });
  const done = await page.evaluate(() => (window as any).__done);

  expect(done.error, 'the runtime never went idle after a mid-boot setContent').toBeUndefined();
  expect(done.pending, 'injections were still in flight once WB reported idle').toBe(0);
  // Idle has to mean BUILT, not merely quiet.
  await expect(page.locator('#autoBtn')).toHaveClass(/x-button/);
  await expect(page.locator('#autoBtn')).toHaveAttribute('x-ready', '');
});
