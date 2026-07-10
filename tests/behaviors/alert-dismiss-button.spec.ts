/**
 * <wb-alert dismissible>'s close button must actually remove the alert on click.
 *
 * Root cause: schema-builder.js's buildStructure() always wiped an element's
 * innerHTML and, for an empty $view (alert/button/card/demo — the behavior
 * owns the DOM, not the schema), restored it by serializing element.innerHTML
 * to a string (data.slot) then reassigning it. WB.observe()'s MutationObserver
 * independently calls processSchema() on reparented elements (e.g. demo.js
 * moving pre-existing children into its grid); when the schema wasn't cached
 * yet, that on-demand fetch could resolve AFTER feedback.js's alert() had
 * already built the real dismiss button with its click listener attached —
 * the late buildStructure() call then wiped and reparsed it from a string,
 * producing a listener-less look-alike. Confirmed live via CDP
 * (DOMDebugger.getEventListeners) and addEventListener tracing: the visible
 * close button had zero listeners ~90% of loads. Fixed by never touching
 * innerHTML at all when $view is empty.
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.WB_BASE || 'http://localhost:3000';
const URL = `${BASE.replace(/\/$/, '')}/?page=behaviors`;

test('dismissible alert close button removes the alert on click, on a fresh page load', async ({ page }) => {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#mainPage-behaviors', { timeout: 25000 });
  await page.waitForTimeout(2000);

  const before = await page.locator('[role="alert"]').count();
  expect(before, 'expected at least one alert on the page').toBeGreaterThan(0);

  await page.locator('.wb-alert__close').first().click();
  await page.waitForTimeout(300);

  const after = await page.locator('[role="alert"]').count();
  expect(after, 'clicking the dismiss button should remove one alert').toBe(before - 1);
});
