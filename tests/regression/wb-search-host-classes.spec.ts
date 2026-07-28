import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#359): <wb-search variant="glass"> with no pre-existing
 * <input> child never got wb-search/wb-search--<variant> classes on the
 * HOST element -- searchField() (src/wb-viewmodels/search.js) creates the
 * inner <input> and delegates entirely to search(input, ...), which only
 * classes whatever element it was given. The inner <input> got the right
 * classes; the outer <wb-search> tag stayed classless. CSS rules targeting
 * the variant directly on the host (as opposed to the
 * .wb-search--<variant> .wb-search__wrapper descendant form) silently never
 * applied -- e.g. variant="minimal" and other host-level styling.
 */
test('<wb-search variant> classes the host element, not just the inner input (#359)', async ({ page }) => {
  await page.goto('/');
  await page.setContent(`
    <link rel="stylesheet" href="/src/styles/themes.css">
    <link rel="stylesheet" href="/src/styles/site.css">
    <wb-search variant="glass" size="lg" id="wbs">Glass search</wb-search>
    <script type="module">
      import WB from '/src/core/wb.js';
      window.__wbDone = false;
      WB.init({ autoInject: true }).then(() => WB.scan(document.body)).then(() => { window.__wbDone = true; });
    </script>
  `);
  await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 30000 });

  const host = page.locator('#wbs');
  await expect(host, 'host element must get the base wb-search class').toHaveClass(/(^|\s)wb-search(\s|$)/, { timeout: 10000 });
  await expect(host, 'host element must get the variant modifier class').toHaveClass(/wb-search--glass/);
  await expect(host, 'host element must get the size modifier class').toHaveClass(/wb-search--lg/);

  // The inner input should still get its own classes too -- this is an
  // addition, not a replacement of the existing (already-working) behavior.
  const input = host.locator('input');
  await expect(input).toHaveClass(/wb-search__input/);
});
