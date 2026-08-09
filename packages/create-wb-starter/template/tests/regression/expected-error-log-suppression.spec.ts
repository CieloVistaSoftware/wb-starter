import { test, expect } from '@playwright/test';

test('expected fixture errors stay out of the persistent error log', async ({ page }) => {
  let appendRequests = 0;
  await page.route('**/api/error-log/append', async route => {
    appendRequests += 1;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });

  await page.goto('/demos/legacy-syntax-check.html');
  await expect.poll(() => appendRequests).toBe(0);

  await page.goto('/demos/test-harness.html');
  await page.evaluate(() => {
    const container = document.createElement('div');
    container.innerHTML = '<wb-audio src="/tests/fixtures/broken-audio-0-bytes.mp3"></wb-audio>';
    document.body.appendChild(container);
    return (window as any).WB.scan(container);
  });
  await page.waitForTimeout(1500);
  expect(appendRequests).toBe(0);

  await page.evaluate(async () => {
    document.documentElement.removeAttribute('data-wb-expected-errors');
    const { logError } = await import('/src/core/error-logger.js');
    await logError('unmarked regression error');
  });
  expect(appendRequests).toBe(1);
});