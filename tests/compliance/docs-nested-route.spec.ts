import { test, expect } from '@playwright/test';

test.describe('Docs nested route asset resolution', () => {
  test('renders /docs/testing-runbook.html without asset 404s and hydrates', async ({ page }) => {
    const failingResponses: Array<{url: string; status: number}> = [];
    const consoleErrors: string[] = [];

    page.on('response', res => {
      try {
        if (res.status() >= 400) failingResponses.push({ url: res.url(), status: res.status() });
      } catch (e) { /* best-effort */ }
    });

    page.on('console', msg => {
      try {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      } catch (e) { /* best-effort */ }
    });

    await page.goto('/docs/testing-runbook.html', { waitUntil: 'networkidle' });

    // Page content should be present and hydrated
    await expect(page.locator('h1')).toContainText('Testing & CI — Runbook');

    // No asset-level 4xx/5xx responses
    expect(failingResponses.length, `failing responses: ${JSON.stringify(failingResponses.slice(0,5))}`)
      .toBe(0);

    // No console errors
    expect(consoleErrors.slice(0,5), `console errors: ${JSON.stringify(consoleErrors.slice(0,5))}`)
      .toEqual([]);
  });
});
