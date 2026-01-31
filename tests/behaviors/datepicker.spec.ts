import { test, expect } from '@playwright/test';

test('datepicker registers and marks element', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 5000 });

  await page.evaluate(() => {
    const el = document.createElement('input');
    el.id = 'dp-1';
    el.setAttribute('data-wb', 'datepicker');
    document.body.appendChild(el);
    if ((window as any).WB?.scan) (window as any).WB.scan(el);
  });

  const el = page.locator('#dp-1');
  await page.waitForFunction(() => document.querySelector('#dp-1')?.dataset.wbDatepicker === '1', null, { timeout: 2000 });
  expect(await el.getAttribute('data-wb-datepicker') === '1' || (await el.getAttribute('data-wb'))).toBeTruthy();
});
