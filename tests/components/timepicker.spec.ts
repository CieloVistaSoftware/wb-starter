import { test, expect } from '@playwright/test';

test('timepicker registers and marks element', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 5000 });

  await page.evaluate(() => {
    const el = document.createElement('input');
    el.id = 'tp-1';
    el.setAttribute('x-timepicker', '');
    document.body.appendChild(el);
    if ((window as any).WB?.scan) (window as any).WB.scan(el);
  });

  await page.waitForFunction(() => document.querySelector('#tp-1')?.dataset.wbTimepicker === '1', null, { timeout: 2000 });
  const el = page.locator('#tp-1');
  expect(await el.getAttribute('data-wb-timepicker')).toBe('1');
});
