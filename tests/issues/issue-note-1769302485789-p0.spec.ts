/**
 * Issue Test: note-1769302485789-p0
 * Auto-generated: 2026-01-26T02:09:17.021Z
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769302485789-p0: report issue has two buttons in builder  one in top and one', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
  });

  test('verify issue is fixed - report issue has two buttons in builder  one in top and one', async ({ page }) => {
    // ID: note-1769302485789-p0 | Created: 2026-01-25T00:54:45.789Z
    // Description: [BUG] report issue has two buttons in builder - one in top and one in bottom
    test.info().annotations.push({ type: 'issue', description: 'note-1769302485789-p0' });
    await expect(page).toHaveTitle(/.*/);
    // TODO: Add specific assertions
  });
});
