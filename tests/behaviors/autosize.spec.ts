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

  await page.waitForFunction(() => document.querySelector('#as-1 textarea')?.dataset.wbAutosize === '1', null, { timeout: 2000 });
  const ta = page.locator('#as-1 textarea');
  expect(await ta.getAttribute('data-wb-autosize')).toBe('1');
});