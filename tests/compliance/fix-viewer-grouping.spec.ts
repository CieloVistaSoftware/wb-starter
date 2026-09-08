/**
 * FIX VIEWER GROUPING — against the table, on a pinned data path
 * ==============================================================
 * #1061. These four tests waited on `.fix-card`, which the page no longer
 * renders; both render paths build `<table class="fix-table">`. Grouping itself
 * is intact — `groupFixes()` still wraps each group in `.fix-group` with a
 * `.group-header` — so the assertions survive; only what is counted inside a
 * group changed from a card to a row.
 *
 * Grouping is a feature of the FALLBACK path (it reads `data/fixes.json`'s
 * shape: behavior, status, date). The page prefers `/api/fixes` and falls back
 * only when that returns no rows, so `/api/fixes` is pinned EMPTY here. Without
 * that pin these tests took whichever path the repository's commit history
 * happened to produce — the reason the same code gave 14/28 one morning and
 * 0/28 hours later, which was misread as parallel-worker contention and
 * "fixed" twice by raising timeouts.
 */

import { test, expect, type Locator } from '@playwright/test';

const FIXES = {
  metadata: { version: '1.0.0' },
  fixes: {
    FIX_1: {
      errorId: 'FIX_1', behavior: 'comp-a', status: 'APPLIED', testRun: true,
      date: '2025-01-01T12:00:00Z', issue: 'Issue 1', fix: { file: 'f1.js', action: 'a1' },
    },
    FIX_2: {
      errorId: 'FIX_2', behavior: 'comp-a', status: 'INCOMPLETE', testRun: true,
      date: '2025-01-01T12:00:00Z', issue: 'Issue 2', fix: { file: 'f2.js', action: 'a2' },
    },
    FIX_3: {
      errorId: 'FIX_3', behavior: 'comp-b', status: 'APPLIED', testRun: true,
      date: '2025-01-02T12:00:00Z', issue: 'Issue 3', fix: { file: 'f3.js', action: 'a3' },
    },
  },
};

/** Rows inside one group — a group's members, whatever the row markup is. */
const rowsIn = (group: Locator): Locator => group.locator('table.fix-table tbody tr');

test.describe('Fix Viewer Grouping', () => {
  test.beforeEach(async ({ page }) => {
    // Empty traced result -> the fallback path, deterministically.
    await page.route('**/api/fixes', (route) => route.fulfill({ json: { counts: {}, rows: [] } }));
    await page.route('**/data/fixes.json*', (route) => route.fulfill({ json: FIXES }));

    await page.goto('/public/fix-viewer.html');
    await page.waitForSelector('table.fix-table tbody tr', { timeout: 30_000 });
  });

  test('defaults to no grouping', async ({ page }) => {
    await expect(page.locator('.group-header')).toHaveCount(0);
    await expect(page.locator('table.fix-table tbody tr')).toHaveCount(3);
  });

  test('groups by behavior', async ({ page }) => {
    await page.selectOption('#group-by', 'behavior');
    await page.waitForSelector('.group-header', { timeout: 10_000 });

    const headers = page.locator('.group-header');
    await expect(headers).toHaveCount(2);
    await expect(headers.nth(0)).toContainText('comp-a');
    await expect(headers.nth(1)).toContainText('comp-b');

    const groupA = page.locator('.fix-group').filter({ hasText: 'comp-a' });
    await expect(rowsIn(groupA)).toHaveCount(2);
    await expect(groupA.locator('tbody tr', { hasText: 'FIX_1' })).toHaveCount(1);
    await expect(groupA.locator('tbody tr', { hasText: 'FIX_2' })).toHaveCount(1);

    const groupB = page.locator('.fix-group').filter({ hasText: 'comp-b' });
    await expect(rowsIn(groupB)).toHaveCount(1);
    await expect(groupB.locator('tbody tr', { hasText: 'FIX_3' })).toHaveCount(1);
  });

  test('groups by status', async ({ page }) => {
    await page.selectOption('#group-by', 'status');
    await page.waitForSelector('.group-header', { timeout: 10_000 });

    await expect(page.locator('.group-header')).toHaveCount(2);
    await expect(rowsIn(page.locator('.fix-group').filter({ hasText: 'APPLIED' }))).toHaveCount(2);
    await expect(rowsIn(page.locator('.fix-group').filter({ hasText: 'INCOMPLETE' }))).toHaveCount(1);
  });

  test('groups by date', async ({ page }) => {
    await page.selectOption('#group-by', 'date');
    await page.waitForSelector('.group-header', { timeout: 10_000 });

    await expect(page.locator('.group-header')).toHaveCount(2);

    // The viewer localises the date, so the expected string is derived the same
    // way rather than hard-coded — a hard-coded "1/1/2025" is a test that fails
    // in another locale for no reason.
    const day1 = new Date('2025-01-01T12:00:00Z').toLocaleDateString();
    const day2 = new Date('2025-01-02T12:00:00Z').toLocaleDateString();

    await expect(rowsIn(page.locator('.fix-group').filter({ hasText: day1 }))).toHaveCount(2);
    await expect(rowsIn(page.locator('.fix-group').filter({ hasText: day2 }))).toHaveCount(1);
  });
});
