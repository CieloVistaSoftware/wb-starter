/**
 * #617-adjacent cleanup: this suite's own file name and doc comment
 * documented autoInject's default as `false` -- true when this test was
 * written (#328's fix), but John's later, explicit directive ("autoinject
 * should be true for all our demos we should pull away from our wb tags
 * favoring semantic html at all times") flipped the module-level default in
 * src/core/config.js to `true` (commit 5a53a5e), site-wide. This suite's
 * assertions were never updated to match -- confirmed live: every one of
 * these tests failed against current main, asserting the OLD default.
 *
 * Renamed in spirit (kept the filename so existing references/CI config
 * don't break) and inverted to test the CURRENT contract: autoInject
 * defaults to true (both omitted and explicit); a page can still opt out via
 * an explicit `{ autoInject: false }}`.
 *
 * Navigates to tests/fixtures/blank.html (not '/') before setContent() --
 * the real site root runs its own site-engine.js WB.init() call
 * (config/site.json's autoInjectComponents), which races this test's own
 * later WB.init() call and leaks its config into this test's supposedly-
 * isolated page. blank.html has no scripts, so nothing calls WB.init()
 * before this test's own explicit call does.
 */
import { test, expect } from '../fixtures/offline';

async function renderWithWB(page, coreModule: string, initOptions: string) {
  await page.goto('/tests/fixtures/blank.html');
  await page.setContent(`
    <article id="probe-card"><header><h1>Title</h1></header><p>Content</p></article>
    <script type="module">
      import WB from '${coreModule}';
      window.__wb = WB;
      window.__wbDone = false;
      WB.init(${initOptions}).then(() => WB.scan(document.body)).then(() => WB.settled({ timeout: 10000 }).catch(() => {})).then(() => { window.__wbDone = true; });
    </script>
  `);
  await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 15000 }).catch(() => {});
  // __wbDone is set only after WB.settled(), which waits for each lazily observed
  // element's first IntersectionObserver report (#1516: no fixed 800ms settle).
}

// "Was it enhanced?" used to be `toHaveClass(/x-card/)`. Cards stopped
// stamping .x-card onto an <article> (a8a7362e -- card.css matches the tag),
// so that assertion failed on every enhanced card AND passed vacuously on the
// opt-out case, which proved nothing. The behavior's own completion signal is
// x-ready (ready-signal.js stamps it under automation, both runtimes), and an
// element nothing injected into never receives it.
for (const core of ['/src/core/wb.js', '/src/core/wb-lazy.js']) {
  test.describe(`autoInject default (${core})`, () => {
    test('WB.init({}) — omitted entirely — still enhances native elements (default is true)', async ({ page }) => {
      await renderWithWB(page, core, '{}');
      await expect(page.locator('#probe-card')).toHaveAttribute('x-ready', '', { timeout: 10000 });
    });

    test('WB.init({ autoInject: true }) — explicit true — enhances native elements', async ({ page }) => {
      await renderWithWB(page, core, '{ autoInject: true }');
      await expect(page.locator('#probe-card')).toHaveAttribute('x-ready', '', { timeout: 10000 });
    });

    test('WB.init({ autoInject: false }) — explicit false — still lets a page opt out', async ({ page }) => {
      await renderWithWB(page, core, '{ autoInject: false }');
      await expect(page.locator('#probe-card')).not.toHaveAttribute('x-ready');
    });
  });
}
