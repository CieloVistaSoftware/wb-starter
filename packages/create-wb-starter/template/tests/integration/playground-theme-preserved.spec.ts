import { test, expect } from '@playwright/test';

/**
 * The "50 x-* behaviors" example set used to include
 * `<button x-darkmode target="html" theme="light">` — but darkmode()
 * (src/wb-viewmodels/darkmode.js) applies its theme change IMMEDIATELY on
 * injection, not just on click (by design, for its own standalone demo
 * page). Once the playground started scanning eagerly (so pasted content
 * works instantly — see WB.scan's `{ eager: true }` option), this example
 * silently force-changed the whole page's theme the moment the example set
 * loaded, hijacking whatever theme was actually selected. Replaced with
 * x-counter (a plain character-count widget with no page-wide side effect).
 */
test('selecting the x-behaviors example set does not change the site theme', async ({ page }) => {
  await page.goto('/demos/playground.html', { waitUntil: 'networkidle' });
  // Wait for the behavior's public instance API and rendered select. The
  // canonical custom-element selector is the tag itself; themecontrol no
  // longer mirrors that name into a redundant class.
  await page.waitForFunction(() => {
    const tc = document.getElementById('pg-themecontrol');
    return !!tc && !!tc.wbThemeControl && !!tc.querySelector('select.x-themecontrol__select');
  }, { timeout: 15000 });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'ocean'));

  await page.selectOption('#pg-examples', 'xbehaviors');
  await page.waitForFunction(() => {
    const input = document.querySelector('#pg-preview input[x-counter]');
    return !!input && !!input.nextElementSibling?.classList.contains('x-counter');
  }, { timeout: 15000 });

  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(theme).toBe('ocean');

  // The replacement example itself should actually work.
  const counterSpan = page.locator('#pg-preview input[x-counter] + span.x-counter');
  await expect(counterSpan).toHaveText('0/50');
});
