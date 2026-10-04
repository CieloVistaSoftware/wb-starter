import { test, expect } from '../fixtures/offline';

/**
 * #1342 case 2 -- attachLoadRetry reads the element's CURRENT state when it
 * attaches, instead of starting a blind readiness clock.
 *
 * media-load-retry.js attached its 'error' listener and then started a
 * checkTimeoutMs (4s) clock without ever asking the element whether it had
 * already settled. A media element starts fetching when it is parsed and the
 * lazy runtime enhances it much later, so the one 'error' event was long gone:
 * an already-failed element was not noticed until that first 4s window
 * elapsed, and only then began walking the retry ladder -- the ~25-30s of
 * silence recorded on #371. config.isReady() answered the positive half of the
 * question; nothing answered the negative half.
 *
 * Both tests make the failure complete first, then attach with a deliberately
 * huge checkTimeoutMs. Reaching the failure report at all therefore proves the
 * report did NOT come from the readiness clock -- it came from reading the
 * element on attach.
 *
 *   red:   no report within 2s (the clock has 30s to go), elapsed === null.
 *   green: reported in tens of ms.
 */

// src/main.js registers a service worker and Playwright cannot route a service
// worker's requests, so without this the routes below are silently ignored and
// the tests measure the real network instead of the mock (#1349).
test.use({ serviceWorkers: 'block' });

// Remote, per #762 -- aborted here rather than committed as files.
const DEAD_VIDEO = 'https://cdn.pixabay.com/video/2024/02/09/wb-1342-helper-probe.mp4';
const DEAD_IMAGE = 'https://picsum.photos/seed/wb-1342-helper-probe/640/360';

// A clock long enough that it cannot be the thing that reports.
const NEVER = 30_000;

test.beforeEach(async ({ page }) => {
  await page.route(/wb-1342-helper-probe/, (r) => r.abort('failed'));
  await page.goto('/tests/fixtures/blank.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.documentElement.setAttribute('data-x-expected-errors', ''));
});

test('a <video> that already failed is detected when the retry helper attaches', async ({ page }) => {
  test.setTimeout(30_000);
  const result = await page.evaluate(
    async ([src, never]) => {
      const { attachVideoLoadRetry } = await import('/src/wb-viewmodels/media-load-retry.js');
      const video = document.createElement('video');
      video.src = src as string;
      document.body.append(video);

      await new Promise<void>((resolve) => {
        if (video.error) return resolve();
        video.addEventListener('error', () => resolve(), { once: true });
        setTimeout(resolve, 10_000);
      });
      const errorBeforeAttach = video.error ? video.error.code : null;

      const startedAt = Date.now();
      const reported = new Promise<number>((resolve) => {
        video.addEventListener('wb:video:load-failed', () => resolve(Date.now() - startedAt), { once: true });
      });
      attachVideoLoadRetry(video, { maxAttempts: 2, baseDelayMs: 10, checkTimeoutMs: never as number });

      const elapsed = await Promise.race([reported, new Promise<null>((r) => setTimeout(() => r(null), 2000))]);
      return { errorBeforeAttach, elapsed };
    },
    [DEAD_VIDEO, NEVER] as const,
  );

  expect(result.errorBeforeAttach, 'precondition: the video had already failed before attach').not.toBeNull();
  expect(result.elapsed, 'an already-failed <video> must be detected on attach, not by the readiness clock').not.toBeNull();
});

test('an <img> that already failed is detected when the retry helper attaches', async ({ page }) => {
  test.setTimeout(30_000);
  const result = await page.evaluate(
    async ([src, never]) => {
      const { attachImageLoadRetry } = await import('/src/wb-viewmodels/media-load-retry.js');
      const image = document.createElement('img');
      image.src = src as string;
      document.body.append(image);

      await new Promise<void>((resolve) => {
        if (image.complete) return resolve();
        image.addEventListener('error', () => resolve(), { once: true });
        image.addEventListener('load', () => resolve(), { once: true });
        setTimeout(resolve, 10_000);
      });
      const failedBeforeAttach = image.complete && image.naturalWidth === 0;

      const startedAt = Date.now();
      const reported = new Promise<number>((resolve) => {
        image.addEventListener('wb:image:load-failed', () => resolve(Date.now() - startedAt), { once: true });
      });
      attachImageLoadRetry(image, { maxAttempts: 2, baseDelayMs: 10, checkTimeoutMs: never as number });

      const elapsed = await Promise.race([reported, new Promise<null>((r) => setTimeout(() => r(null), 2000))]);
      return { failedBeforeAttach, elapsed };
    },
    [DEAD_IMAGE, NEVER] as const,
  );

  expect(result.failedBeforeAttach, 'precondition: the image had already failed before attach').toBe(true);
  expect(result.elapsed, 'an already-failed <img> must be detected on attach, not by the readiness clock').not.toBeNull();
});
