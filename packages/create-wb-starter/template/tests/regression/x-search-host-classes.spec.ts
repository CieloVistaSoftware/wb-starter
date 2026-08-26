import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#359): <div x-searchfield variant="glass"> with no pre-existing
 * <input> child never got x-search/x-search--<variant> classes on the
 * HOST element -- searchField() (src/wb-viewmodels/search.js) creates the
 * inner <input> and delegates entirely to search(input, ...), which only
 * classes whatever element it was given. The inner <input> got the right
 * classes; the outer <div x-searchfield> tag stayed classless. CSS rules targeting
 * the variant directly on the host (as opposed to the
 * .x-search--<variant> .x-search__wrapper descendant form) silently never
 * applied -- e.g. variant="minimal" and other host-level styling.
 */
test('<div x-searchfield variant> classes the host element, not just the inner input (#359)', async ({ page }) => {
  await page.goto('/');
  await page.setContent(`
    <link rel="stylesheet" href="/src/styles/themes.css">
    <link rel="stylesheet" href="/src/styles/site.css">
    <div x-searchfield variant="glass" size="lg" id="wbs">Glass search</div>
    <script type="module">
      import WB from '/src/core/wb.js';
      window.__wbDone = false;
      WB.init({ autoInject: true }).then(() => WB.scan(document.body)).then(() => { window.__wbDone = true; });
    </script>
  `);
  await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 30000 });

  const host = page.locator('#wbs');
  await expect(host, 'host element must get the base x-search class').toHaveClass(/(^|\s)x-search(\s|$)/, { timeout: 10000 });
  await expect(host, 'host element must get the variant modifier class').toHaveClass(/x-search--glass/);
  await expect(host, 'host element must get the size modifier class').toHaveClass(/x-search--lg/);

  // The inner input should still get its own classes too -- this is an
  // addition, not a replacement of the existing (already-working) behavior.
  const input = host.locator('input');
  await expect(input).toHaveClass(/x-search__input/);
});
