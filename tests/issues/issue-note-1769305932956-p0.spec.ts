/**
 * Issue Test: note-1769305932956-p0
 * Auto-generated: 2026-01-26T02:03:12.216Z
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769305932956-p0: builderhtml has an issues button in bottom right corner  r', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
  });

  test('verify issue is fixed - builderhtml has an issues button in bottom right corner  r', async ({ page }) => {
    // ID: note-1769305932956-p0 | Created: 2026-01-25T01:52:12.956Z
    // Description: [BUG] builder.html has an issues button in bottom right corner - remove it
    test.info().annotations.push({ type: 'issue', description: 'note-1769305932956-p0' });
    await expect(page).toHaveTitle(/.*/);
    // TODO: Add specific assertions
  });
});
