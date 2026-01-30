/**
 * Issue: note-1769445232423-p0
 * Title: issue header not visible on home page
 * Goal: ensure the issue header (issues panel heading) is present and visible on home
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769445232423-p0 — issue header visible on home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('issues header is visible on home page', async ({ page }) => {
    const header = page.locator('[data-test="issue-header"], .issues-header, #issues-header').first();
    const visible = await header.isVisible().catch(() => false);
    expect(visible, 'issue header should be visible on home page').toBe(true);
  });
});