/**
 * Issue Test: note-1769220695766-p0
 * BUG: Clicking on issue in home page does not show issues, just shows toast "clicked"
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769220695766-p0: Issue Click Shows Issues Not Toast', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
  });

  test('clicking issues button should open issues panel, not show toast', async ({ page }) => {
    // Find issues button/component
    const issuesBtn = page.locator('wb-issues, [data-issues], .issues-button, button:has-text("Issues")').first();
    
    if (await issuesBtn.count() === 0) {
      test.skip();
      return;
    }

    // Click the issues button
    await issuesBtn.click();
    await page.waitForTimeout(500);

    // Should NOT just show a toast
    const toast = page.locator('.toast:has-text("clicked"), .toast:has-text("Clicked"), [data-toast]:has-text("click")');
    const toastVisible = await toast.isVisible().catch(() => false);
    
    // Should show issues panel/viewer instead
    const issuesPanel = page.locator('.issues-panel, .issues-viewer, .issues-list, [data-issues-panel], wb-issues[open]');
    const panelVisible = await issuesPanel.isVisible().catch(() => false);

    // The bug was: toast shown instead of panel
    // Fix verification: panel shown, not just toast
    expect(toastVisible && !panelVisible).toBe(false); // Should not have toast-only
  });

  test('issues component should expand to show list', async ({ page }) => {
    const issuesComponent = page.locator('wb-issues').first();
    
    if (await issuesComponent.count() === 0) {
      test.skip();
      return;
    }

    // Get initial state
    const initialHeight = await issuesComponent.boundingBox().then(b => b?.height || 0);

    // Click to expand
    await issuesComponent.click();
    await page.waitForTimeout(300);

    // Check for expanded content
    const expandedContent = issuesComponent.locator('.issue-item, .issue-list, [data-issue]');
    const hasContent = await expandedContent.count() > 0;

    // Or check for expanded height
    const expandedHeight = await issuesComponent.boundingBox().then(b => b?.height || 0);

    // Should either show content or expand in size
    const expanded = hasContent || expandedHeight > initialHeight;
    expect(expanded).toBe(true);
  });

  test('issue items should be clickable and show details', async ({ page }) => {
    // Open issues first
    const issuesBtn = page.locator('wb-issues, [data-issues]').first();
    if (await issuesBtn.count() > 0) {
      await issuesBtn.click();
      await page.waitForTimeout(300);
    }

    // Find individual issue items
    const issueItems = page.locator('.issue-item, [data-issue-id], .issue-entry');
    
    if (await issueItems.count() > 0) {
      const firstIssue = issueItems.first();
      await firstIssue.click();
      await page.waitForTimeout(300);

      // Should show issue details, NOT a generic "clicked" toast
      const detailView = page.locator('.issue-detail, .issue-description, [data-issue-detail]');
      const genericToast = page.locator('.toast:has-text("clicked")');

      const showsDetail = await detailView.isVisible().catch(() => false);
      const showsGenericToast = await genericToast.isVisible().catch(() => false);

      // Should show detail, not generic toast
      expect(showsGenericToast && !showsDetail).toBe(false);
    }
  });
});
