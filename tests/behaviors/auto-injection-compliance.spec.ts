import { test, expect } from '@playwright/test';

/**
 * Auto-injection compliance. (#277)
 *
 * These tests use page.setContent(), so the page MUST first navigate to the
 * server — otherwise the base URL is about:blank and the `<script type="module">
 * import WB from '/src/core/wb.js'</script>` never resolves (WB never loads, and
 * "should NOT have class" assertions pass vacuously). We goto a served page first,
 * then setContent, then wait for hydration.
 */
async function renderWithWB(page, bodyHtml: string) {
  await page.goto('/'); // establishes http://localhost origin so absolute imports resolve
  await page.setContent(`
    ${bodyHtml}
    <script type="module">
      import WB from '/src/core/wb.js';
      window.__wbReady = WB.init({ autoInject: true }).then(() => WB.scan(document.body)).then(() => { window.__wbDone = true; });
    </script>
  `);
  await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 15000 }).catch(() => {});
}

test.describe('Auto-Injection Compliance', () => {
  test('Explicit <wb-card> IS a Card', async ({ page }) => {
    await renderWithWB(page, `<wb-card id="explicit-card"><header><h1>Title</h1></header><p>Content</p></wb-card>`);
    await expect(page.locator('#explicit-card')).toHaveClass(/wb-card/, { timeout: 10000 });
  });

  test('Native <dialog> is enhanced with wb-dialog', async ({ page }) => {
    await renderWithWB(page, `<dialog id="auto-dialog">Content</dialog>`);
    await expect(page.locator('#auto-dialog')).toHaveClass(/wb-dialog/, { timeout: 10000 });
  });

  // Native <nav> → navbar auto-injection is NOT yet a decided contract: `nav` is
  // not in nativeMap, and turning every <nav> (incl. the site's own
  // <nav class="site__nav">) into a navbar needs the design decision in #277/#276.
  test.fixme('Native <nav> should be auto-injected as Navbar (#277)', async ({ page }) => {
    await renderWithWB(page, `<nav id="auto-nav"><ul><li><a href="#">Link</a></li></ul></nav>`);
    await expect(page.locator('#auto-nav')).toHaveClass(/wb-navbar/, { timeout: 10000 });
  });
});
