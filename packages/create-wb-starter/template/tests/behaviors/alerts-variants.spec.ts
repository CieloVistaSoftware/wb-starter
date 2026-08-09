/**
 * #176 — <wb-alert> must honor the `type=` attribute as an alias for `variant`.
 * The showcase authors alerts as `type="success|warning|error"`, but the schema
 * property is `variant` (default "info"), so every alert rendered blue. The
 * schema-builder now supports property aliases (extractData) and the alert schema
 * declares variant.aliases = ["type"].
 */
import { test, expect } from '@playwright/test';

test('#176 — alert type= maps to variant: four distinct colors', async ({ page }) => {
  await page.goto('http://localhost:3000/?page=behaviors');
  await page.waitForSelector('#mainPage-behaviors', { timeout: 20000 });
  await page.waitForTimeout(2500); // lazy injection + schema build

  const info = await page.locator('[x-alert][type="info"], [x-alert].wb-alert--info').first();
  await expect(info, 'no alerts found on showcase').toBeVisible();

  // Each type= alert should carry the matching wb-alert--<type> class…
  const classMatch = await page.evaluate(() => {
    const types = ['info', 'success', 'warning', 'error'];
    return types.map((t) => {
      const el = document.querySelector(`[x-alert][type="${t}"]`);
      return { t, hasClass: !!el && el.classList.contains(`wb-alert--${t}`) };
    });
  });
  for (const { t, hasClass } of classMatch) {
    expect(hasClass, `wb-alert[type="${t}"] did not get class wb-alert--${t}`).toBe(true);
  }

  // …and the four variants must be visually distinct (not all "info" blue).
  const colors = await page.evaluate(() =>
    ['info', 'success', 'warning', 'error'].map((t) => {
      const el = document.querySelector(`[x-alert][type="${t}"]`) as HTMLElement;
      return el ? getComputedStyle(el).backgroundColor : 'MISSING';
    })
  );
  expect(
    new Set(colors).size,
    `alert variants not distinct (type= ignored?): ${colors.join(', ')}`
  ).toBe(4);
});
