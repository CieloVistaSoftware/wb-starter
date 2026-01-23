import { test, expect } from '@playwright/test';

// This test checks that the behaviors.html demo does not reload unexpectedly

test.describe('behaviors.html stability', () => {
  test('should not reload or navigate unexpectedly', async ({ page }) => {
    let reloads = 0;
    await page.exposeFunction('onReload', () => { reloads++; });
    await page.addInitScript(() => {
      window.addEventListener('beforeunload', () => {
        window.onReload();
      });
    });
    await page.goto('demos/behaviors.html');
    // Wait for 5 seconds to see if any reload occurs
    await page.waitForTimeout(5000);
    expect(reloads).toBe(0);
  });
});
