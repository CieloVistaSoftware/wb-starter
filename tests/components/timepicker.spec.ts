import { test, expect } from '@playwright/test';

test('timepicker registers and marks element', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 5000 });

  await page.evaluate(async () => {
    const el = document.createElement('input');
    el.id = 'tp-1';
    el.setAttribute('x-timepicker', '');
    document.body.appendChild(el);
    if ((window as any).WB?.scan) await (window as any).WB.scan(el);
  });

  const el = page.locator('#tp-1');
  // The behavior writes a plain `x-timepicker-init` attribute (#928). This used to
  // wait on `data-wb-timepicker` and assert `data-x-timepicker` -- two spellings
  // nothing has ever set, so a working behavior timed out looking broken.
  // toHaveAttribute retries, so no explicit wait is needed.
  await expect(el).toHaveAttribute('x-timepicker-init', '1');
});
