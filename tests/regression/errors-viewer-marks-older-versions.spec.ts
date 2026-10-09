import { test, expect } from '../fixtures/offline';
import { mergeIntoLog } from '../../scripts/lib/error-log-merge.mjs';
import { compareVersions } from '../../src/core/version-number.js';

/**
 * THE ERRORS VIEWER CAN TELL A FIXED ERROR FROM A CURRENT ONE (#1773)
 * ===================================================================
 * John's viewer still listed errors from Sep 28-29 whose causes were fixed by
 * Oct 7 (#1187): entries live on in the browser's `wb:error-log` and nothing
 * on them said which site version raised them. Every entry now records the
 * version it was first logged on (`version`) and the newest one it happened on
 * (`lastVersion`), and the viewer marks entries older than the running site.
 *
 * See it by hand: open public/errors-viewer.html in a browser holding entries
 * from before this change. Before: every entry looked current. Now: they read
 * "older version", dimmed and listed after the errors happening on this one.
 */

const fault = { level: 'error', source: 'x-mdhtml', url: '/index.html?page=behaviors' };

test.describe('errors-viewer marks entries from older site versions (#1773)', () => {
  // The 404 below is a page.route() mock; sw.js would answer it first (#1349).
  test.use({ serviceWorkers: 'block' });

  test.beforeEach(async ({ page }) => {
    await page.route('**/data/errors.json*', (r) => r.fulfill({ status: 404, body: 'Not Found' }));
  });

  test('logError() stamps the version the header badge shows', async ({ page }) => {
    await page.goto('/public/errors-viewer.html');
    const { entry, site } = await page.evaluate(async () => {
      document.documentElement.setAttribute('data-x-expected-errors', '');
      const { logError } = await import('/src/core/error-logger.js');
      const { VERSION } = await import('/src/core/version.js');
      const { versionNumber } = await import('/src/core/version-number.js');
      const logged = await logError('#1773 spec: stamped');
      return { entry: { version: logged.version, lastVersion: logged.lastVersion, commit: logged.commit }, site: { number: versionNumber(VERSION).number, commit: VERSION.commit } };
    });
    expect(entry.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(entry).toEqual({ version: site.number, lastVersion: site.number, commit: site.commit });
  });

  test('older entries are marked, dimmed and listed after current ones', async ({ page }) => {
    await page.goto('/public/errors-viewer.html');
    const current = await page.evaluate(() => (window as any).WBSiteVersion.number);
    const log = {
      errors: [
        { ...fault, id: 1, message: 'fixed long ago', timestamp: '2026-10-08T22:00:00.000Z', version: '1.0.1', lastVersion: '1.0.1' },
        { ...fault, id: 2, message: 'before versions were recorded', timestamp: '2026-10-08T21:00:00.000Z' },
        { ...fault, id: 3, message: 'happening now', timestamp: '2026-10-08T20:00:00.000Z', version: current, lastVersion: current },
        { ...fault, id: 4, message: 'came back', timestamp: '2026-10-08T19:00:00.000Z', version: '1.0.1', lastVersion: current },
      ],
    };
    await page.evaluate((l) => localStorage.setItem('wb:error-log', JSON.stringify(l)), log);
    await page.reload();

    await expect(page.locator('#total-count')).toHaveText('4');
    await expect(page.locator('#current-count')).toHaveText('2');
    await expect(page.locator('#current-label')).toHaveText(`On This Version (v${current})`);

    const cards = page.locator('.error-card');
    // Current first, newest first within each group.
    await expect(cards.locator('.error-title > span:last-child')).toHaveText(
      ['happening now', 'came back', 'fixed long ago', 'before versions were recorded']);
    await expect(page.locator('.error-card--older')).toHaveCount(2);
    await expect(cards.nth(2).locator('.source-badge--older')).toHaveText('older version');
    await expect(cards.nth(0).locator('.source-badge--older')).toHaveCount(0);
    await expect(cards.nth(1).locator('.source-badge--older')).toHaveCount(0);
    await expect(cards.nth(1)).toContainText(`first v1.0.1, last v${current}`);
    await expect(cards.nth(3)).toContainText('not recorded (logged before #1773)');
  });
});

test('the server log keeps the first version and moves lastVersion forward (#1773)', () => {
  const row = { ...fault, message: 'same fault' };
  let log = mergeIntoLog([], { ...row, id: 1, count: 1, timestamp: '2026-10-01T00:00:00Z', version: '1.0.9', lastVersion: '1.0.9' });
  log = mergeIntoLog(log, { ...row, id: 2, count: 1, timestamp: '2026-10-08T00:00:00Z', version: '1.0.10', lastVersion: '1.0.10' });
  expect(log).toHaveLength(1);
  expect(log[0].version).toBe('1.0.9');
  // Numeric, not string, order: 1.0.10 is newer than 1.0.9.
  expect(log[0].lastVersion).toBe('1.0.10');
});

test('compareVersions orders numerically and puts unrecorded first (#1773)', () => {
  expect(compareVersions('1.0.9', '1.0.10')).toBeLessThan(0);
  expect(compareVersions('1.0.448', '1.0.448')).toBe(0);
  expect(compareVersions('2.0.0', '1.9.99')).toBeGreaterThan(0);
  expect(compareVersions(undefined, '1.0.0')).toBeLessThan(0);
  expect(compareVersions(undefined, undefined)).toBe(0);
});
