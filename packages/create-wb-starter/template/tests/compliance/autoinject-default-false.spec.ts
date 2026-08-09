/**
 * autoInject's documented default is false ("semantic HTML stays semantic
 * until a page opts in") — but wb.js/wb-lazy.js's init() only ever wrote
 * `true` to config.js when the caller passed autoInject:true, and NEVER
 * wrote `false` for the omitted/false case, so config.js's own module-level
 * default (previously hardcoded `true`) silently won regardless of what a
 * page passed or omitted. Confirmed live: the main SPA's own
 * config/site.json sets autoInjectComponents to false, and site-engine.js
 * passes it straight into WB.init({ autoInject: false }) — yet every native
 * <article>/<button>/<img>/... on every page was auto-enhanced anyway.
 *
 * Fixed in src/core/wb.js, src/core/wb-lazy.js (init() now unconditionally
 * writes its resolved value) and src/core/config.js (module default
 * corrected to false, matching the documented contract).
 *
 * Navigates to tests/fixtures/blank.html (not '/') before setContent() --
 * the real site root runs its own site-engine.js WB.init() call
 * (config/site.json's autoInjectComponents, true as of #279), which raced
 * this test's own later WB.init() call and leaked its config into this
 * test's supposedly-isolated page. blank.html has no scripts, so nothing
 * calls WB.init() before this test's own explicit call does.
 */
import { test, expect } from '@playwright/test';

async function renderWithWB(page, coreModule: string, initOptions: string) {
  await page.goto('/tests/fixtures/blank.html');
  await page.setContent(`
    <article id="probe-card"><header><h1>Title</h1></header><p>Content</p></article>
    <script type="module">
      import WB from '${coreModule}';
      window.__wb = WB;
      window.__wbDone = false;
      WB.init(${initOptions}).then(() => WB.scan(document.body)).then(() => { window.__wbDone = true; });
    </script>
  `);
  await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 15000 }).catch(() => {});
  // wb-lazy.js's scan() resolves once an element is QUEUED for its
  // IntersectionObserver, not once it's actually enhanced -- checking the
  // class immediately after __wbDone vacuously passed the "should NOT be
  // enhanced" assertions (the class simply hadn't arrived YET, not "never
  // will"). Settle time here matches the wait used elsewhere in this suite
  // after scan() calls against wb-lazy.js fixtures.
  await page.waitForTimeout(800);
}

for (const core of ['/src/core/wb.js', '/src/core/wb-lazy.js']) {
  test.describe(`autoInject default (${core})`, () => {
    test('WB.init({}) — omitted entirely — leaves native elements unenhanced', async ({ page }) => {
      await renderWithWB(page, core, '{}');
      await expect(page.locator('#probe-card')).not.toHaveClass(/wb-card/);
    });

    test('WB.init({ autoInject: false }) — explicit false — leaves native elements unenhanced', async ({ page }) => {
      await renderWithWB(page, core, '{ autoInject: false }');
      await expect(page.locator('#probe-card')).not.toHaveClass(/wb-card/);
    });

    test('WB.init({ autoInject: true }) — explicit true — still enhances native elements', async ({ page }) => {
      await renderWithWB(page, core, '{ autoInject: true }');
      await expect(page.locator('#probe-card')).toHaveClass(/wb-card/, { timeout: 10000 });
    });
  });
}
