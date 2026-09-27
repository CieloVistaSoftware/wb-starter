/**
 * REGRESSION: several <audio src="../audio.mp3"> instances on
 * demos/site/content.html pointed at a 13-byte placeholder file (and other
 * pages used 0-byte success.mp3/warning.mp3/danger.mp3) with nothing
 * surfacing the failure -- broken audio shipped completely undetected.
 * semantics/audio.js now throws a real Error on the media element's native
 * 'error' event (fired for 404s, network failures, AND 0-byte/undecodable
 * files), which the app's global error handler (src/core/error-logger.js)
 * catches and surfaces in its error overlay.
 *
 * success.mp3/warning.mp3/danger.mp3 are now real audio (the production
 * bug they demonstrated is fixed) -- this test uses a dedicated,
 * intentionally-empty fixture instead, so it stays deterministic
 * regardless of what the production files contain.
 */
import { test, expect } from '../fixtures/offline';

test('.x-audio throws a catchable runtime error when its src is missing/empty', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );

  await page.evaluate(async () => {
    const container = document.createElement('div');
    // A real 0-byte file dedicated to this test -- genuinely undecodable,
    // not a network 404 (keeps this test deterministic regardless of
    // external network availability).
    // <div x-audio>: this was <x-audio>, and the tag-to-attribute migration made it
    // a bare <audio> -- which the harness (autoInject off) never enhances and
    // which, being its own media element, has no inner <audio> to find.
    container.innerHTML = '<div x-audio src="/tests/fixtures/broken-audio-0-bytes.mp3"></div>';
    document.body.appendChild(container);
    return await (window as any).WB.scan(container, { eager: true });
  });

  await page.waitForFunction(
    () => (window as any).__wbAudioTestErrors?.length > 0 || true,
    { timeout: 1000 }
  ).catch(() => {});
  await page.waitForTimeout(1500);

  // audio.js's errors begin "x-audio:" (the behavior's token). This filter
  // read '.x-audio' -- a class-selector spelling no message contains -- so
  // it could never match: a real error went unseen and a false positive
  // would have passed unnoticed.
  const audioError = pageErrors.find(e => e.includes('x-audio:') && e.includes('broken-audio-0-bytes.mp3'));
  expect(audioError, `expected a .x-audio runtime error for the empty file, got: ${JSON.stringify(pageErrors)}`).toBeTruthy();
});
