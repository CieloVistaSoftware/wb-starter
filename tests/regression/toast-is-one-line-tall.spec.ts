import { test, expect } from '../fixtures/offline';

/**
 * A toast is one line tall; its close button is a bare ✕, not a button box.
 *
 * John, 2026-10-16, on the toast doc's "Show toast": "these are way to tall".
 * Measured: the toast was 67px tall around a 44x51 close button. themes.css
 * styles every button with `[data-theme] button` (0,1,1) -- padding 1rem, a
 * background and a border -- and toast.css's single-class `.x-toast__close`
 * (0,1,0) lost to it. The toast rules are now two classes.
 */
test('the toast is one line tall and its close button is unpadded', async ({ page }) => {
  await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/behaviors/toast.md'));
  await page.waitForSelector('#content.x-mdhtml--loaded', { state: 'attached', timeout: 20000 });
  // The trigger class means the toast behavior is attached and listening.
  const trigger = page.locator('button[x-toast].x-toast--trigger').first();
  await expect(trigger).toBeVisible({ timeout: 15000 });
  await trigger.click();
  const toast = page.locator('.x-toast').first();
  await expect(toast).toBeVisible();

  const m = await toast.evaluate((t) => {
    const close = t.querySelector('.x-toast__close') as HTMLElement;
    const cs = getComputedStyle(close);
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return {
      toastH: t.getBoundingClientRect().height / rem,
      closeH: close.getBoundingClientRect().height / rem,
      padding: cs.paddingTop,
      background: cs.backgroundColor,
    };
  });
  expect(m.padding, 'the theme button padding does not reach the close button').toBe('0px');
  expect(m.background, 'the close button has no box of its own').toBe('rgba(0, 0, 0, 0)');
  expect(m.closeH, 'the close button is a glyph, about one line').toBeLessThanOrEqual(1.5);
  expect(m.toastH, 'the toast is one line plus its padding').toBeLessThanOrEqual(2.5);
});
