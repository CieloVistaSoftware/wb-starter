import { test, expect } from '@playwright/test';

test('builder.html should load without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`Console Error: ${msg.text()}`);
  });
  page.on('pageerror', err => {
    errors.push(`Page Error: ${err.message}`);
  });
  page.on('requestfailed', request => {
    errors.push(`Failed Request: ${request.url()} (${request.failure()?.errorText})`);
  });
  page.on('response', response => {
    if (response.status() === 404) {
      errors.push(`404 Not Found: ${response.url()}`);
    }
  });

  await page.goto('/builder.html');
  
  // Wait a bit for scripts to execute
  await page.waitForTimeout(1000);

  if (errors.length > 0) {
    console.log('--- PAGE ERRORS ---');
    console.log(errors.join('\n'));
    console.log('-------------------');
  }

  expect(errors).toEqual([]);
  
  // Check if doPreview is defined
  const isDefined = await page.evaluate(() => typeof window.doPreview === 'function');
  expect(isDefined).toBe(true);
});
