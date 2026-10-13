import { test, expect } from '../fixtures/offline';

/**
 * #1886: the live Error Log on a static host. John: "fix all four".
 *
 * On GitHub Pages there is no server log (data/errors.json is gitignored) and
 * no clear API. The page said "No errors found. Great job! 🎉" there, which is
 * a false all-clear, and it had no way back to the site. The server is made
 * to look like Pages here: no log file (404), and nothing in this browser's
 * log.
 *
 * See it by hand: open the live viewer
 * (https://cielovistasoftware.github.io/wb-starter/public/errors-viewer.html).
 * Before: "Great job! 🎉", no link back, and a 404 in the console. Now: "This
 * browser has logged no errors on this site. There is no server log here
 * (static site).", a "Back to site" link, and no 404.
 */
test.describe('errors-viewer on a static host is honest (#1886)', () => {
  // page.route() mocks; sw.js would answer the fetches itself (#1349).
  test.use({ serviceWorkers: 'block' });

  test.beforeEach(async ({ page }) => {
    await page.route('**/data/errors.json*', (r) => r.fulfill({ status: 404, body: 'Not Found' }));
    await page.addInitScript(() => localStorage.removeItem('wb:error-log'));
    await page.goto('/public/errors-viewer.html');
  });

  test('with no server log, the empty state says so instead of "Great job"', async ({ page }) => {
    await expect(page.locator('#error-log-none-here')).toContainText('There is no server log here');
    await expect(page.locator('#error-container')).not.toContainText('Great job');
  });

  test('a link leads back to the site', async ({ page }) => {
    const back = page.locator('#errors-back');
    await expect(back).toBeVisible();
    await expect(back).toHaveAttribute('href', '../');
  });
});
