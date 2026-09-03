import { test, expect } from '@playwright/test';

test('diff behavior attaches and does not error', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 5000 });

  await page.evaluate(async () => {
    const c = document.createElement('div');
    c.id = 'test-diff';
    c.setAttribute('x-diff', '');
    c.innerHTML = `<div class="diff-before">A</div><div class="diff-after">B</div>`;
    document.body.appendChild(c);
    // trigger scan/inject if available
    if ((window as any).WB?.scan) await (window as any).WB.scan(c);
  });

  const el = page.locator('#test-diff');
  await expect(el).toHaveAttribute('x-diff', '');
  // The behavior writes a plain `x-diff-init` attribute (#928). This used to
  // wait on `data-wb-diff` and assert `data-x-diff` -- two spellings
  // nothing has ever set, so a working behavior timed out looking broken.
  // toHaveAttribute retries, so no explicit wait is needed.
  await expect(el).toHaveAttribute('x-diff-init', '1');
});
