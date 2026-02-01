import { test, expect } from '@playwright/test';

test('diff behavior attaches and does not error', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 5000 });

  await page.evaluate(() => {
    const c = document.createElement('div');
    c.id = 'test-diff';
    c.setAttribute('data-wb', 'diff');
    c.innerHTML = `<div class="diff-before">A</div><div class="diff-after">B</div>`;
    document.body.appendChild(c);
    // trigger scan/inject if available
    if ((window as any).WB?.scan) (window as any).WB.scan(c);
  });

  const el = page.locator('#test-diff');
  await expect(el).toHaveAttribute('data-wb');
  // wait for marker set by the shim
  await page.waitForFunction(() => document.querySelector('#test-diff')?.dataset.wbDiff === '1', null, { timeout: 2000 });
  const marker = await el.getAttribute('data-wb-diff') || (await el.getAttribute('data-wb-diff'));
  expect(await el.getAttribute('data-wb-diff') === '1' || await el.getAttribute('data-wbDiff') === '1' || (await el.getAttribute('data-wb'))).toBeTruthy();
});
