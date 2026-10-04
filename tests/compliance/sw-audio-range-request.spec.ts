/**
 * sw.js's range-request bypass had no .catch() — <audio>/<video> elements
 * commonly issue a small probe range request that gets superseded and
 * aborted the instant a real range request follows, and that abort
 * rejected the bare fetch() with no handler, surfacing as "Uncaught (in
 * promise) TypeError: Failed to fetch" on every playback of demos/sample.wav
 * even though the actual range request the player needed succeeded fine.
 */
import { test, expect } from '../fixtures/offline';

// The one spec that needs the service worker: it registers sw.js itself and
// tests the worker's own range-request handling. Workers are blocked by
// default (#1362).
test.use({ serviceWorkers: 'allow' });

test.describe('service worker: audio range requests do not throw unhandled rejections', () => {
  test('playing demos/sample.wav produces no console errors', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForSelector('#mainPage-home', { timeout: 20000 });

    // #1108: main.js never registers sw.js on a development origin, and the
    // test origin is localhost, so register the real worker here. sw.js's
    // activate calls clients.claim(), so this page becomes controlled without
    // a reload — a reload would hand the page to main.js, which removes it.
    await page.evaluate(async () => {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
    });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, undefined, { timeout: 10000 });

    const audio = page.locator('audio').first();
    await expect(audio).toBeAttached();
    // Fire play() without awaiting its promise — CI runners with no real
    // audio device can leave that promise permanently unsettled (neither
    // resolving nor rejecting), which previously hung this whole test at
    // Playwright's evaluate() timeout. The test only needs the range
    // request itself to fire, not for playback to actually start.
    await audio.evaluate((el: HTMLAudioElement) => {
      el.play().catch(() => {});
    });
    await page.waitForTimeout(1500);

    const swErrors = consoleErrors.filter((e) => e.includes('sw.js') || e.includes('Failed to fetch'));
    expect(swErrors, `expected no service-worker fetch errors, got: ${swErrors.join(' | ')}`).toEqual([]);
    expect(pageErrors, `expected no uncaught page errors, got: ${pageErrors.join(' | ')}`).toEqual([]);
  });
});
