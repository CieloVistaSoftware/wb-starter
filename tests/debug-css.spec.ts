import { test, expect } from '@playwright/test';

test('debug css loading', async ({ page }) => {
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <link rel="stylesheet" href="/src/styles/behaviors/stock.css">
    </head>
    <body>
      <div id="test" class="wb-stock">Test</div>
      <div id="test-attr" data-wb="stock">Test Attribute</div>
    </body>
    </html>
  `);

  await page.waitForTimeout(1000);

  const paddingClass = await page.evaluate(() => {
    const el = document.getElementById('test');
    return window.getComputedStyle(el).paddingLeft;
  });

  const paddingAttr = await page.evaluate(() => {
    const el = document.getElementById('test-attr');
    return window.getComputedStyle(el).paddingLeft;
  });

  console.log('Padding Class:', paddingClass);
  console.log('Padding Attr:', paddingAttr);

  expect(paddingClass).toBe('16px');
});
