import { test, expect } from '../fixtures/offline';

/**
 * #1342 case 3 -- a plain <img x-img> gets the attach-time already-failed check
 * too.
 *
 * img.js had the right check (`element.complete && element.naturalWidth === 0`)
 * but only inside its `config.fallback` branch. An <img x-img> with no
 * fallback -- the ordinary case -- went through attachImageLoadRetry instead
 * and so inherited case 2's blind 4s readiness clock: the image had already
 * failed, and nothing happened for four seconds before the first retry even
 * began.
 *
 * The assertion is therefore about WHEN the behavior starts acting, not only
 * whether it eventually does. attachImageLoadRetry's retry reloads through a
 * cache-busting `_retry=` query, so a src carrying `_retry=` is proof the
 * ladder is already running.
 *
 *   red:   the first retry waits out the 4s clock -- no `_retry=` at 2.5s.
 *   green: the first retry fires at baseDelayMs (500ms).
 */

// src/main.js registers a service worker and Playwright cannot route a service
// worker's requests, so without this the route below is silently ignored and
// the test measures the real network instead of the mock (#1349).
test.use({ serviceWorkers: 'block' });

// Remote, per #762 -- aborted here rather than committed as a file.
const DEAD_IMAGE = 'https://picsum.photos/seed/wb-1342-img-behavior/640/360';

test('an authored <img x-img> that already failed is acted on when x-img attaches', async ({ page }) => {
  test.setTimeout(60_000);
  await page.route(/wb-1342-img-behavior/, (r) => r.abort('failed'));

  await page.goto('/tests/fixtures/blank.html', { waitUntil: 'domcontentloaded' });

  const state = await page.evaluate(async (src) => {
    document.documentElement.setAttribute('data-x-expected-errors', '');
    (window as any).__wb1342ImgFailed = null;
    window.addEventListener('wb:image:load-failed', (e) => {
      (window as any).__wb1342ImgFailed = (e as CustomEvent).detail;
    });

    const host = document.createElement('div');
    const image = document.createElement('img');
    // No x- attribute: a plain <img> IS x-img (tag-map nativeMap), which is
    // the form every page actually authors.
    image.alt = 'A photo that cannot be reached';
    image.src = src;
    host.appendChild(image);
    document.body.appendChild(host);

    // Let the failure complete BEFORE any behavior exists.
    await new Promise<void>((resolve) => {
      if (image.complete) return resolve();
      image.addEventListener('error', () => resolve(), { once: true });
      image.addEventListener('load', () => resolve(), { once: true });
      setTimeout(resolve, 10_000);
    });
    const preconditions = {
      hasFallback: image.hasAttribute('fallback'),
      failedBeforeAttach: image.complete && image.naturalWidth === 0,
    };

    const mod: any = await import('/src/core/wb-lazy.js');
    await (mod.default || mod.WB).scan(host, { eager: true });

    // Longer than baseDelayMs (500ms), well short of checkTimeoutMs (4000ms):
    // a `_retry=` src here can only mean the element was read on attach.
    // sleep-is-the-scenario: past baseDelayMs, short of checkTimeoutMs; the timing window is the scenario
    await new Promise((r) => setTimeout(r, 2500));
    return {
      ...preconditions,
      behaviorAttached: image.classList.contains('x-img'),
      retriedEarly: image.src.includes('_retry='),
    };
  }, DEAD_IMAGE);

  console.log('[#1342] <img> state after attach:', JSON.stringify(state));
  // Positive control: red must mean "watched too late", not "never enhanced".
  expect(state.behaviorAttached, 'the x-img behavior must actually have attached').toBe(true);
  expect(state.hasFallback, 'the markup under test must take the plain retry path, not the fallback branch').toBe(false);
  expect(state.failedBeforeAttach, 'precondition: the image had already failed before x-img attached').toBe(true);
  expect(state.retriedEarly, 'an already-failed <img x-img> must not sit through the 4s readiness clock first').toBe(true);

  await expect
    .poll(() => page.evaluate(() => (window as any).__wb1342ImgFailed), {
      timeout: 20_000,
      message: 'and the failure must still be reported at the end of the ladder',
    })
    .toBeTruthy();
});
