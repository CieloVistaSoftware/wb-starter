import { test, expect } from '@playwright/test';

/**
 * #233 REGRESSION — the Studio EQ Player's band sliders visually moved but had
 * zero effect on playback. Root cause: `filters` (src/wb-viewmodels/semantics/
 * audio.js) was handed to buildEqUI() as a parameter WHILE STILL EMPTY, then
 * later reassigned (`filters = EQ_BANDS.map(...)`) inside initAudioContext —
 * reassigning an outer variable doesn't affect a closure that already captured
 * the old array object. Every slider's oninput handler kept writing into a
 * dead, empty array forever, while wbAudio.getFilters() returned the real,
 * live (but never-updated) array. Fixed by mutating the array in place
 * (`filters.length = 0; filters.push(...)`) instead of reassigning it.
 */
test('Studio EQ Player: a band slider actually changes its filter gain (#233)', async ({ page }) => {
  await page.goto('/demos/semantics-media.html', { waitUntil: 'domcontentloaded' });
  // WB scans/enhances asynchronously — wait for wbAudio to actually attach
  // (domcontentloaded alone is not enough and was flaky).
  await page.waitForFunction(() => [...document.querySelectorAll('[class*="wb-audio"]')]
    .some((el) => (el as any).wbAudio && el.querySelectorAll('.wb-audio__eq-slider').length > 5),
    { timeout: 20000 });

  const result = await page.evaluate(() => {
    const audioEls = [...document.querySelectorAll('[class*="wb-audio"]')]
      .filter((el) => (el as any).wbAudio);
    const studio = audioEls.find((el) => el.querySelectorAll('.wb-audio__eq-slider').length > 5);
    if (!studio) return { found: false };

    const slider = studio.querySelectorAll('.wb-audio__eq-slider')[3] as HTMLInputElement;
    slider.value = '10';
    slider.dispatchEvent(new Event('input', { bubbles: true }));

    const filters = (studio as any).wbAudio.getFilters();
    return { found: true, gain: filters?.[3]?.gain?.value };
  });

  expect(result.found, 'Studio EQ Player (15+ band sliders) not found on the page').toBe(true);
  expect(result.gain, 'moving a band slider must change its BiquadFilterNode gain').toBe(10);
});

test('Studio EQ Player: a preset applies its gain curve to the real filters (#233)', async ({ page }) => {
  await page.goto('/demos/semantics-media.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => [...document.querySelectorAll('[class*="wb-audio"]')]
    .some((el) => (el as any).wbAudio && el.querySelectorAll('.wb-audio__eq-slider').length > 5),
    { timeout: 20000 });

  const gains = await page.evaluate(() => {
    const audioEls = [...document.querySelectorAll('[class*="wb-audio"]')]
      .filter((el) => (el as any).wbAudio);
    const studio = audioEls.find((el) => el.querySelectorAll('.wb-audio__eq-slider').length > 5);
    if (!studio) return null;
    const bassBtn = [...studio.querySelectorAll('button')].find((b) => /bass boost/i.test(b.textContent || ''));
    bassBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const filters = (studio as any).wbAudio.getFilters();
    return filters.slice(0, 5).map((f: any) => f.gain.value);
  });

  expect(gains, 'Bass Boost preset must set real filter gains, not a dead array').toEqual([8, 7, 6, 4, 2]);
});
