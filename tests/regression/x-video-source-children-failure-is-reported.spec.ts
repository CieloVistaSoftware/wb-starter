import { test, expect } from '../fixtures/offline';

/**
 * #1342 case 1 -- a <video> whose source is in <source> children is instrumented
 * at all.
 *
 * video.js read the src ATTRIBUTE only:
 *
 *     const retryCleanup = config.src ? attachVideoLoadRetry(videoEl) : null;
 *
 * A <video x-video> that offers its source through <source> children -- the
 * normal multi-codec form, and the form live in pages/hero-variants.html and
 * demos/autoinject.html -- left config.src empty, so attachVideoLoadRetry was
 * never called. No listener, no retry, no report, ever: a dead remote video
 * looked exactly like a video the author never added. That is worse than
 * #1136's timing window, because there is no window -- nothing was watching.
 *
 * This holds the <source>-children form specifically. It must NOT be rewritten
 * to use a src attribute: the src attribute always worked.
 *
 * Why the generous poll, rather than the attach-time check cases 2 and 3 get:
 * a <source>'s error event fires AT the <source>, does not bubble, and leaves
 * the <video>'s own `error` null -- resource selection simply stops in
 * NETWORK_NO_SOURCE when its candidates run out. (Asserted below, because it
 * is the reason.) So nothing about this failure is readable from el.error, and
 * the readiness clock is what detects it: the full no-error ladder, which is
 * the ~28s symptom recorded on #371. Reported slowly beats never.
 *
 *   red:   nothing is reported, ever.
 *   green: the retry ladder runs and wb:video:load-failed is dispatched.
 */

// src/main.js registers a service worker and Playwright cannot route a service
// worker's requests, so without this the route below is silently ignored and
// the test measures the real network instead of the mock (#1349).
test.use({ serviceWorkers: 'block' });

// Remote, per #762 -- aborted here rather than committed as files. Two codecs,
// because offering more than one is the entire reason <source> children exist.
const SOURCES: [string, string][] = [
  ['https://cdn.pixabay.com/video/2024/02/09/wb-1342-ocean-waves.webm', 'video/webm'],
  ['https://cdn.pixabay.com/video/2024/02/09/wb-1342-ocean-waves.mp4', 'video/mp4'],
];

test('a <video x-video> with <source> children reports its failure', async ({ page }) => {
  test.setTimeout(120_000);
  await page.route(/wb-1342-ocean-waves/, (r) => r.abort('failed'));

  await page.goto('/tests/fixtures/blank.html', { waitUntil: 'domcontentloaded' });

  const state = await page.evaluate(async (sources) => {
    document.documentElement.setAttribute('data-x-expected-errors', '');
    (window as any).__wb1342VideoFailed = null;
    window.addEventListener('wb:video:load-failed', (e) => {
      (window as any).__wb1342VideoFailed = (e as CustomEvent).detail;
    });

    const host = document.createElement('div');
    const video = document.createElement('video');
    video.setAttribute('x-video', '');
    video.controls = true;

    // Listeners go on before insertion, so the count below cannot miss one:
    // a <source>'s error fires at the <source> itself and does not bubble.
    let failedSources = 0;
    for (const [src, type] of sources) {
      const source = document.createElement('source');
      source.src = src;
      source.type = type;
      source.addEventListener('error', () => { failedSources += 1; });
      video.appendChild(source);
    }
    host.appendChild(video);
    document.body.appendChild(host);

    // Let the failure complete BEFORE any behavior exists -- that is the whole
    // point of #1136/#1342. Every candidate must have been tried and failed.
    await new Promise<void>((resolve) => {
      const started = Date.now();
      const tick = () => {
        if (failedSources >= sources.length || Date.now() - started > 15_000) return resolve();
        setTimeout(tick, 50);
      };
      tick();
    });
    const preconditions = {
      srcAttribute: video.getAttribute('src'),
      sourceChildren: video.querySelectorAll('source').length,
      failedSources,
      errorCode: video.error ? video.error.code : null,
      networkState: video.networkState,
    };

    const mod: any = await import('/src/core/wb-lazy.js');
    await (mod.default || mod.WB).scan(host, { eager: true });
    return {
      ...preconditions,
      behaviorAttached: video.classList.contains('x-video') && !!(video as any).wbVideo,
    };
  }, SOURCES);

  console.log('[#1342] <source>-children state before attach:', JSON.stringify(state));
  expect(state.sourceChildren, 'the markup under test must use <source> children').toBe(2);
  expect(state.srcAttribute, 'and must carry no src attribute -- the src form always worked').toBeNull();
  expect(state.failedSources, 'precondition: every <source> candidate failed before x-video attached').toBe(2);
  // The reason this case cannot be caught by reading el.error on attach: the
  // <video> is not told. Resource selection just stops in NETWORK_NO_SOURCE.
  expect(state.errorCode, 'a <source>-children failure leaves the <video> error null').toBeNull();
  expect(state.networkState, 'and leaves it in NETWORK_NO_SOURCE').toBe(3);
  // Positive control: red must mean "watched nothing", not "never enhanced".
  expect(state.behaviorAttached, 'the x-video behavior must actually have attached').toBe(true);

  await expect
    .poll(() => page.evaluate(() => (window as any).__wb1342VideoFailed), {
      timeout: 60_000,
      message: 'a <video> with <source> children must be watched and its failure reported',
    })
    .toBeTruthy();

  await expect(page.locator('.x-video__load-failed')).toHaveCount(1);
});
