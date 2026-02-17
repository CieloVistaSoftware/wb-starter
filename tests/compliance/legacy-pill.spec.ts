import { test, expect } from '@playwright/test';

test.describe('Legacy Pill Migration', () => {
  test('no legacy data-wb="pill" or legacy error markers on important pages', async ({ page }) => {
    const errorLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errorLogs.push(msg.text());
    });

    // Check root page and the behaviors demo (where badges live)
    for (const url of ['/', '/demos/behaviors-showcase.html']) {
      await page.goto(url);
      await page.waitForFunction(() => (window as any).WB);
      await page.waitForTimeout(300);

      // No legacy attributes or legacy-error markers in DOM
      await expect(page.locator('wb-pill')).toHaveCount(0);
      await expect(page.locator('[data-wb-error="legacy"]')).toHaveCount(0);

      // No console errors mentioning the legacy pill syntax
      const legacyConsole = errorLogs.find(l => l.includes('Legacy syntax') && l.includes('data-wb="pill"'));
      expect(legacyConsole, `no legacy pill console error on ${url}`).toBeFalsy();
    }
  });
});
