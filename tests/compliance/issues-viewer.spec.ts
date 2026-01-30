import { test, expect } from '@playwright/test';

test('issues viewer shows Ready filter and validationTest details', async ({ page }) => {
  // stub the API to return a ready_for_review issue
  await page.route('**/api/pending-issues?all=true', route => {
    const data = {
      issues: [
        {
          id: 'test-ready-1',
          description: 'This is a test issue that is ready for review',
          status: 'ready_for_review',
          createdAt: new Date().toISOString(),
          validationTest: 'tests/debug/sample-validation.spec.ts',
          validationAt: new Date().toISOString()
        }
      ]
    };
    route.fulfill({ status: 200, body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });
  });

  await page.goto('issues-viewer.html');
  await page.waitForSelector('.filter-btn[data-filter="ready_for_review"]');
  // click Ready filter
  await page.click('.filter-btn[data-filter="ready_for_review"]');

  // wait for the validation test display in the rendered issue
  await expect(page.locator('text=🧪 Validation Test')).toBeVisible();
  await expect(page.locator('code')).toContainText('tests/debug/sample-validation.spec.ts');
});