import { test, expect } from '@playwright/test';

test.describe('Error viewer routes', () => {
  for (const route of ['/errors-viewer', '/errors-viewer.html', '/public/errors-viewer.html']) {
    test(`${route} serves the error viewer`, async ({ request }) => {
      const response = await request.get(route);

      expect(response.status()).toBe(200);
      expect(await response.text()).toContain('<title>WB Error Log Viewer</title>');
    });
  }
});