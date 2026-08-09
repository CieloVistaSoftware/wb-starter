/**
 * autoInject correctly defaults to false (#328). But a plain
 * <button variant="primary"> is never accidental -- the presence of
 * `variant` is a strong, unambiguous signal of intent on its own, and
 * should trigger the element's mapped native behavior regardless of the
 * global autoInject setting.
 *
 * Without this, pages/behaviors.html's entire Buttons section (and every
 * other bare variant-styled native element on that page) rendered with
 * zero classes and zero styling -- confirmed live: every button variant
 * showed the identical flat, unstyled background. John: "if the keyword
 * variant is seen then the colors should automatically show up."
 *
 * Fixed in src/core/wb.js (scan()'s bulk auto-inject loop, observe()'s
 * descendant loop, and getAutoInjectBehavior()) and src/core/wb-lazy.js
 * (the equivalent three call sites) -- each now checks `hasAttribute
 * ('variant')` as an OR alongside the getConfig('autoInject') check,
 * per-element, instead of gating the whole loop behind a single global
 * flag. autoInject itself still defaults to false and stays false for
 * every element that has no `variant` attribute -- confirmed no leak of
 * #328's bug: a plain <article> (no variant) still does NOT get
 * auto-carded when autoInject is off.
 *
 * Navigates to tests/fixtures/blank.html (not '/') before setContent() --
 * the real site root runs its own site-engine.js WB.init() call
 * (config/site.json's autoInjectComponents, true as of #279), which raced
 * this test's own later WB.init() call and leaked its config into this
 * test's supposedly-isolated page. blank.html has no scripts, so nothing
 * calls WB.init() before this test's own explicit call does.
 */
import { test, expect } from '@playwright/test';

async function renderWithWB(page, coreModule: string) {
  await page.goto('/tests/fixtures/blank.html');
  await page.setContent(`
    <article id="probe-article"><header><h1>Title</h1></header><p>Content</p></article>
    <button id="probe-button" variant="primary">Click</button>
    <script type="module">
      import WB from '${coreModule}';
      window.__wbDone = false;
      WB.init({}).then(() => WB.scan(document.body)).then(() => { window.__wbDone = true; });
    </script>
  `);
  await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800); // wb-lazy.js queues into its IntersectionObserver
}

for (const core of ['/src/core/wb.js', '/src/core/wb-lazy.js']) {
  test.describe(`variant triggers native behavior regardless of autoInject (${core})`, () => {
    test('a plain <button variant="primary"> gets its variant class with autoInject off (default)', async ({ page }) => {
      await renderWithWB(page, core);
      await expect(page.locator('#probe-button')).toHaveClass(/wb-button--primary/);
    });

    test('a plain <article> (no variant) is still NOT auto-carded with autoInject off -- no #328 regression', async ({ page }) => {
      await renderWithWB(page, core);
      await expect(page.locator('#probe-article')).not.toHaveClass(/wb-card/);
    });
  });
}
