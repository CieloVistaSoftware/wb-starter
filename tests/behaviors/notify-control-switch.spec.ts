/**
 * A demo switch that names a real capability must invoke it when turned ON —
 * <wb-switch notify-control> fires a real toast. (DEMOS-AND-DOCS-STANDARDS.md #22)
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.WB_BASE || 'http://localhost:3000';
const URL = `${BASE.replace(/\/$/, '')}/?page=behaviors`;

test('Notifications switch fires a real toast when turned ON, not when turned OFF', async ({ page }) => {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[x-switch][notify-control]', { timeout: 25000 });
  await page.waitForTimeout(2000);

  const sw = page.locator('[x-switch][notify-control]');

  // Starts checked (per pages/behaviors.html) — turning it OFF must NOT toast.
  await sw.click();
  await page.waitForTimeout(200);
  expect(await page.locator('.wb-toast').count(), 'turning the switch OFF should not fire a toast').toBe(0);

  // Turning it back ON must fire a real toast demonstrating the effect.
  await sw.click();
  await expect(page.locator('.wb-toast')).toHaveCount(1, { timeout: 2000 });
});
