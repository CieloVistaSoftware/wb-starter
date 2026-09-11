import { test, expect } from '@playwright/test';

test('debug css loading', async ({ page }) => {
  // #1091 — this file matched no project until now, so it had never run once,
  // and it could not have passed: setContent() does NOT navigate. The document
  // stays wherever the page already is (about:blank on a fresh context), so the
  // root-relative href below resolved against about:blank, no stylesheet was
  // ever fetched, and paddingLeft read 0px. stock.css is fine and always was --
  // `.x-stock { padding-left: 1rem }` is right there in the file.
  //
  // Landing on the dev server first gives the relative URL an origin to resolve
  // against. Nothing about the page matters, only its base URL.
  await page.goto('/');
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <link rel="stylesheet" href="/src/styles/behaviors/stock.css">
    </head>
    <body>
      <div id="test" class="x-stock">Test</div>
      <div id="test-attr">Test Attribute</div>
    </body>
    </html>
  `);

  // Wait for the thing being measured rather than a second of wall clock: a
  // timer either wastes the second or is too short on a cold cache.
  await page.waitForFunction(
    () => [...document.styleSheets].some((sheet) => {
      if (!(sheet.href || '').includes('stock.css')) return false;
      try { return sheet.cssRules.length > 0; } catch { return false; }
    }),
    null,
    { timeout: 10000 },
  );

  const paddingClass = await page.evaluate(() => {
    const el = document.getElementById('test')!;
    return window.getComputedStyle(el).paddingLeft;
  });

  const paddingAttr = await page.evaluate(() => {
    const el = document.getElementById('test-attr')!;
    return window.getComputedStyle(el).paddingLeft;
  });

  console.log('Padding Class:', paddingClass);
  console.log('Padding Attr:', paddingAttr);

  expect(paddingClass).toBe('16px');
});
