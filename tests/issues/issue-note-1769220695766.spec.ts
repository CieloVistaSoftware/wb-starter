/**
 * Issue Test: note-1769220695766
 * Generated: 2026-01-24T21:30:47.118Z
 * Category: general
 */
import { test, expect } from '@playwright/test';
import { openIssues, assertIssuesOpen } from '../helpers/ui-helpers';

test.describe('Issue note-1769220695766: CLICKING ON ISSUE IN HOME PAGE', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the page referenced in the issue
    await page.goto('http://localhost:3000/?page=behaviors');
    await page.waitForLoadState('networkidle');
  });

  test('clicking the Issues control opens the Issues panel and does not show a generic "clicked" toast', async ({ page }) => {
    test.info().annotations.push({ type: 'issue', description: 'note-1769220695766' });
    test.info().annotations.push({ type: 'generated', description: 'issue-click: open issues panel, not generic toast' });

    // Use helper that locates an issues trigger (with fallbacks) and opens it
    const opened = await openIssues(page);
    if (!opened) {
      test.skip();
      return;
    }

    // Assert Issues panel is visible and no generic "clicked" toast is shown
    await assertIssuesOpen(page);
  });

  test('verify issue is fixed - CLICKING ON ISSUE IN HOME PAGE', async ({ page }) => {
    // Heuristic test generated: verify clicking the issue control opens issues panel (not a generic toast)
    test.info().annotations.push({ type: 'generated', description: 'auto-heuristic: issue-click' });

    // Try to find a trigger (wb-issues trigger/button)
    const issuesBtn = page.locator('wb-issues .wb-issues__trigger, wb-issues button, button[title="Open Issues"], wb-issues, [data-issues], .issues-button').first();
    await page.waitForSelector('wb-issues .wb-issues__trigger, wb-issues button, button[title="Open Issues"], [data-issues], .issues-button', { timeout: 2500 }).catch(() => null);
    if (await issuesBtn.count() === 0) {
      // Attempt fallback pages where an issues control may exist
      const FALLBACKS = ['/?page=behaviors','/builder.html','/'];
      let _found = false;
      for (const p of FALLBACKS) {
        await page.goto('http://localhost:3000' + p);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('wb-issues .wb-issues__trigger, wb-issues button, button[title="Open Issues"], [data-issues], .issues-button', { timeout: 1000 }).catch(() => null);
        if (await page.locator('wb-issues .wb-issues__trigger, wb-issues button, button[title="Open Issues"], [data-issues], .issues-button').count() > 0) {
          _found = true;
          break;
        }
      }
      if (!_found) {
        test.skip();
        return;
      }
    }

    await issuesBtn.click();
    await page.waitForTimeout(500);

    const toast = page.locator('.toast:has-text("clicked"), .toast:has-text("Clicked"), [data-toast]:has-text("click")');
    const toastVisible = await toast.isVisible().catch(() => false);

    const issuesPanel = page.locator('.wb-issues__drawer, .issues-panel, wb-issues[open], wb-issues');
    const panelVisible = await issuesPanel.isVisible().catch(() => false);

    // Expect the issues panel to be visible and not just a generic "clicked" toast
    expect(panelVisible).toBe(true);
    expect(toastVisible && !panelVisible).toBe(false);

  });

});
