/**
 * Test: Issues Viewer Refresh Button
 * Validates the refresh button actually updates the UI with new data
 * Also validates that HTML content submissions are rejected (not valid bug reports)
 */
import { test, expect } from '@playwright/test';

test.describe('Issues Viewer Refresh Button', () => {
  
  test('refresh button updates UI with new issues', async ({ page, request }) => {
    const testIssueId = `test-refresh-${Date.now()}`;
    const testDescription = `[BUG] Test refresh validation ${testIssueId}`;
    
    await test.step('Navigate to issues viewer', async () => {
      await page.goto('http://localhost:3000/issues-viewer.html');
      await page.waitForLoadState('networkidle');
    });

    await test.step('Verify test issue does NOT exist yet', async () => {
      const pageContent = await page.content();
      expect(pageContent).not.toContain(testIssueId);
    });

    await test.step('Add a new issue via API', async () => {
      const response = await request.post('http://localhost:3000/api/add-issue', {
        data: { content: testDescription }
      });
      expect(response.ok()).toBe(true);
    });

    await test.step('Click refresh button', async () => {
      const refreshBtn = page.locator('button:has-text("Refresh")');
      await expect(refreshBtn).toBeVisible();
      await refreshBtn.click();
      await page.waitForResponse(resp => resp.url().includes('/api/pending-issues'));
    });

    await test.step('Verify new issue appears in the list', async () => {
      await expect(page.locator(`.issue-card:has-text("${testIssueId}")`)).toBeVisible({ timeout: 5000 });
    });

    await test.step('Cleanup - delete test issue', async () => {
      const issuesRes = await request.get('http://localhost:3000/api/pending-issues?all=true');
      const data = await issuesRes.json();
      const testIssue = data.issues?.find(i => i.description?.includes(testIssueId));
      if (testIssue) {
        await request.post('http://localhost:3000/api/delete-issue', {
          data: { issueId: testIssue.id }
        });
      }
    });
  });

  test('HTML content is rejected - not a valid bug report', async ({ page, request }) => {
    // This simulates someone accidentally copying outerHTML instead of writing a bug description
    const htmlContent = `<body>
  <header class="viewer-header">
    <h1 class="viewer-title">📋 Issues</h1>
    <div class="viewer-actions">
      <button class="btn" onclick="refresh()">🔄 Refresh</button>
      <button class="btn btn--danger" onclick="clearResolved()">🗑️ Clear Resolved</button>
    </div>
  </header>
  <nav class="filters">
    <label for="searchInput" class="filter-label">🔍</label>
    <input type="text" id="searchInput" class="filter-input" placeholder="Search...">
  </nav>
  <main class="issues-list" id="issuesList">
    <div class="issue-card" data-status="pending">
      <div class="issue-card__header">
        <h3 class="issue-card__title">⏳ [BUG] test</h3>
      </div>
    </div>
  </main>
</body>`;

    await test.step('Get issue count before submission', async () => {
      await page.goto('http://localhost:3000/issues-viewer.html');
      await page.waitForLoadState('networkidle');
    });

    const issuesBeforeRes = await request.get('http://localhost:3000/api/pending-issues?all=true');
    const dataBefore = await issuesBeforeRes.json();
    const countBefore = dataBefore.issues?.length || 0;

    await test.step('Submit HTML content via API', async () => {
      const addRes = await request.post('http://localhost:3000/api/add-issue', {
        data: { content: htmlContent }
      });
      // Expect server to reject HTML content and return a unique errorId for tracing
      expect(addRes.ok()).toBeFalsy();
      expect(addRes.status()).toBe(400);
      const errBody = await addRes.json();
      expect(errBody.error).toBeTruthy();
      expect(errBody.errorId).toBeTruthy();
      expect(typeof errBody.errorId).toBe('string');
      expect(errBody.errorId).toMatch(/^SRV-[0-9A-Z-]+$/);
    });

    await test.step('Wait for server processing', async () => {
      await page.waitForTimeout(500);
    });

    await test.step('Verify HTML content was rejected - no issues created', async () => {
      const issuesAfterRes = await request.get('http://localhost:3000/api/pending-issues?all=true');
      const dataAfter = await issuesAfterRes.json();
      const countAfter = dataAfter.issues?.length || 0;
      
      // HTML submission should NOT create any new issues
      expect(countAfter).toBe(countBefore);
      
      // Double-check: number of issues containing HTML should not increase
      const issuesWithHtmlBefore = dataBefore.issues?.filter(i => /<[^>]+>/i.test(i.description || '')) || [];
      const issuesWithHtmlAfter = dataAfter.issues?.filter(i => /<[^>]+>/i.test(i.description || '')) || [];
      expect(issuesWithHtmlAfter.length).toBe(issuesWithHtmlBefore.length);
    });
  });

  test('window.refresh() programmatically updates the list', async ({ page, request }) => {
    const testIssueId = `test-window-refresh-${Date.now()}`;
    const testDescription = `[BUG] Window refresh test ${testIssueId}`;

    await test.step('Navigate to issues viewer', async () => {
      await page.goto('http://localhost:3000/issues-viewer.html');
      await page.waitForLoadState('networkidle');
    });

    await test.step('Verify window.refresh is a function', async () => {
      const hasRefresh = await page.evaluate(() => typeof window.refresh === 'function');
      expect(hasRefresh).toBe(true);
    });

    await test.step('Add issue via API', async () => {
      const response = await request.post('http://localhost:3000/api/add-issue', {
        data: { content: testDescription }
      });
      expect(response.ok()).toBe(true);
    });

    await test.step('Call window.refresh() and verify UI updates', async () => {
      await page.evaluate(() => window.refresh());
      await expect(page.locator(`.issue-card:has-text("${testIssueId}")`)).toBeVisible({ timeout: 5000 });
    });

    await test.step('Cleanup', async () => {
      const issuesRes = await request.get('http://localhost:3000/api/pending-issues?all=true');
      const data = await issuesRes.json();
      const testIssue = data.issues?.find(i => i.description?.includes(testIssueId));
      if (testIssue) {
        await request.post('http://localhost:3000/api/delete-issue', {
          data: { issueId: testIssue.id }
        });
      }
    });
  });

  test('issue count updates after refresh', async ({ page }) => {
    await test.step('Navigate to issues viewer', async () => {
      await page.goto('http://localhost:3000/issues-viewer.html');
      await page.waitForLoadState('networkidle');
    });

    await test.step('Click refresh and verify count element updates', async () => {
      await page.waitForSelector('#issueCount');
      
      await page.locator('button:has-text("Refresh")').click();
      await page.waitForResponse(resp => resp.url().includes('/api/pending-issues'));
      
      const countAfter = await page.locator('#issueCount').textContent();
      expect(countAfter).toBeTruthy();
      expect(countAfter).toMatch(/\d+\s+issue/i);
    });
  });
});
