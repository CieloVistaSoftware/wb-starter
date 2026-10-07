import { test, expect } from '../fixtures/offline';

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
// A service worker that takes control mid-test makes service-worker.js release
// it and reload the page once on this development origin (#1108) -- which wipes
// the submitted panel, or destroys the context a wait is running in (seen
// locally). Blocked, as the other specs that hold page state do (#1349).
test.use({ serviceWorkers: 'block' });

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
  // The switch writes the form at once, but render() then scans it eagerly and
  // upgrades its controls. A value typed before that scan has finished could be
  // lost to it, leaving a required field empty, and native validation then
  // blocks the submit silently -- CI: "panel must appear after a real form
  // submit". So wait for every injection in the preview to call back, the
  // same wait openPlaygroundInputs() makes (#1516).
  // waitForFunction, not evaluate: it is re-run if the page's context is
  // replaced under it, which an evaluate is not (seen locally, intermittently,
  // with no navigation recorded).
  await page.waitForFunction(async () => {
    if (!document.querySelector('#pg-preview form input[name="fullName"]')) return false;
    await (window as any).WB.settled({ timeout: 15000 });
    return true;
  }, null, { timeout: 20000 });
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
