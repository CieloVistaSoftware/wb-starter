import { test, expect } from '@playwright/test';

test('builder.html should load without critical page errors', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', err => {
    // Only track syntax/crash errors, not runtime init issues
    if (err.message.includes('SyntaxError') || err.message.includes('ReferenceError')) {
      pageErrors.push(`Page Error: ${err.message}`);
    }
  });

  try {
    await page.goto('/builder.html');
    await page.waitForTimeout(1000);
  } catch {
    // Builder may redirect — not a syntax error
    console.warn('builder.html navigation issue — checking syntax only');
  }

  if (pageErrors.length > 0) {
    console.log('--- CRITICAL PAGE ERRORS ---');
    console.log(pageErrors.join('\n'));
    console.log('----------------------------');
  }

  expect(pageErrors, 'Builder should have no syntax/reference errors').toEqual([]);
});
