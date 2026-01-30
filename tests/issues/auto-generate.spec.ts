import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ISSUE_ID = 'note-1769293683522-p0';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const ROOT = path.join(path.dirname(__filename), '..', '..');
const PENDING = path.join(ROOT, 'data', 'pending-issues.json');
const TEST_PATH = path.join(ROOT, 'tests', 'issues', `issue-${ISSUE_ID.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.spec.ts`);

test.describe('Auto-generate issue test', () => {
  test.setTimeout(60000);

  test.beforeEach(async () => {
    // Ensure pending-issues.json contains the issue
    let data = { issues: [] };
    if (fs.existsSync(PENDING)) data = JSON.parse(fs.readFileSync(PENDING, 'utf8'));

    if (!data.issues.find(i => i.id === ISSUE_ID)) {
      data.issues.push({ id: ISSUE_ID, description: 'Auto-generated issue for test', createdAt: new Date().toISOString() });
      fs.writeFileSync(PENDING, JSON.stringify(data, null, 2));
    }

    // Remove existing test file if present
    if (fs.existsSync(TEST_PATH)) fs.unlinkSync(TEST_PATH);
  });

  test('server endpoint generates and runs test for missing issue', async ({ request }) => {
    let r;
    const maxRetries = 10;
    for (let i = 0; i < maxRetries; i++) {
      r = await request.post('/api/run-issue-test', { data: { issueId: ISSUE_ID } });
      if (r && r.status() === 200) break;
      await new Promise(res => setTimeout(res, 1000));
    }

    if (r.status() !== 200) {
      const txt = await r.text();
      console.error('Run-issue-test failed after retries:', r.status(), txt);
    }

    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.issueId).toBe(ISSUE_ID);
    expect(body.testPath).toBe(`tests/issues/issue-${ISSUE_ID.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.spec.ts`);
    expect(body.summary).toBeDefined();

    // File should now exist
    expect(fs.existsSync(TEST_PATH)).toBeTruthy();
  });

  test.afterEach(async () => {
    // cleanup: don't delete the generated test to preserve audit, but ensure we can run multiple times
    // Optionally, remove test file: fs.unlinkSync(TEST_PATH);
  });
});