import { test, expect } from '../fixtures/offline';

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
    const result = await page.evaluate(async () => {
      const { attachImageLoadRetry } = await import('/src/wb-viewmodels/media-load-retry.js');
      const img = document.createElement('img');
      img.src = '/images/does-not-exist-media-retry-test.svg';
      let failed = false;
      img.addEventListener('wb:image:load-failed', () => { failed = true; });
      document.getElementById('main')!.append(img);
      attachImageLoadRetry(img, { maxAttempts: 2, baseDelayMs: 10, checkTimeoutMs: 50 });
      img.remove();
      // Longer than every retry plus check window above, so a retry that was
      // going to give up has done so.
      await new Promise((r) => setTimeout(r, 600));
      return { failed, fallback: !!document.querySelector('.x-media-load-failed') };
    });
    expect(result.failed, 'a removed image was retried until it reported a load failure').toBe(false);
    expect(result.fallback).toBe(false);
  });

});
