/**
 * REGRESSION: demos/site/content.html had 8 <audio src="../audio.mp3">
 * instances pointing at demos/audio.mp3 -- a 13-byte placeholder file, not
 * real audio. Fixed by pointing at a real, known-working external URL
 * (matching the pattern already used elsewhere on this same page for the
 * "Studio EQ Player" example). This test asserts every audio/x-audio src
 * on the page actually resolves to a real, non-trivial audio resource.
 */
import { test, expect } from '@playwright/test';

test('every audio/x-audio src on content.html resolves to a real, working resource', async ({ page, request }) => {
  await page.goto('/demos/site/content.html');
  await page.waitForTimeout(500);

  const srcs = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('.x-audio[src], audio[src]'));
    return [...new Set(els.map(el => el.getAttribute('src')))];
  });

  expect(srcs.length, 'content.html must have at least one audio source to check').toBeGreaterThan(0);

  for (const src of srcs) {
    expect(src, 'src must not be empty/missing').toBeTruthy();
    const url = new URL(src!, page.url());
    const response = await request.get(url.href);
    expect(response.status(), `${src} must actually be reachable`).toBe(200);

    const body = await response.body();
    expect(body.length, `${src} must be a real audio file, not an empty/placeholder stub`).toBeGreaterThan(1000);
  }
});
