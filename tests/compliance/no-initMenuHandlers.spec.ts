import { test, expect } from '@playwright/test';

test('builder DOM binder does not expose initMenuHandlers shim', async ({ page }) => {
  await page.goto('/builder.html');
  const isUndefined = await page.evaluate(() => typeof (window as any).initMenuHandlers === 'undefined');
  expect(isUndefined).toBe(true);
});
