import { test, expect } from '@playwright/test';

// This test checks for unexpected reloads or navigation in the behaviors.html demo

test.describe('behaviors.html reload detection', () => {
  test('should not reload or navigate unexpectedly', async ({ page }) => {
    let reloads = 0;
    await page.exposeFunction('onReload', () => { reloads++; });
    await page.addInitScript(() => {
      window.addEventListener('beforeunload', () => {
        window.onReload();
      });
    });
    await page.goto('demos/behaviors.html');
    // Wait for 7 seconds to see if any reload occurs
    await page.waitForTimeout(7000);
    expect(reloads).toBe(0);
  });
});
