/**
 * Issue: note-1769445034341-p0
 * Title: home page has many things not working
 * Goal: smoke-check a set of critical home-page features so the issue is scoped and reproducible
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769445034341-p0 — home page smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('home page critical anchors render (hero, navbar, issues, footer)', async ({ page }) => {
    await expect(page.locator('header, .site-header')).toBeVisible();
    await expect(page.locator('nav[role="navigation"], #main-nav')).toBeVisible();
    await expect(page.locator('[data-test="issues-list"], #issues, .issues')).toBeVisible();
    await expect(page.locator('footer, .site-footer')).toBeVisible();
  });

  test('home page interactive checks (issues open, toast triggers)', async ({ page }) => {
    const issuesBtn = page.locator('[data-test="issues-toggle"], button:has-text("Issues")').first();
    await expect(issuesBtn).toBeVisible();
    await issuesBtn.click();
    await expect(page.locator('#issuesPanel, [data-test="issues-panel"]')).toBeVisible();

    const toastBtn = page.locator('button[x-toast]').first();
    if (await toastBtn.count() > 0) {
      await toastBtn.click();
      await expect(page.locator('.wb-toast-container div, .wb-toast')).toHaveCountGreaterThan(0);
    }
  });
});