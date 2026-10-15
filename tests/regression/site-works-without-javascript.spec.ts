import { test, expect } from '../fixtures/offline';

/**
 * JavaScript off (#1877).
 *
 * The site is an app and requires JavaScript (John, 2026-10-15: "agreed
 * javascript must be on"), so with it off the home page says so instead of
 * sitting on "Loading..." forever. The selling point is about the library: a
 * page built with WB-Starter is semantic HTML and still reads without it.
 */
test.use({ javaScriptEnabled: false, serviceWorkers: 'block' });

test('with JavaScript off, the site says it needs JavaScript', async ({ page }) => {
  // The served HTML is checked, not the rendered text: in this harness Chromium
  // sometimes parses <noscript> as raw text even with JavaScript off.
  const res = await page.goto('/');
  const html = (await res!.text()).match(/<noscript>([\s\S]*?)<\/noscript>/i)?.[1] ?? '';
  expect(html, 'the home page has a <noscript> message').toContain('This site needs JavaScript');
  await expect(page.locator('#app'), 'the app never starts without JavaScript').toContainText('Loading');
});

test('with JavaScript off, a page built with WB-Starter still reads as semantic HTML', async ({ page }) => {
  await page.goto('/demos/autoinject.html');
  await expect(page.locator('h1').first()).toHaveText('Auto-Injection Demo');
  const text = (await page.locator('body').innerText()).trim();
  expect(text.length, 'readable text on the demo page').toBeGreaterThan(1000);
  expect(await page.locator('h2').count(), 'section headings').toBeGreaterThan(3);
});
