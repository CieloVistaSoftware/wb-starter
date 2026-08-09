import { test, expect } from '@playwright/test';

test('theme exposes critical CSS variables (dark mode fallbacks)', async ({ page }) => {
  await page.goto('/pages/offshoring.html');
  // Ensure dark theme is active (default)
  await page.waitForSelector('[data-theme]');

  const textPrimary = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim());
  expect(textPrimary, '--text-primary must be defined').not.toBe('');

  const primary = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim());
  expect(primary, '--primary must be defined').not.toBe('');
});