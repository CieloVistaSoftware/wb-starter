/**
 * FIX VIEWER — THE TABLE THE PAGE ACTUALLY RENDERS
 * ================================================
 * #1061. These 28 tests (with fix-viewer-grouping.spec.ts) blocked in
 * `beforeEach` on `waitForSelector('.fix-card', { timeout: 30000 })` — an
 * element the page stopped producing. Both render paths build a
 * `<table class="fix-table">`; `grep -c "x-fix-card" public/fix-viewer.html`
 * is 0. Measured on clean main: 0/28 passed, all as 30-second timeouts.
 *
 * The card view was not lost by accident. John, on the card grid: "i don't like
 * this format", "it tells me nothing. I need to be able to track fixes back to
 * the issue and then what release they were put into", and "remember the issue
 * is the source of truth everything else should build on that". The table is
 * that answer, so this file asserts the table.
 *
 * WHY THESE USED TO LOOK FLAKY
 * ----------------------------
 * The old waits were repeatedly raised (15s → 30s) with careful notes blaming
 * parallel-worker contention. That was never it. The page prefers `/api/fixes`
 * and only falls back to the mocked `data/fixes.json` when the traced endpoint
 * returns NO rows:
 *
 *   if (Array.isArray(t.rows) && t.rows.length) { renderTraced(t); return; }
 *
 * `/api/fixes` builds its rows from git — commits citing issues. So the result
 * depended on the repository's commit history at the moment the suite ran, and
 * the same test code gave 14/28 in the morning and 0/28 hours later. A gate
 * whose verdict is a function of git state is untrustworthy in BOTH directions,
 * including when it passes.
 *
 * So both paths are pinned here. Nothing in this file consults real git.
 *
 * Assertions that did not survive the move are gone rather than transliterated:
 * "no cards taller than 500px" and "consistent card layout" have no meaning for
 * table rows. What replaces them is what the table has to guarantee — that
 * every issue is one row, and that its state and release are readable.
 */

import { test, expect, type Page } from '@playwright/test';

/**
 * A fixed traced payload: the primary path, independent of git.
 *
 * The field names MIRROR the live endpoint and are not invented. Taken from
 * `GET /api/fixes` on a running server:
 *
 *   row keys: number, title, state, url, closedAt, priority, commits, files, release
 *
 * The first draft of this fixture used `issue` instead of `number` and the
 * table rendered "#" with nothing after it — a fixture that does not match the
 * contract tests the fixture, not the page.
 */
const TRACED = {
  counts: { traced: 3, closed: 2, open: 1, released: 2, unreleased: 1 },
  rows: [
    {
      number: 101, url: 'https://github.com/CieloVistaSoftware/wb-starter/issues/101',
      title: 'Buttons lost their focus ring', state: 'closed', priority: 'priority:1',
      release: 'v4.0.2', closedAt: '2026-09-01T00:00:00Z',
      commits: [{ sha: 'aaaaaaaa', subject: 'fix(#101): restore the focus ring', url: 'https://example.invalid/aaaaaaaa' }],
      files: [{ path: 'src/styles/behaviors/button.css', url: 'https://example.invalid/aaaaaaaa/button.css' }],
    },
    {
      number: 102, url: 'https://github.com/CieloVistaSoftware/wb-starter/issues/102',
      title: 'Table sort broke on dates', state: 'closed', release: 'v4.0.2',
      closedAt: '2026-09-02T00:00:00Z',
      commits: [{ sha: 'bbbbbbbb', subject: 'fix(#102): compare dates as dates', url: 'https://example.invalid/bbbbbbbb' }],
      files: [{ path: 'src/wb-viewmodels/semantics/table.js', url: 'https://example.invalid/bbbbbbbb/table.js' }],
    },
    {
      number: 103, url: 'https://github.com/CieloVistaSoftware/wb-starter/issues/103',
      title: 'Still being worked on', state: 'open', release: null, closedAt: null,
      commits: [{ sha: 'cccccccc', subject: 'wip(#103)', url: 'https://example.invalid/cccccccc' }],
      files: [],
    },
  ],
};

