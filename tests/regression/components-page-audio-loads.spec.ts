import { test, expect } from '@playwright/test';

/**
 * John reported a live "wb-audio: failed to load src '/demos/sample.wav' --
 * code 4 (MEDIA_ELEMENT_ERROR: Format error)" on pages/components.html.
 *
 * Investigated: demos/sample.wav is a genuine, valid 264644-byte WAV file
 * (confirmed via `file`), and the running server answers both a plain GET
 * (200, correct audio/wav content-type, full byte count) and a Range GET
 * (206 Partial Content, matching what a real <audio> element issues) for
 * it correctly. The report's server (localhost:3996) had been repeatedly
 * killed and restarted for a few minutes of manual testing right around
 * the reported timestamp -- an <audio> element mid-load when its own
 * server process is killed produces exactly this "format error" symptom,
 * which points at a transient artifact of that restart, not a real
 * product defect.
 *
 * This test exists anyway (per standing instruction: every reported issue
 * gets a regression test, not just a verbal "couldn't reproduce") so a
 * REAL future break in this specific demo's audio loading is caught, and
 * to have documented, automated proof of the "couldn't reproduce against a
 * stable server" finding rather than just an assertion.
 */

test('components page: the Audio Player demo loads its src without error', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto('/?page=components', { waitUntil: 'domcontentloaded' });

  const audio = page.locator('wb-audio');
  await expect(audio).toBeVisible();

  const audioEl = audio.locator('audio').first();
  await expect(audioEl).toHaveJSProperty('readyState', 4, { timeout: 15000 }); // HAVE_ENOUGH_DATA

  expect(
    pageErrors.filter((m) => m.includes('sample.wav')),
    `no page error may mention sample.wav failing to load: ${pageErrors.join(' | ')}`
  ).toHaveLength(0);
});
