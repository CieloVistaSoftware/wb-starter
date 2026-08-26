import { test, expect } from '@playwright/test';

/**
 * REGRESSION: semantics/code.js's fallback highlight.js theme loader (used
 * before codecontrol.js takes over, if it's present on the page at all)
 * built a cdnjs.cloudflare.com URL from WHATEVER theme id was saved in
 * localStorage['x-code-theme'] -- but a handful of codecontrol.js's
 * CODE_THEMES entries (e.g. "x-grayscale-dark") are WB's own local themes,
 * not real highlight.js CDN theme names. Selecting one of those produced a
 * confirmed-live 404 (x-grayscale-dark.min.css never existed on cdnjs)
 * instead of the actual local file at src/styles/code-themes/.
 */
test('saved local code theme (e.g. x-grayscale-dark) resolves to its local path, not a broken CDN URL', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('x-code-theme', 'x-grayscale-dark'));
  await page.setContent(`
    <link rel="stylesheet" href="/src/styles/themes.css">
    <link rel="stylesheet" href="/src/styles/site.css">
    <pre><code class="language-js">const x = 1;</code></pre>
    <script type="module">
      import WB from '/src/core/wb.js';
      window.__wbDone = false;
      WB.init({ autoInject: true }).then(() => WB.scan(document.body)).then(() => { window.__wbDone = true; });
    </script>
  `);
  await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 30000 });

  const link = page.locator('link[data-highlight-theme]');
  const href = await link.getAttribute('href');

  expect(href, 'must not build a broken cdnjs URL for a local-only theme id').not.toContain('cdnjs.cloudflare.com');
  expect(href, 'must resolve to the real local theme file').toContain('/src/styles/code-themes/x-grayscale-dark.css');

  // The referenced stylesheet must actually exist -- not just point somewhere
  // plausible-looking.
  const response = await page.request.get(href!);
  expect(response.status(), 'the local theme file itself must actually serve').toBe(200);
});

test('a real CDN theme id still builds a cdnjs URL as before', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('x-code-theme', 'monokai'));
  await page.setContent(`
    <link rel="stylesheet" href="/src/styles/themes.css">
    <link rel="stylesheet" href="/src/styles/site.css">
    <pre><code class="language-js">const x = 1;</code></pre>
    <script type="module">
      import WB from '/src/core/wb.js';
      window.__wbDone = false;
      WB.init({ autoInject: true }).then(() => WB.scan(document.body)).then(() => { window.__wbDone = true; });
    </script>
  `);
  await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 30000 });

  const href = await page.locator('link[data-highlight-theme]').getAttribute('href');
  expect(href, 'a genuine CDN theme id must still resolve to cdnjs, not be misrouted').toBe(
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/monokai.min.css'
  );
});
