/**
 * sw.js's range-request bypass had no .catch() — <audio>/<video> elements
 * commonly issue a small probe range request that gets superseded and
 * aborted the instant a real range request follows, and that abort
 * rejected the bare fetch() with no handler, surfacing as "Uncaught (in
 * promise) TypeError: Failed to fetch" on every playback of demos/sample.wav
 * even though the actual range request the player needed succeeded fine.
 */
import { test, expect } from '@playwright/test';

test.describe('service worker: audio range requests do not throw unhandled rejections', () => {
  test('playing demos/sample.wav produces no console errors', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('http://localhost:3000/');
    await page.waitForSelector('#mainPage-home', { timeout: 20000 });

    // Fresh SW registration so this test exercises the current sw.js, not a
    // stale one from a prior run against the same dev server.
    await page.evaluate(async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    });
    await page.reload();
    await page.waitForSelector('#mainPage-home', { timeout: 20000 });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, { timeout: 10000 });

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
