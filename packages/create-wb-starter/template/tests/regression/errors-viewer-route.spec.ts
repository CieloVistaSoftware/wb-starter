import { test, expect } from '../fixtures/offline';

test.describe('Error viewer routes', () => {
  // Asserted in a real page, not on the raw response body. /errors-viewer.html
  // is deliberately a forwarding stub (see the file: GitHub Pages is static,
  // so server.js's route does not exist on the deployed site, and a real file
  // at that URL is the only route a static host understands). Its body is the
  // stub, so a body check failed on the fix itself. What a reader gets is the
  // page they land on.
  for (const route of ['/errors-viewer', '/errors-viewer.html', '/public/errors-viewer.html']) {
    test(`${route} serves the error viewer`, async ({ page }) => {
      const response = await page.goto(route);

      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle('WB Error Log Viewer');
    });
  }
});
