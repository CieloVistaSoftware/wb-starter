import { test, expect } from '@playwright/test';

test('diff behavior attaches and does not error', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 5000 });

  await page.evaluate(() => {
    const c = document.createElement('div');
    c.id = 'test-diff';
    c.setAttribute('x-diff', '');
    c.innerHTML = `<div class="diff-before">A</div><div class="diff-after">B</div>`;
    document.body.appendChild(c);
    // trigger scan/inject if available
    if ((window as any).WB?.scan) (window as any).WB.scan(c);
  });

  const el = page.locator('#test-diff');
  await expect(el).toHaveAttribute('x-diff', '');
  // wait for marker set by the shim
  await page.waitForFunction(() => document.querySelector('#test-diff')?.dataset.wbDiff === '1', null, { timeout: 2000 });
  expect(await el.getAttribute('data-wb-diff')).toBe('1');
});
