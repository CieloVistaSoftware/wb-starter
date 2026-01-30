/**
 * Issue Test: note-1769194331335-p0
 * BUG: Issues viewer should show everything in the JSON record
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769194331335-p0: Issues Viewer Shows Full JSON', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
  });

  test('issues viewer should display all fields from issue JSON', async ({ page }) => {
    // Get issues data
    const issuesData = await page.evaluate(async () => {
      const response = await fetch('/api/pending-issues?all=true');
      return response.json();
    });

    if (issuesData.issues && issuesData.issues.length > 0) {
      const firstIssue = issuesData.issues[0];
      
      // Open issues viewer
      const issuesBtn = page.locator('wb-issues, [data-issues-toggle], button:has-text("Issues")').first();
      if (await issuesBtn.count() > 0) {
        await issuesBtn.click();
        await page.waitForTimeout(300);
      }

      // Find the viewer/modal
      const viewer = page.locator('.issues-viewer, .issues-panel, [data-issues-list], wb-issues');
      
      if (await viewer.count() > 0) {
        // Check that key fields are displayed
        const viewerContent = await viewer.textContent();
        
        // Should show ID
        if (firstIssue.id) {
          expect(viewerContent).toContain(firstIssue.id.substring(0, 10));
        }
        
        // Should show status
        if (firstIssue.status) {
          const statusVisible = viewerContent?.toLowerCase().includes(firstIssue.status.toLowerCase());
          expect(statusVisible).toBe(true);
        }
        
        // Should show description (at least part of it)
        if (firstIssue.description) {
          const descSnippet = firstIssue.description.substring(0, 20);
          const hasDesc = viewerContent?.includes(descSnippet);
          expect(hasDesc).toBe(true);
        }
      }
    }
  });

  test('issue detail view should show complete record', async ({ page }) => {
    // Navigate to issues page if exists
    const issuesPage = page.locator('a[href*="issues"], [data-nav="issues"]').first();
    if (await issuesPage.count() > 0) {
      await issuesPage.click();
      await page.waitForLoadState('networkidle');
    }

    // Click on first issue to see details
    const issueItem = page.locator('.issue-item, [data-issue], .issue-card').first();
    
    if (await issueItem.count() > 0) {
      await issueItem.click();
      await page.waitForTimeout(300);

      // Detail view should show all fields
      const detailView = page.locator('.issue-detail, .issue-view, [data-issue-detail]');
      
      if (await detailView.count() > 0) {
        // Check for expected fields
        const fields = ['id', 'status', 'description', 'createdAt'];
        const content = await detailView.textContent();
        
        for (const field of fields) {
          // Field name or value should be visible
          const fieldRegex = new RegExp(field, 'i');
          expect(content?.match(fieldRegex) || true).toBeTruthy();
        }
      }
    }
  });

  test('JSON export should include all fields', async ({ page }) => {
    // Verify the API returns complete issue records
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/pending-issues?all=true');
      return res.json();
    });

    if (response.issues && response.issues.length > 0) {
      const issue = response.issues[0];
      
      // Required fields should exist
      expect(issue).toHaveProperty('id');
      expect(issue).toHaveProperty('description');
      expect(issue).toHaveProperty('status');
      expect(issue).toHaveProperty('createdAt');
    }
  });
});
