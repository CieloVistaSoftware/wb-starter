import { test, expect } from '@playwright/test';

test('media retry keeps real failure reporting independent of demo readiness', async ({ page }) => {
  await page.goto('/demos/site/content.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).__WB_DEMO_INITIALIZED__ === true, { timeout: 20000 });

  const result = await page.evaluate(async () => {
    const { attachImageLoadRetry } = await import('/src/wb-viewmodels/media-load-retry.js');
    const image = document.createElement('img');
    image.src = '/missing-media-retry-regression.png';
    document.body.append(image);

    const failure = new Promise<CustomEvent>((resolve) => {
      image.addEventListener('wb:image:load-failed', (event) => resolve(event as CustomEvent), { once: true });
    });
    attachImageLoadRetry(image, { maxAttempts: 2, baseDelayMs: 10, checkTimeoutMs: 10 });
    const event = await failure;
    return {
      attempts: event.detail.attempts,
      failedClass: image.classList.contains('wb-img--load-failed'),
      fallbackVisible: Boolean(image.nextElementSibling?.classList.contains('wb-media-load-failed')),
    };
  });

  expect(result).toEqual({ attempts: 2, failedClass: true, fallbackVisible: true });
});