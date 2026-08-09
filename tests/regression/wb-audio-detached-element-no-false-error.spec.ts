/**
 * REGRESSION: errors-viewer.html accumulated repeated "wb-audio: failed to
 * load src demos/sample.wav -- code 4 (DEMUXER_ERROR_COULD_NOT_OPEN)" entries
 * even though the file itself is intact (verified: curl download is a valid
 * RIFF/WAVE file matching Content-Length, and a real single-page visit shows
 * audioEl.readyState === 4 / error === null).
 *
 * Root cause: audio() (semantics/audio.js) has no cleanup path. Re-running it
 * on the same host (a lazy rebuild/re-scan re-applying behaviors) replaces
 * audioEl via `element.innerHTML = ''` without ever detaching the OLD
 * audioEl's 'error' listener first. The OLD element's in-flight fetch gets
 * torn down by the DOM removal; a late 'error' event on that now-detached,
 * nobody's-looking-at-it element used to throw a false positive -- reliably
 * reproducible under concurrent load (many Playwright workers contending for
 * the same dev server), never on an ordinary single visit.
 *
 * Fix: the 'error' listener now checks document.contains(audioEl) and
 * ignores errors on elements no longer attached to the page. A genuinely
 * broken src on the CURRENT, still-attached element must still throw --
 * covered separately by wb-audio-error-on-broken-src.spec.ts.
 */
import { test, expect } from '@playwright/test';

test('a detached (superseded) <audio> element\'s late error event does not throw', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );

  const result = await page.evaluate(async () => {
    const container = document.createElement('div');
    container.innerHTML = '<wb-audio src="/demos/sample.wav"></wb-audio>';
    document.body.appendChild(container);
    (window as any).WB.scan(container);

    const host = container.querySelector('wb-audio')!;
    const waitForAudioEl = async () => {
      for (let i = 0; i < 40; i++) {
        const el = host.querySelector('audio');
        if (el) return el;
        await new Promise((r) => setTimeout(r, 50));
      }
      return null;
    };
    const oldAudioEl = await waitForAudioEl();
    if (!oldAudioEl) return { replaced: false, oldStillAttached: false, noOldEl: true };

    // Re-run the audio() viewmodel directly on the SAME host -- this is what
    // a lazy rebuild/re-init path does (WB.scan() itself dedupes
    // already-processed elements, so it won't trigger a second pass; the
    // underlying behavior function has no such guard).
    const mod = await import('/src/wb-viewmodels/semantics/audio.js');
    mod.audio(host, {});
    await new Promise((r) => setTimeout(r, 100));

    const newAudioEl = host.querySelector('audio');
    const replaced = newAudioEl !== oldAudioEl;

    // Simulate the old, now-detached element's in-flight fetch failing late.
    oldAudioEl.dispatchEvent(new Event('error'));
    await new Promise((r) => setTimeout(r, 300));

    return { replaced, oldStillAttached: document.contains(oldAudioEl) };
  });

  expect(result.noOldEl, 'the initial <wb-audio> never built its inner <audio> element').toBeFalsy();
  expect(result.replaced, 'expected re-scan to replace audioEl (the condition this bug needs)').toBe(true);
  expect(result.oldStillAttached, 'expected the old audioEl to be detached after re-scan').toBe(false);

  const falsePositive = pageErrors.find((e) => e.includes('wb-audio') && e.includes('sample.wav'));
  expect(falsePositive, `a detached element's error must not throw, got: ${JSON.stringify(pageErrors)}`).toBeFalsy();
});
