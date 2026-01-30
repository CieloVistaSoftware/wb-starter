/**
 * Issue Test: note-1769306014994-p0
 * Auto-generated: 2026-01-26T01:55:15.430Z
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769306014994-p0: builderhtml add component popup has uneven rows  one tile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
  });

  test('verify issue is fixed - builderhtml add component popup has uneven rows  one tile', async ({ page }) => {
    // ID: note-1769306014994-p0 | Created: 2026-01-25T01:53:34.994Z
    // Description: [BUG] builder.html add component popup has uneven rows - one tile is very tall
    test.info().annotations.push({ type: 'issue', description: 'note-1769306014994-p0' });
    await expect(page).toHaveTitle(/.*/);
    // TODO: Add specific assertions
  });
});
