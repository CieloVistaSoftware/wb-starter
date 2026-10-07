import { test, expect } from '../fixtures/offline';
import { networkBarrier } from '../base';

/**
 * #997 CI: error-log-empty failed with eight "Image failed to load after 5
 * attempt(s): /images/placeholder.svg?_retry=..." entries from ?page=behaviors.
 * The files exist. The Behaviors page replaces its example on every row click,
 * and media-load-retry kept retrying the replaced <img> -- detached, so it never
 * loaded -- then logged it as missing. An element no longer in the document is
 * not a load failure.
 */
test.describe('media-load-retry', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?page=about');
    await page.waitForFunction(() => (window as any).WBSite?.currentPage === 'about');
  });

  test('an image removed before it loads is not retried or reported as missing', async ({ page }) => {
    // The retry module decides on the image's own error event, then on its
    // baseDelayMs / checkTimeoutMs timers (#1516: not a 600ms window). The
    // page's clock is driven from here so those timers fire on cue, and every
    // request for the file is counted, so a retry that does go out is seen.
    await page.clock.install();
    const requests: string[] = [];
    page.on('request', (r) => { if (r.url().includes('does-not-exist-media-retry-test.svg')) requests.push(r.url()); });
    await page.evaluate(async () => {
      const { attachImageLoadRetry } = await import('/src/wb-viewmodels/media-load-retry.js');
      const img = document.createElement('img');
      const errored = new Promise((r) => img.addEventListener('error', r, { once: true }));
      img.src = '/images/does-not-exist-media-retry-test.svg';
      (window as any).__retryProbe = { failed: false };
      img.addEventListener('wb:image:load-failed', () => { (window as any).__retryProbe.failed = true; });
      document.getElementById('main')!.append(img);
      attachImageLoadRetry(img, { maxAttempts: 2, baseDelayMs: 10, checkTimeoutMs: 50 });
      img.remove();
      // The first load has failed: the module has now had its chance to decide.
      await errored;
    });
    // Past every retry delay and check window above, then make sure any retry
    // request has reached the listener.
    await page.clock.runFor(1000);
    await networkBarrier(page);
    const result = await page.evaluate(() => ({
      failed: (window as any).__retryProbe.failed,
      fallback: !!document.querySelector('.x-media-load-failed'),
    }));
    expect(result.failed, 'a removed image was retried until it reported a load failure').toBe(false);
    expect(result.fallback).toBe(false);
    expect(requests.filter((u) => u.includes('_retry=')), 'a removed image was retried').toEqual([]);
  });

});
