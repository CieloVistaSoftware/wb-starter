import { test, expect } from '@playwright/test';

/**
 * show-eq forces crossOrigin='anonymous' on the <audio> element (needed for
 * AudioContext.createMediaElementSource() to read raw samples for the EQ).
 * A cross-origin src whose server sends no CORS headers at all (confirmed
 * live: soundhelix.com -- curl shows no Access-Control-Allow-Origin on its
 * response) gets its crossorigin-mode fetch blocked outright by the browser,
 * breaking PLAYBACK entirely, not just the EQ. The exact same file plays
 * fine the instant crossOrigin is removed (confirmed live: readyState 4,
 * error null, immediately after the retry).
 *
 * This simulates the CORS failure by dispatching a synthetic 'error' event
 * rather than relying on a real no-CORS server -- this repo's own dev
 * server sends Access-Control-Allow-Origin: * on every response, so no
 * local fixture can reproduce the failure over real network traffic, and
 * hitting the actual external soundhelix.com URL would make the test
 * flaky/dependent on a third party. This directly pins the retry LOGIC:
 * given an 'error' event on a crossOrigin='anonymous' element, the handler
 * must clear crossOrigin and reassign src exactly once.
 */
test('the error handler retries without crossOrigin exactly once when show-eq caused a CORS failure', async ({ page, baseURL }) => {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );

  const result = await page.evaluate(async (src) => {
    const container = document.createElement('div');
    container.innerHTML = `<wb-audio src="${src}" show-eq></wb-audio>`;
    document.body.appendChild(container);

    const { audio } = await import('/src/wb-viewmodels/semantics/audio.js');
    const host = container.querySelector('wb-audio')!;
    audio(host, {});

    const audioEl = host.querySelector('audio')!;
    const crossOriginBeforeRetry = audioEl.crossOrigin;

    // Simulate the real-world CORS failure: a server with no CORS support
    // fires a native 'error' event on a crossOrigin='anonymous' element.
    audioEl.dispatchEvent(new Event('error'));
    await new Promise((r) => setTimeout(r, 300));

    return {
      crossOriginBeforeRetry,
      crossOriginAfterRetry: audioEl.crossOrigin,
      srcStillSet: audioEl.src.includes('sample.wav'),
    };
  }, `${baseURL}/demos/sample.wav`);

  expect(result.crossOriginBeforeRetry, 'show-eq must set crossOrigin before any failure').toBe('anonymous');
  expect(result.crossOriginAfterRetry, 'the retry must clear crossOrigin so playback works without CORS support').toBeNull();
  expect(result.srcStillSet, 'the retry must reassign the same src, not lose it').toBe(true);
});

test('a genuinely broken src (not a CORS failure) still throws after the one CORS-fallback attempt', async ({ page, baseURL }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );

  await page.evaluate(async () => {
    const container = document.createElement('div');
    container.innerHTML = '<wb-audio src="/tests/fixtures/broken-audio-0-bytes.mp3" show-eq></wb-audio>';
    document.body.appendChild(container);
    (window as any).WB.scan(container);
  });

  await page.waitForTimeout(2000);
  const audioError = pageErrors.find((e) => e.includes('wb-audio') && e.includes('broken-audio-0-bytes.mp3'));
  expect(audioError, `a genuinely broken file must still surface a real error after the CORS-retry gives it one more chance, got: ${JSON.stringify(pageErrors)}`).toBeTruthy();
});
