import { test, expect } from '@playwright/test';

test('autosize modifier adjusts textarea and marks element', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 5000 });

  await page.evaluate(() => {
    const c = document.createElement('div');
    c.id = 'as-1';
    c.innerHTML = '<textarea x-autosize>foo</textarea>';
    document.body.appendChild(c);
    if ((window as any).WB?.scan) (window as any).WB.scan(c);
  });

  // autosize.js marks the element with a plain x-autosize-init attribute
  // (v3 convention), not a data-* attribute — the old data-wb-autosize
  // assertion predates that naming and no longer matches reality.
  await page.waitForFunction(() => document.querySelector('#as-1 textarea')?.getAttribute('x-autosize-init') === '1', null, { timeout: 2000 });
  const ta = page.locator('#as-1 textarea');
  expect(await ta.getAttribute('x-autosize-init')).toBe('1');
});