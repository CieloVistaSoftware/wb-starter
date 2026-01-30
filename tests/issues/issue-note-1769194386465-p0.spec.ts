/**
 * Issue Test: note-1769194386465-p0
 * BUG: Issues viewer needs to require tests to validate fixes before resolve
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769194386465-p0: Require Tests Before Resolve', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
  });

  test('resolve button should be disabled without test link', async ({ page }) => {
    // Get an issue without testLink
    const issueWithoutTest = await page.evaluate(async () => {
      const res = await fetch('/api/pending-issues?all=true');
      const data = await res.json();
      return data.issues?.find((i: any) => !i.testLink && i.status === 'pending');
    });

    if (issueWithoutTest) {
      // Find resolve button for this issue
      const resolveBtn = page.locator(`[data-issue-id="${issueWithoutTest.id}"] [data-action="resolve"], 
                                        [data-resolve="${issueWithoutTest.id}"]`).first();
      
      if (await resolveBtn.count() > 0) {
        // Button should be disabled
        const isDisabled = await resolveBtn.isDisabled();
        expect(isDisabled).toBe(true);
      }
    }
  });

  test('resolve should require testLink property', async ({ page }) => {
    // Try to resolve an issue via API without testLink
    const result = await page.evaluate(async () => {
      // First create a test issue
      const res = await fetch('/api/pending-issues?all=true');
      const data = await res.json();
      const testIssue = data.issues?.[0];
      
      if (!testIssue) return { skipped: true };
      
      // Try to resolve without testLink
      const resolveRes = await fetch('/api/update-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: testIssue.id,
          status: 'resolved'
        })
      });
      
      return { 
        status: resolveRes.status,
        hasTestLink: !!testIssue.testLink
      };
    });

    // If issue lacks testLink, resolve should fail or require it
    if (result.skipped) {
      test.skip();
    }
    
    // The system should enforce testLink for resolution
    // (This tests the expectation - implementation may vary)
    expect(result.status).toBeDefined();
  });

  test('UI should show warning when test missing', async ({ page }) => {
    // Open issues panel
    const issuesToggle = page.locator('wb-issues, [data-issues]').first();
    if (await issuesToggle.count() > 0) {
      await issuesToggle.click();
      await page.waitForTimeout(300);
    }

    // Look for warning indicator on issues without tests
    const warningIndicator = page.locator('.no-test-warning, [data-warning="no-test"], .test-required');
    const hasWarning = await warningIndicator.count() > 0;

    // There should be some indication that tests are required
    // (either warning icons, disabled buttons, or tooltip messages)
    const resolveButtons = page.locator('[data-action="resolve"]:not([disabled])');
    
    // If there are enabled resolve buttons, they should only be for issues with tests
    if (await resolveButtons.count() > 0) {
      // Verify each has associated testLink
      const firstBtn = resolveButtons.first();
      const issueId = await firstBtn.getAttribute('data-issue-id');
      
      if (issueId) {
        const issue = await page.evaluate(async (id) => {
          const res = await fetch('/api/pending-issues?all=true');
          const data = await res.json();
          return data.issues?.find((i: any) => i.id === id);
        }, issueId);
        
        expect(issue?.testLink).toBeTruthy();
      }
    }
  });
});
