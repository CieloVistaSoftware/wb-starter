import { test, expect } from '../fixtures/offline';

/**
 * THE ERROR LOG VIEWER CAN HAND ITS LIST OVER (#1678)
 * ==================================================
 * John, 2026-10-07: "add the copy button to errors-viewer". On GitHub Pages the
 * log lives only in the visitor's localStorage (#1000), so "fix all of these"
 * on the live viewer named a list nobody else could read. Copy puts every
 * error on screen on the clipboard, one line each, in screen order.
 *
 * See it by hand: open the live viewer in a browser that has visited the site,
 * click Copy, paste. Before: no Copy button. Now: one line per error --
 * level, source, message, repeat count, location, page and time.
 */

const LOCAL_LOG = {
  errors: [
    { id: 1, timestamp: '2026-10-05T22:00:00.000Z', level: 'error', source: 'x-mdhtml', message: 'mdhtml Unexpected\n  Error', url: '/index.html?page=themes', count: 1 },
    {
      id: 2, timestamp: '2026-10-05T22:01:00.000Z', level: 'warning', source: 'x-audio', message: 'audio failed to load',
      url: '/index.html?page=home', module: 'src/wb-viewmodels/audio.js', line: 12, column: 5, function: 'load', count: 2,
    },
  ],
};

test.describe('errors-viewer Copy (#1678)', () => {
  // The 404 below is a page.route() mock; sw.js would answer it first (#1349).
  test.use({ serviceWorkers: 'block', permissions: ['clipboard-read', 'clipboard-write'] });

  test.beforeEach(async ({ page }) => {
    await page.route('**/data/errors.json*', (r) => r.fulfill({ status: 404, body: 'Not Found' }));
  });

  test('copies every shown error, one line each, newest first', async ({ page }) => {
    await page.addInitScript((log) => localStorage.setItem('wb:error-log', JSON.stringify(log)), LOCAL_LOG);
    await page.goto('/public/errors-viewer.html');
    await expect(page.locator('#total-count')).toHaveText('2');

    const copy = page.locator('#copy-errors');
    await copy.click();
    await expect(copy).toHaveText('Copied 2');

    const lines = (await page.evaluate(() => navigator.clipboard.readText())).split('\n');
    expect(lines).toHaveLength(2);
    // Newest first, as on screen; location and repeat count carried.
    expect(lines[0]).toMatch(/^\[WARNING\] x-audio: audio failed to load ×2 — src\/wb-viewmodels\/audio\.js:12:5 in load\(\) — \/index\.html\?page=home — /);
    // A multi-line message stays on its one line; no location means none printed.
    expect(lines[1]).toMatch(/^\[ERROR\] x-mdhtml: mdhtml Unexpected Error — \/index\.html\?page=themes — /);
  });

  test('an empty log says so instead of copying nothing', async ({ page }) => {
    await page.goto('/public/errors-viewer.html');
    await expect(page.locator('#total-count')).toHaveText('0');
    const copy = page.locator('#copy-errors');
    await copy.click();
    await expect(copy).toHaveText('Nothing to copy');
  });
});
