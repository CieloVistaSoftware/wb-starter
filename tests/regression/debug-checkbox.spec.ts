import { test, expect } from '@playwright/test';
test('debug checkbox manual inject', async ({ page }) => {
  await page.goto('/demos/site/forms.html');
  await page.waitForTimeout(1500);
  const result = await page.evaluate(async () => {
    const el = document.querySelector('wb-checkbox')!;
    const before = el.innerHTML;
    try {
      const cleanup = await (window as any).WB.inject(el, 'checkbox');
      return { before, after: el.innerHTML, injectResult: typeof cleanup, error: null };
    } catch (e: any) {
      return { before, after: el.innerHTML, injectResult: null, error: e.message };
    }
  });
  console.log(JSON.stringify(result, null, 2));
});
