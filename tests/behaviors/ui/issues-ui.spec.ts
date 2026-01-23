import { test, expect, APIRequestContext, Page, APIResponse } from '@playwright/test';

interface Issue {
  id: string;
  description?: string;
  // add other fields as needed
}

interface PendingIssuesResponse {
  issues?: Issue[];
  // add other fields as needed
}

test.describe('Issues UI (Builder)', () => {
  test('Header Issues button creates drawer and can save a note (visible in tracker)', async ({ page, request }: { page: Page; request: APIRequestContext }) => {
    await page.goto('/builder.html');
    await page.waitForSelector('#headerIssuesBtn');

    // Ensure no wb-issues initially
    const before = await page.$('wb-issues');
    if (before) await page.evaluate(el => el.remove(), before);

    // Click header button to create and open issues drawer
    await page.click('#headerIssuesBtn');
    await page.waitForSelector('wb-issues');
    const issuesEl = page.locator('wb-issues');
    expect(await issuesEl.count()).toBeGreaterThan(0);

    // Wait for textarea to be visible and editable (use computed style to be resilient to animations)
    await page.waitForFunction(() => {
      const el = document.querySelector('wb-issues .wb-issues__textarea');
      if (!el) return false;
      const cs = window.getComputedStyle(el);
      return cs && cs.display !== 'none' && cs.visibility !== 'hidden' && el.offsetHeight > 0 && !el.disabled;
    }, null, { timeout: 10000 });

    // Get textarea and write unique issue
    const unique = `UI test ${Date.now()} ${Math.random().toString(36).slice(2,6)}`;
    const textarea = issuesEl.locator('.wb-issues__textarea');
    await textarea.fill(unique, { timeout: 5000 });

    // Click Save
    await issuesEl.locator('.wb-issues__footer-btn[action="save"]').click();

    // Wait for server to process and appear in pending issues

    let found: Issue | undefined = undefined;
    for (let i = 0; i < 12; i++) {
      const resp: APIResponse = await request.get('/api/pending-issues?all=true');
      expect(resp.ok()).toBeTruthy();
      const data: PendingIssuesResponse = await resp.json();
      found = (data.issues || []).find((it: Issue) => (it.description || '').includes(unique));
      if (found) break;
      await page.waitForTimeout(500);
    }
    expect(found, 'Saved issue should appear in pending issues').toBeTruthy();

    // Open tracker modal and confirm text is shown
    await issuesEl.locator('.wb-issues__issue-count').click();
    await page.waitForSelector('#issue-tracker-modal');
    await expect(page.locator('#issue-tracker-modal')).toBeVisible();
    await expect(page.locator('#issue-tracker-modal')).toContainText(unique);

    // Cleanup: delete the issue via API
    const del: APIResponse = await request.post('/api/delete-issue', { data: { issueId: found!.id } });
    expect(del.ok()).toBeTruthy();
  });
});