/** The fallback payload, used only when the traced endpoint yields nothing. */
const FALLBACK = {
  fixes: {
    TEST_FIX_001: {
      errorId: 'TEST_FIX_001', behavior: 'semantics/button.js',
      errorSignature: 'Focus ring missing', issue: 'Focus ring missing',
      cause: 'Outline removed', testRun: true, status: 'APPLIED',
      date: '2025-12-28T12:00:00Z',
    },
    TEST_FIX_MISSING_TEST: {
      errorId: 'TEST_FIX_MISSING_TEST', behavior: 'semantics/input.js',
      errorSignature: 'Error without test', issue: 'Issue without test verification',
      cause: 'Cause unknown', status: 'APPLIED', date: '2025-12-28T12:00:00Z',
    },
    // #1077 — an entry carrying its issue the only way data/fixes.json can:
    // written into the prose. `normalise()` recovers it with /#(\d{3,4})/, and
    // that recovered number is what has to become a link. The two entries above
    // are the negative case and are deliberately unlike each other: one has no
    // `issue` at all, the other has a non-numeric `issue` string. Rendering
    // `#${issue}` blindly would print "#Issue without test verification" and
    // point at /issues/Issue%20without... — a link that resolves to nothing.
    TEST_FIX_WITH_ISSUE: {
      errorId: 'TEST_FIX_WITH_ISSUE', behavior: 'semantics/table.js',
      title: 'Sorting ignored the rendered date (#1011)',
      problem: 'Text sort applied to a date column',
      testRun: true, status: 'APPLIED', date: '2025-12-29T12:00:00Z',
    },
  },
};

/** Pin BOTH data paths. `traced` decides which one the page takes. */
async function openViewer(page: Page, opts: { traced: boolean }): Promise<void> {
  await page.route('**/api/fixes', (route) =>
    route.fulfill({ json: opts.traced ? TRACED : { counts: {}, rows: [] } }),
  );
  await page.route('**/data/fixes.json*', (route) => route.fulfill({ json: FALLBACK }));

  await page.goto('/public/fix-viewer.html');
  // The table is the readiness signal on both paths. No arbitrary sleep: the
  // page paints rows as soon as its (now local) fetch resolves.
  await page.waitForSelector('table.fix-table tbody tr', { timeout: 30_000 });
}

test.describe('Fix Viewer — traced path (/api/fixes)', () => {
  test.beforeEach(async ({ page }) => openViewer(page, { traced: true }));

  test('renders one row per issue', async ({ page }) => {
    await expect(page.locator('table.fix-table tbody tr')).toHaveCount(TRACED.rows.length);
  });

  test('the issue number is the spine of the row, and links to the issue', async ({ page }) => {
    const link = page.locator('td.fix-cell--id a').first();
    await expect(link).toHaveText('#101');
    await expect(link).toHaveAttribute('href', /issues\/101$/);
  });

  test('open and closed are distinguishable, not just present', async ({ page }) => {
    // The whole point of the column: John asked for "the open issue/closed
    // issue should be specified in fix viewer for each row".
    await expect(page.locator('.fix-state--closed')).toHaveCount(2);
    await expect(page.locator('.fix-state--open')).toHaveCount(1);
  });

  test('a released fix names its release; an unreleased one says so', async ({ page }) => {
    await expect(page.locator('.fix-rel', { hasText: 'v4.0.2' })).toHaveCount(2);
    await expect(page.locator('.fix-rel--none')).toHaveCount(1);
  });

  test('every named file is a link, so a fix can be read at the commit that made it', async ({ page }) => {
    const fileLinks = page.locator('td.fix-cell--files a.fix-file');
    await expect(fileLinks).toHaveCount(2);   // rows 101 and 102; 103 has none
    await expect(fileLinks.first()).toHaveAttribute('href', /aaaaaaaa/);
  });

  test('a fix with no recorded files says so rather than rendering an empty cell', async ({ page }) => {
    const row = page.locator('tbody tr', { hasText: 'Still being worked on' });
    await expect(row.locator('.fix-none')).toContainText('none recorded');
  });

  test('the count line reports what the table holds', async ({ page }) => {
    await expect(page.locator('#fix-count')).toContainText('3 issues traced');
    await expect(page.locator('#fix-count')).toContainText('2 closed');
    await expect(page.locator('#fix-count')).toContainText('1 open');
  });

  test('the page renders without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.reload();
    await page.waitForSelector('table.fix-table tbody tr', { timeout: 30_000 });
    expect(errors, `the viewer threw while rendering:\n${errors.join('\n')}`).toEqual([]);
  });

  test('no duplicate element ids', async ({ page }) => {
    const dupes = await page.evaluate(() => {
      const seen: Record<string, number> = {};
      document.querySelectorAll('[id]').forEach((e) => { seen[e.id] = (seen[e.id] || 0) + 1; });
      return Object.entries(seen).filter(([, n]) => n > 1).map(([id]) => id);
    });
    expect(dupes, 'duplicate ids break every getElementById on the page').toEqual([]);
  });
});

