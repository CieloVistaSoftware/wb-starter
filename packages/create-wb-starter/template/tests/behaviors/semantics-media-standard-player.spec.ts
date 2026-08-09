import { test, expect } from '@playwright/test';

/**
 * demos/semantics-media.html's "Standard Player" must render a working,
 * usable <audio controls> — not an empty demo slot. (#267, Standard §16)
 */
test('Standard Player renders a working audio control', async ({ page }) => {
  await page.goto('/demos/site/content.html', { waitUntil: 'domcontentloaded' });

  const audio = page.locator('#semanticsmedia-audio-20');
  await expect(audio).toBeVisible({ timeout: 10000 });
  await expect(audio).toHaveAttribute('controls', '');

  const box = await audio.boundingBox();
  expect(box, 'Standard Player should have real rendered dimensions').not.toBeNull();
  expect(box!.width).toBeGreaterThan(0);
  expect(box!.height).toBeGreaterThan(0);

  const errorCode = await audio.evaluate((el: HTMLAudioElement) => (el.error ? el.error.code : null));
  expect(errorCode, 'Standard Player should have no load error').toBeNull();
});
