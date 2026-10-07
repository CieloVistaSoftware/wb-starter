import { test, expect } from '../fixtures/offline';
import { settlePage } from '../base';

/**
 * REGRESSION: demos/playground.html's "Endpoint sees" panel (#pg-endpoint)
 * is supposed to only appear from inside the preview's real <form> submit
 * handler. Root cause of it showing unconditionally on every page load and
 * every example switch: .pg-panel's own `display: flex` (author CSS) wins
 * over the browser's default `[hidden]{display:none}` (user-agent CSS)
 * regardless of selector specificity -- author origin always beats UA
 * origin. This page doesn't load normalize.css (which has a global
 * `[hidden]{display:none!important}` safety net for exactly this), so the
 * `hidden` attribute on #pg-endpoint did nothing at all.
 */
test('Endpoint sees panel is hidden on initial page load', async ({ page }) => {
  await page.goto('/demos/playground.html');
  await expect(page.locator('#pg-endpoint'), 'must not show before any form is ever submitted').toBeHidden();
});

test('Endpoint sees panel does not persist after switching to a non-form example', async ({ page }) => {
  await page.goto('/demos/playground.html');

  // Load the "Sample form" example and submit it to make the panel appear.
  // The sample form has `required` fields (name/email) -- an empty submit
  // is silently blocked by native constraint validation before the 'submit'
  // event ever fires, so those need filling in first.
  await page.selectOption('#pg-examples', 'form');
  // #961: wait for the preview's eager scan to finish before typing. The input
  // behavior wraps each <input> (moves it into .x-input__wrapper); a fill()
  // that focused the field just before the move typed into nothing, the
  // required field stayed empty, the browser blocked the submit and the panel
  // never appeared (reproduced 2 in 40: `invalid fullName value=""`, the
  // field filled AFTER the wrap kept its value).
  await settlePage(page);
  await page.fill('#pg-preview form input[name="fullName"]', 'Test User');
  await page.fill('#pg-preview form input[name="email"]', 'test@example.com');
  await page.click('#pg-preview form button[type="submit"]');

  const endpointPanel = page.locator('#pg-endpoint');
  await expect(endpointPanel, 'panel must appear after a real form submit').toBeVisible({ timeout: 5000 });

  // Switch to an unrelated, non-form example.
  await page.selectOption('#pg-examples', 'cards');
  // No sleep (#1516): toBeHidden retries until the panel goes.

  await expect(endpointPanel, 'stale panel must not persist into an unrelated example').toBeHidden();
});
