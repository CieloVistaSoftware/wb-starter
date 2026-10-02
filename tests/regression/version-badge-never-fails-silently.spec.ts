import { test, expect } from '../fixtures/offline';
import { wbIdle } from '../base';

/**
 * John, 2026-10-02: "i clicked the version button and in progress shows this.
 * you are lying to me again" -- the badge still read v1.0.83 and nothing said
 * why. On localhost, a click that does not update must SAY why: no endpoint,
 * test-mode server, refused pull or failed request alike.
 */
async function clickBadge(page: import('@playwright/test').Page, answer: (route: import('@playwright/test').Route) => Promise<void>) {
  await page.route('**/api/update-to-latest', answer);
  await page.goto('/');
  const badge = page.locator('[x-release]').first();
  await expect(badge).toHaveText(/^v\d+\.\d+\.\d+$/, { timeout: 15000 });
  // The site's first navigation (home routing) must finish, or the click
  // waits on it -- a wait on readiness, not a sleep (#962).
  await page.waitForLoadState('load');
  await wbIdle(page);
  // Dismissed by a handler, not awaited after the click: the alert blocks the
  // page, and a click that waits for the reload behind it would deadlock.
  const message = new Promise<string>((resolve) => {
    page.once('dialog', async (d) => { resolve(d.message()); await d.dismiss(); });
  });
  await badge.click({ noWaitAfter: true });
  return message;
}

test('a server without the update endpoint is named, not silently reloaded', async ({ page }) => {
  const msg = await clickBadge(page, (r) => r.fulfill({ status: 404, body: '' }));
  expect(msg).toContain('has no update endpoint (HTTP 404)');
  expect(msg).toContain('This page is served from: http://localhost');
});

test('a test-mode server says so instead of reloading in silence', async ({ page }) => {
  const msg = await clickBadge(page, (r) => r.fulfill({ json: { updated: false, message: 'test server: not updating' } }));
  expect(msg).toContain('test server: not updating');
});

test('a refused pull shows the server\'s reason', async ({ page }) => {
  const msg = await clickBadge(page, (r) => r.fulfill({ json: { updated: false, message: 'not updated: you have uncommitted changes (a.js), left untouched' } }));
  expect(msg).toContain('uncommitted changes (a.js)');
});
