/**
 * Issue: issues-viewer-refresh-button
 * Title: Issues viewer refresh button does not work
 * Goal: ensure the refresh button triggers a network refresh and updates the issues list
 */
import { test, expect } from '@playwright/test';

test.describe('Issue: issues-viewer-refresh-button — refresh updates the issues list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/issues-viewer.html');
    await page.waitForLoadState('networkidle');
  });

  test('refresh button triggers API call and updates UI', async ({ page }) => {
    // intercept the API and return a modified payload so we can detect the update
    await page.route('**/api/pending-issues?*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ issues: [{ id: 'note-xxxx-test-refresh', description: 'refresh-test' }] })
      });
    });

    const refresh = page.locator('[data-test="issues-refresh"], button#issues-refresh, button:has-text("Refresh")').first();
    await expect(refresh).toBeVisible();
    await refresh.click();

    const row = page.locator('tr:has-text("refresh-test"), [data-issue-id="note-xxxx-test-refresh"]');
    await expect(row).toBeVisible({ timeout: 3000 });
  });
});