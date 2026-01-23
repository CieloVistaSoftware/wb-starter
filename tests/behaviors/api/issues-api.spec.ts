import { test, expect } from '@playwright/test';

test.describe('Issues API (server)', () => {
  test('POST /api/add-issue -> GET /api/pending-issues returns the new issue', async ({ request }) => {
    const unique = `Test issue ${Date.now()} ${Math.random().toString(36).slice(2,8)}`;

    // Add issue
    const addRes = await request.post('/api/add-issue', { data: { content: unique } });
    expect(addRes.ok()).toBeTruthy();
    // Ensure JSON response
    const addCT = (addRes.headers()['content-type'] || '').toLowerCase();
    if (!addCT.includes('application/json')) {
      const txt = await addRes.text();
      console.log('Unexpected /api/add-issue response (non-JSON):', txt.slice(0, 800));
    }
    expect(addCT).toContain('application/json');

    const addBody = await addRes.json();
    expect(addBody.success).toBeTruthy();
    const noteId = addBody.note?.id;
    expect(noteId).toBeTruthy();

    // Poll pending issues until we find the new one (max 5s)
    let found = null;
    for (let i = 0; i < 10; i++) {
      const listRes = await request.get('/api/pending-issues?all=true');
      expect(listRes.ok()).toBeTruthy();
      const data = await listRes.json();
      const match = (data.issues || []).find(i => i.description && i.description.includes(unique));
      if (match) {
        found = match;
        break;
      }
      await new Promise(r => setTimeout(r, 500));
    }

    expect(found, 'Expected the added issue to appear in pending issues').toBeTruthy();

    // Update issue -> resolved (should become pending-review)
    const updateRes = await request.post('/api/update-issue', { data: { issueId: found.id, status: 'resolved', resolution: 'Unit test mark fixed' } });
    expect(updateRes.ok()).toBeTruthy();
    const updateCT = (updateRes.headers()['content-type'] || '').toLowerCase();
    expect(updateCT).toContain('application/json');
    const updateBody = await updateRes.json();
    expect(updateBody.success).toBeTruthy();
    expect(updateBody.issue.status).toBe('pending-review');

    // Approve the fix -> approved => resolved
    const approveRes = await request.post('/api/update-issue', { data: { issueId: found.id, status: 'approved' } });
    expect(approveRes.ok()).toBeTruthy();
    const approveCT = (approveRes.headers()['content-type'] || '').toLowerCase();
    expect(approveCT).toContain('application/json');
    const approveBody = await approveRes.json();
    expect(approveBody.success).toBeTruthy();
    expect(approveBody.issue.status).toBe('resolved');

    // Clear resolved issues and ensure it's removed
    const clearRes = await request.post('/api/clear-resolved-issues', { data: {} });
    expect(clearRes.ok()).toBeTruthy();
    const clearCT = (clearRes.headers()['content-type'] || '').toLowerCase();
    expect(clearCT).toContain('application/json');
    const clearBody = await clearRes.json();
    expect(clearBody.success).toBeTruthy();

    // Verify not present
    const finalListRes = await request.get('/api/pending-issues?all=true');
    const finalData = await finalListRes.json();
    const stillThere = (finalData.issues || []).some(i => i.id === found.id);
    expect(stillThere).toBeFalsy();
  });

  test('POST /api/delete-issue removes a specific issue', async ({ request }) => {
    const unique = `Delete test ${Date.now()} ${Math.random().toString(36).slice(2,8)}`;
    const addRes = await request.post('/api/add-issue', { data: { content: unique } });
    expect(addRes.ok()).toBeTruthy();
    const added = (await addRes.json()).note;
    expect(added).toBeTruthy();

    // Wait for issue to be parsed
    let issue = null;
    for (let i = 0; i < 10; i++) {
      const r = await request.get('/api/pending-issues?all=true');
      const d = await r.json();
      issue = (d.issues || []).find(x => x.description && x.description.includes(unique));
      if (issue) break;
      await new Promise(r => setTimeout(r, 300));
    }
    expect(issue).toBeTruthy();

    const delRes = await request.post('/api/delete-issue', { data: { issueId: issue.id } });
    expect(delRes.ok()).toBeTruthy();
    const delCT = (delRes.headers()['content-type'] || '').toLowerCase();
    expect(delCT).toContain('application/json');
    const delBody = await delRes.json();
    expect(delBody.success).toBeTruthy();

    // Confirm deletion
    const check = await request.get('/api/pending-issues?all=true');
    const checkData = await check.json();
    const still = (checkData.issues || []).some(i => i.id === issue.id);
    expect(still).toBeFalsy();
  });
});
