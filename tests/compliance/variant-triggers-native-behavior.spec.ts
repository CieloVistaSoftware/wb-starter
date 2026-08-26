/**
 * A plain <button variant="primary"> is never accidental -- the presence of
 * `variant` is a strong, unambiguous signal of intent on its own, and
 * should trigger the element's mapped native behavior regardless of the
 * global autoInject setting (#328's original fix).
 *
 * #617-adjacent update: autoInject's module-level default flipped from
 * false to true (commit 5a53a5e, John: "autoinject should be true for all
 * our demos") -- so the interesting case that actually exercises this
 * per-element `variant` override is now `{ autoInject: false }` explicitly
 * (with the new default, everything gets enhanced anyway, variant or not).
 * The #328 regression check this suite exists to guard -- a plain
 * <article> with no `variant` must NOT get auto-carded while autoInject is
 * off -- is unaffected by the default flip and still holds with autoInject
 * forced off explicitly.
 *
 * Fixed in src/core/wb.js (scan()'s bulk auto-inject loop, observe()'s
 * descendant loop, and getAutoInjectBehavior()) and src/core/wb-lazy.js
 * (the equivalent three call sites) -- each checks `hasAttribute('variant')`
 * as an OR alongside the getConfig('autoInject') check, per-element, instead
 * of gating the whole loop behind a single global flag.
 *
 * Navigates to tests/fixtures/blank.html (not '/') before setContent() --
 * the real site root runs its own site-engine.js WB.init() call
 * (config/site.json's autoInjectComponents), which races this test's own
 * later WB.init() call and leaks its config into this test's supposedly-
 * isolated page. blank.html has no scripts, so nothing calls WB.init()
 * before this test's own explicit call does.
 */
import { test, expect } from '@playwright/test';

async function renderWithWB(page, coreModule: string, initOptions: string) {
  await page.goto('/tests/fixtures/blank.html');
  await page.setContent(`
    <article id="probe-article"><header><h1>Title</h1></header><p>Content</p></article>
    <button id="probe-button" variant="primary">Click</button>
    <script type="module">
      import WB from '${coreModule}';
      window.__wbDone = false;
      WB.init(${initOptions}).then(() => WB.scan(document.body)).then(() => { window.__wbDone = true; });
    </script>
  `);
  await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800); // wb-lazy.js queues into its IntersectionObserver
}

for (const core of ['/src/core/wb.js', '/src/core/wb-lazy.js']) {
  test.describe(`variant triggers native behavior regardless of autoInject (${core})`, () => {
    test('a plain <button variant="primary"> gets its variant class even with autoInject explicitly off', async ({ page }) => {
      await renderWithWB(page, core, '{ autoInject: false }');
      await expect(page.locator('#probe-button')).toHaveClass(/x-button--primary/);
    });

    test('a plain <article> (no variant) is still NOT auto-carded with autoInject off -- no #328 regression', async ({ page }) => {
      await renderWithWB(page, core, '{ autoInject: false }');
      await expect(page.locator('#probe-article')).not.toHaveClass(/x-card/);
    });
  });
}