test.describe('Fix Viewer — fallback path (data/fixes.json)', () => {
  // Reached only when the traced endpoint returns no rows. Pinned to empty here
  // so this path is exercised deliberately rather than whenever git happens to
  // look a certain way.
  test.beforeEach(async ({ page }) => openViewer(page, { traced: false }));

  test('falls back to the static file and still renders a table', async ({ page }) => {
    await expect(page.locator('table.fix-table')).toBeVisible();
    await expect(page.locator('table.fix-table tbody tr')).toHaveCount(
      Object.keys(FALLBACK.fixes).length,
    );
  });

  test('a fix with no test run is not presented as verified', async ({ page }) => {
    // The original assertion, kept because it still means something: a fix
    // nobody proved must not read as proven.
    const row = page.locator('tbody tr', { hasText: 'TEST_FIX_MISSING_TEST' });
    await expect(row).toHaveCount(1);
    await expect(row).not.toContainText('VERIFIED');
  });

  /**
   * #1077 — John: "add a link to the issue number in fix viewer".
   *
   * The traced path has linked the issue since #912. This path — the ONLY one
   * the deployed site takes, because /api/fixes needs the dev server — had no
   * Issue column at all, so on the published site a fix could not be traced to
   * its issue. `normalise()` was already computing the number and spending it
   * entirely on search relevance.
   */
  test('a recovered issue number is a link to that issue', async ({ page }) => {
    const link = page.locator('td.fix-cell--issue a');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveText('#1011');
    await expect(link).toHaveAttribute(
      'href',
      'https://github.com/CieloVistaSoftware/wb-starter/issues/1011',
    );
  });

  test('an entry with no issue number renders a dash, never a link to nowhere', async ({ page }) => {
    // Both negative entries must produce a cell that exists and holds no anchor.
    // Asserting only "no bad link" would also pass if the column were missing.
    const cells = page.locator('td.fix-cell--issue');
    await expect(cells).toHaveCount(Object.keys(FALLBACK.fixes).length);

    for (const id of ['TEST_FIX_001', 'TEST_FIX_MISSING_TEST']) {
      const cell = page.locator('tbody tr', { hasText: id }).locator('td.fix-cell--issue');
      await expect(cell).toHaveText('—');
      await expect(cell.locator('a')).toHaveCount(0);
    }
  });

  test('the Issue column is headed, so the number is readable as an issue', async ({ page }) => {
    await expect(page.locator('table.fix-table thead th', { hasText: 'Issue' })).toHaveCount(1);
  });
});
