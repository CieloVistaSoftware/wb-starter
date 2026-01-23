import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'issues.json');

test.describe('Issues (header) - Home & Builder', () => {
  test('Home: clicking header Issues opens modal, defaults set, and saves to data/issues.json', async ({ page }) => {
    await page.goto('/');

    // Wait for header Issues toggle
    await page.waitForSelector('#issuesToggle');
    await page.click('#issuesToggle');

    // Modal should be visible
    await page.waitForSelector('.wb-issues-dialog', { state: 'visible' });

    // Check defaults: Type bug and Priority numeric 2 after save
    // Ensure description present and submit
    const description = `Test issue from header ${Date.now()}`;
    await page.fill('.wb-issues-form textarea[name="description"]', description);

    // Submit
    await page.click('.wb-issues-submit-btn');

    // Wait for saved confirmation text on button
    await page.waitForSelector('.wb-issues-submit-btn:has-text("✅ Saved!")', { timeout: 3000 }).catch(() => {});

    // Give server a moment to write file
    await page.waitForTimeout(500);

    // Read data/issues.json and assert an entry with description and Priority: 2 exists
    const raw = fs.existsSync(dataPath) ? fs.readFileSync(dataPath, 'utf8') : '{}';
    const parsed = raw ? JSON.parse(raw) : {};

    // New submissions are stored as single object or submissions array (server handles both)
    const submissions = parsed.submissions || (parsed.content ? [parsed] : []);
    const found = submissions.find(s => s.content && s.content.includes(description));

    expect(found).toBeTruthy();
    if (found) {
      // Priority line should be present in content
      expect(found.content).toContain('Priority: 2');
      expect(found.content).toMatch(/\[BUG\]/i);
    }
  });

  test('Builder: header Issues opens same modal', async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForSelector('#issuesToggle');
    await page.click('#issuesToggle');
    await page.waitForSelector('.wb-issues-dialog', { state: 'visible' });
    // Close it
    await page.click('.wb-issues-header .wb-issues-close');
    await page.waitForSelector('.wb-issues-dialog', { state: 'hidden' });
  });
});