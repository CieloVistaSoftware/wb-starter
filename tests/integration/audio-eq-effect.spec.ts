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
  await page.goto('/demos/site/content.html', { waitUntil: 'domcontentloaded' });
  // wb-lazy.js only enhances an element once it intersects the viewport
  // (IntersectionObserver) — content.html is now a long consolidated
  // category page, so the Studio EQ Player sits well below the fold at
  // load and never gets scanned unless explicitly scrolled into view.
  await page.locator('wb-audio[playlist]').scrollIntoViewIfNeeded();
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
  await page.goto('/demos/site/content.html', { waitUntil: 'domcontentloaded' });
  // wb-lazy.js only enhances an element once it intersects the viewport
  // (IntersectionObserver) — content.html is now a long consolidated
  // category page, so the Studio EQ Player sits well below the fold at
  // load and never gets scanned unless explicitly scrolled into view.
  await page.locator('wb-audio[playlist]').scrollIntoViewIfNeeded();
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

test('Studio EQ Player: playlist attribute renders a track picker with all tracks (#233 follow-up)', async ({ page }) => {
  await page.goto('/demos/site/content.html', { waitUntil: 'domcontentloaded' });
  // wb-lazy.js only enhances an element once it intersects the viewport
  // (IntersectionObserver) — content.html is now a long consolidated
  // category page, so the Studio EQ Player sits well below the fold at
  // load and never gets scanned unless explicitly scrolled into view.
  await page.locator('wb-audio[playlist]').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !!document.querySelector('.wb-audio__track-picker'), { timeout: 20000 });

  const result = await page.evaluate(() => {
    const picker = document.querySelector('.wb-audio__track-picker') as HTMLSelectElement;
    const before = picker.value;
    picker.value = '5';
    picker.dispatchEvent(new Event('change', { bubbles: true }));
    const audioEl = picker.closest('wb-audio')!.querySelector('audio') as HTMLAudioElement;
    return { optionCount: picker.options.length, before, after: audioEl.src };
  });

  expect(result.optionCount, 'playlist="…" (18 tracks) should render 18 options').toBe(18);
  expect(result.after, 'selecting a different track must load its src').toContain('05_Ghosts_I.mp3');
});

/**
 * This is the check that should have caught the original problem: the first
 * playlist shipped with 17 SoundHelix tracks that returned 200 (existed) but
 * sent NO Access-Control-Allow-Origin header — and the EQ player sets
 * crossOrigin="anonymous" on its <audio> (required for the Web Audio routing),
 * so the browser silently refused every one of them: readyState stuck at 0,
 * duration "0:00", nothing ever played. A URL existing is not the same as a
 * track being loadable in THIS specific crossOrigin-anonymous context —
 * assert every playlist entry actually reaches loadedmetadata.
 */
test('Studio EQ Player: every playlist track actually loads (catches CORS-silent failures)', async ({ page }) => {
  await page.goto('/demos/site/content.html', { waitUntil: 'domcontentloaded' });
  // wb-lazy.js only enhances an element once it intersects the viewport
  // (IntersectionObserver) — content.html is now a long consolidated
  // category page, so the Studio EQ Player sits well below the fold at
  // load and never gets scanned unless explicitly scrolled into view.
  await page.locator('wb-audio[playlist]').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !!document.querySelector('.wb-audio__track-picker'), { timeout: 20000 });

  const results = await page.evaluate(async () => {
    const picker = document.querySelector('.wb-audio__track-picker') as HTMLSelectElement;
    const audioEl = picker.closest('wb-audio')!.querySelector('audio') as HTMLAudioElement;
    const out: { title: string; loaded: boolean; duration: number }[] = [];

    for (let i = 0; i < picker.options.length; i++) {
      picker.value = String(i);
      picker.dispatchEvent(new Event('change', { bubbles: true }));
      const loaded = await new Promise<boolean>((resolve) => {
        const onLoaded = () => { cleanup(); resolve(true); };
        const onError = () => { cleanup(); resolve(false); };
        const timer = setTimeout(() => { cleanup(); resolve(false); }, 8000);
        const cleanup = () => {
          clearTimeout(timer);
          audioEl.removeEventListener('loadedmetadata', onLoaded);
          audioEl.removeEventListener('error', onError);
        };
        audioEl.addEventListener('loadedmetadata', onLoaded, { once: true });
        audioEl.addEventListener('error', onError, { once: true });
      });
      out.push({ title: picker.options[i].textContent || '', loaded, duration: audioEl.duration || 0 });
    }
    return out;
  });

  const failed = results.filter((r) => !r.loaded || !(r.duration > 0));
  expect(failed, `these playlist tracks never loaded (CORS or 404):\n${JSON.stringify(failed, null, 2)}`).toEqual([]);
});
