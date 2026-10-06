import { test, expect } from '../fixtures/offline';

/**
 * THE LIVE ERROR LOG VIEWER CAN CLEAR WHAT IT SHOWS (#1568)
 * ========================================================
 * John, on https://cielovistasoftware.github.io/wb-starter/public/errors-viewer.html:
 * "fix these". On GitHub Pages there is no server, so error-logger.js keeps the
 * log in this browser's localStorage (`wb:error-log`) and the viewer shows it
 * (#1000). Clear Log only POSTed to /api/error-log/clear -- which a static host
 * does not have -- so it alerted "Failed to clear errors" and every entry
 * stayed on screen.
 *
 * The server is made to look like GitHub Pages here: no log file (404) and no
 * API (405, what Pages answers a POST with).
 *
 * See it by hand: Open the live viewer in a browser that has visited the site,
 * click Clear Log and confirm. Before: "Failed to clear errors", and the list
 * was unchanged. Now: the list is empty and there is no alert.
 */

const LOCAL_LOG = {
  errors: [
    { id: 1, timestamp: '2026-10-05T22:00:00.000Z', level: 'error', source: 'x-mdhtml', message: 'mdhtml Unexpected Error', url: '/index.html?page=themes', count: 1 },
    { id: 2, timestamp: '2026-10-05T22:01:00.000Z', level: 'error', source: 'x-audio', message: 'audio failed to load', url: '/index.html?page=home', count: 2 },
  ],
};

test.describe('errors-viewer Clear Log on a static host (#1568)', () => {
  // The 404/405 answers below are page.route() mocks. sw.js would answer the
  // page's fetches itself and the mocks would never apply (#1349).
  test.use({ serviceWorkers: 'block' });

  test.beforeEach(async ({ page }) => {
    await page.route('**/data/errors.json*', (r) => r.fulfill({ status: 404, body: 'Not Found' }));
    await page.route('**/api/error-log/clear', (r) => r.fulfill({ status: 405, body: 'Method Not Allowed' }));
    await page.addInitScript((log) => {
      if (!sessionStorage.getItem('seeded-1568')) {
        localStorage.setItem('wb:error-log', JSON.stringify(log));
        sessionStorage.setItem('seeded-1568', '1');
      }
    }, LOCAL_LOG);
  });

  test('Clear Log empties the browser log, with no failure alert', async ({ page }) => {
    await page.goto('/public/errors-viewer.html');
    await expect(page.locator('#total-count')).toHaveText('2');

    const dialogs: string[] = [];
    page.on('dialog', async (d) => {
      dialogs.push(`${d.type()}: ${d.message()}`);
      await d.accept();
    });
    await page.getByRole('button', { name: /Clear Log/ }).click();

    await expect(page.locator('#total-count')).toHaveText('0');
    expect(await page.evaluate(() => localStorage.getItem('wb:error-log')), 'the browser log must be gone').toBeNull();
    expect(dialogs.filter((d) => d.startsWith('alert')), 'a static host has no server log; that is not a failure').toEqual([]);

    // And it stays cleared on the next visit.
    await page.reload();
    await expect(page.locator('#total-count')).toHaveText('0');
  });

  test('a real server failure is still reported', async ({ page }) => {
    await page.unroute('**/api/error-log/clear');
    await page.route('**/api/error-log/clear', (r) => r.fulfill({ status: 500, body: 'boom' }));
    await page.goto('/public/errors-viewer.html');
    await expect(page.locator('#total-count')).toHaveText('2');

    const alerts: string[] = [];
    page.on('dialog', async (d) => {
      if (d.type() === 'alert') alerts.push(d.message());
      await d.accept();
    });
    await page.getByRole('button', { name: /Clear Log/ }).click();
    await expect.poll(() => alerts).toEqual([expect.stringContaining('HTTP 500')]);
  });
});

test('demos/pre-debug.html loads its pre() module (#1568)', async ({ page }) => {
  const missing: string[] = [];
  page.on('response', (r) => { if (r.status() === 404 && r.url().endsWith('.js')) missing.push(r.url()); });
  await page.goto('/demos/pre-debug.html', { waitUntil: 'load' });
  await page.waitForLoadState('networkidle');
  expect(missing, 'pre-debug.html imports a module that does not exist').toEqual([]);
});
