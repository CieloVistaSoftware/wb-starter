import { test, expect } from '@playwright/test';

test.describe('Fix Viewer Grouping', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the fixes data to have predictable data for grouping
    await page.route('/data/fixes.json', async route => {
      const json = {
        metadata: { version: "1.0.0" },
        fixes: {
          "FIX_1": {
            errorId: "FIX_1",
            component: "comp-a",
            status: "APPLIED",
            date: "2025-01-01T12:00:00Z",
            issue: "Issue 1",
            fix: { file: "f1.js", action: "a1" }
          },
          "FIX_2": {
            errorId: "FIX_2",
            component: "comp-a",
            status: "INCOMPLETE",
            date: "2025-01-01T12:00:00Z",
            issue: "Issue 2",
            fix: { file: "f2.js", action: "a2" }
          },
          "FIX_3": {
            errorId: "FIX_3",
            component: "comp-b",
            status: "APPLIED",
            date: "2025-01-02T12:00:00Z",
            issue: "Issue 3",
            fix: { file: "f3.js", action: "a3" }
          }
        }
      };
      await route.fulfill({ json });
    });

    await page.goto('/public/fix-viewer.html');
    await page.waitForSelector('.fix-card');
  });

  test('should default to no grouping', async ({ page }) => {
    // Check that there are no group headers
    await expect(page.locator('.group-header')).toHaveCount(0);
    // Check that all cards are present in the main grid
    await expect(page.locator('.fix-card')).toHaveCount(3);
  });

  test('should group by component', async ({ page }) => {
    // Select 'Component' from the group dropdown
    await page.selectOption('#group-by', 'component');

    // Check for group headers
    const headers = page.locator('.group-header');
    await expect(headers).toHaveCount(2);
    await expect(headers.nth(0)).toContainText('comp-a');
    await expect(headers.nth(1)).toContainText('comp-b');

    // Check cards in first group (comp-a)
    const groupA = page.locator('.fix-group').filter({ hasText: 'comp-a' });
    await expect(groupA.locator('.fix-card')).toHaveCount(2);
    await expect(groupA.locator('.fix-card', { hasText: 'FIX_1' })).toBeVisible();
    await expect(groupA.locator('.fix-card', { hasText: 'FIX_2' })).toBeVisible();

    // Check cards in second group (comp-b)
    const groupB = page.locator('.fix-group').filter({ hasText: 'comp-b' });
    await expect(groupB.locator('.fix-card')).toHaveCount(1);
    await expect(groupB.locator('.fix-card', { hasText: 'FIX_3' })).toBeVisible();
  });

  test('should group by status', async ({ page }) => {
    // Select 'Status' from the group dropdown
    await page.selectOption('#group-by', 'status');

    // Check for group headers
    const headers = page.locator('.group-header');
    await expect(headers).toHaveCount(2);
    
    // Note: Order depends on implementation, but we expect APPLIED and INCOMPLETE
    const groupApplied = page.locator('.fix-group').filter({ hasText: 'APPLIED' });
    await expect(groupApplied.locator('.fix-card')).toHaveCount(2); // FIX_1 and FIX_3
    
    const groupIncomplete = page.locator('.fix-group').filter({ hasText: 'INCOMPLETE' });
    await expect(groupIncomplete.locator('.fix-card')).toHaveCount(1); // FIX_2
  });

  test('should group by date', async ({ page }) => {
    // Select 'Date' from the group dropdown
    await page.selectOption('#group-by', 'date');

    // Check for group headers
    const headers = page.locator('.group-header');
    await expect(headers).toHaveCount(2);

    // Dates are localized in the viewer, so we match loosely or by the expected string
    // 2025-01-01
    const date1 = new Date("2025-01-01T12:00:00Z").toLocaleDateString();
    const group1 = page.locator('.fix-group').filter({ hasText: date1 });
    await expect(group1.locator('.fix-card')).toHaveCount(2); // FIX_1 and FIX_2

    // 2025-01-02
    const date2 = new Date("2025-01-02T12:00:00Z").toLocaleDateString();
    const group2 = page.locator('.fix-group').filter({ hasText: date2 });
    await expect(group2.locator('.fix-card')).toHaveCount(1); // FIX_3
  });
});
