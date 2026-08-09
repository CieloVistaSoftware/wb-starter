import { test, expect } from '@playwright/test';

/**
 * demos/semantics-media.html had multiple silently-broken media sources:
 * - Standard Player <audio>: hidden (display:none) unconditionally by
 *   audio.js's behavior, which built a custom transport UI over EVERY
 *   audio element it touched, including plain native <audio controls> that
 *   never asked for it. Fixed: only replace with the custom UI for the
 *   <wb-audio> custom tag or when show-eq is requested.
 * - Both <video> sources used commondatastorage.googleapis.com URLs that
 *   now 403 for everyone (bucket access revoked) — swapped for
 *   w3schools.com's long-standing public sample videos.
 * This test asserts real playable media, not just that elements exist.
 */
test('Standard Player <audio> is visible with native controls (not hidden)', async ({ page }) => {
  await page.goto('/demos/site/content.html', { waitUntil: 'domcontentloaded' });
  const audio = page.locator('#semanticsmedia-audio-20');
  await expect(audio).toBeVisible({ timeout: 15000 });
  const hasControls = await audio.evaluate((el: HTMLAudioElement) => el.controls);
  expect(hasControls, 'a plain native <audio controls> must keep its native controls, not be hidden').toBe(true);
});

test('both <video> demos load real playable media', async ({ page }) => {
  await page.goto('/demos/site/content.html', { waitUntil: 'domcontentloaded' });
  const results = await page.evaluate(async () => {
    const videos = [...document.querySelectorAll('video')] as HTMLVideoElement[];
    return Promise.all(videos.map((v) => new Promise((resolve) => {
      if (v.readyState >= 1) return resolve({ src: v.currentSrc, ok: true, duration: v.duration });
      const done = () => resolve({ src: v.currentSrc, ok: v.readyState >= 1 && !v.error, duration: v.duration });
      v.addEventListener('loadedmetadata', done, { once: true });
      v.addEventListener('error', done, { once: true });
      setTimeout(done, 8000);
    })));
  });

  expect(results.length, 'expected 2 <video> demos on the page').toBe(2);
  for (const r of results as any[]) {
    expect(r.ok, `video failed to load: ${r.src}`).toBe(true);
    expect(r.duration, `video has no real duration: ${r.src}`).toBeGreaterThan(0);
  }
});

/**
 * autoinject.html's themed audio players (#257): 3 of 4 used soundjay.com
 * URLs that are now 404 (dead), and separately all 4 were being hidden by
 * the same unconditional custom-transport-UI bug fixed above. Both issues
 * combined meant none of these demos ever showed a usable player.
 */
test('autoinject.html: all 4 themed audio players load real playable media', async ({ page }) => {
  await page.goto('/demos/autoinject.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#autoinject-audio-253', { timeout: 15000 });

  const results = await page.evaluate(async () => {
    const ids = ['autoinject-audio-253', 'autoinject-audio-success', 'autoinject-audio-warning', 'autoinject-audio-danger'];
    return Promise.all(ids.map((id) => new Promise((resolve) => {
      const el = document.getElementById(id) as HTMLAudioElement;
      if (!el) return resolve({ id, ok: false, reason: 'not found' });
      if (el.readyState >= 1) return resolve({ id, ok: true, hasControls: el.controls, display: getComputedStyle(el).display });
      const done = () => resolve({ id, ok: el.readyState >= 1 && !el.error, hasControls: el.controls, display: getComputedStyle(el).display });
      el.addEventListener('loadedmetadata', done, { once: true });
      el.addEventListener('error', done, { once: true });
      setTimeout(done, 8000);
    })));
  });

  for (const r of results as any[]) {
    expect(r.ok, `audio player ${r.id} failed to load`).toBe(true);
    expect(r.hasControls, `audio player ${r.id} must show native controls, not be hidden`).toBe(true);
    expect(r.display, `audio player ${r.id} must be visible (display != none)`).not.toBe('none');
  }
});
