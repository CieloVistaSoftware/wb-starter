import { test, expect } from '@playwright/test';

/**
 * demos/autoinject.html's Audio Players section (Default/Success/Warning/
 * Danger themes) must each render a working, usable <audio controls> player
 * — not inert markup. (#257, Standard §19: declared features must actually
 * work.)
 */
const VARIANTS = [
  { id: 'autoinject-audio-253', label: 'Default' },
  { id: 'autoinject-audio-success', label: 'Success' },
  { id: 'autoinject-audio-warning', label: 'Warning' },
  { id: 'autoinject-audio-danger', label: 'Danger' },
];

test.describe('Audio Players render a working control (#257)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/autoinject.html', { waitUntil: 'domcontentloaded' });
  });

  for (const v of VARIANTS) {
    test(`${v.label} audio player is visible, sized, and has a resolvable source`, async ({ page }) => {
      const audio = page.locator(`#${v.id}`);
      await expect(audio).toBeVisible({ timeout: 10000 });
      await expect(audio).toHaveAttribute('controls', '');

      const box = await audio.boundingBox();
      expect(box, `${v.label} audio element should have real rendered dimensions`).not.toBeNull();
      expect(box!.width, `${v.label} audio element should be visibly wide, not collapsed`).toBeGreaterThan(0);
      expect(box!.height, `${v.label} audio element should be visibly tall, not collapsed`).toBeGreaterThan(0);

      const state = await audio.evaluate((el: HTMLAudioElement) => ({
        currentSrc: el.currentSrc,
        readyState: el.readyState,
        errorCode: el.error ? el.error.code : null,
      }));
      expect(state.currentSrc, `${v.label} audio should have resolved a real source`).toContain('.mp3');
      expect(state.errorCode, `${v.label} audio should have no load error`).toBeNull();
    });
  }
});
