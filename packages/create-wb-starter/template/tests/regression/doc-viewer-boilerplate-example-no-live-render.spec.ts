import { test, expect } from '@playwright/test';

/**
 * Live-reported: docs/V3-GUIDE.md:74-100 shows a full-document boilerplate
 * example (```html <!DOCTYPE html><html>...<head><link href="src/styles/
 * themes.css">...<body><article>...) illustrating "here's how to wire up
 * your own index.html". mdhtml.js's auto-live-render conversion (John:
 * "all of these examples must use x-demo") matched it because the block
 * contains a real <article> tag nested deep inside -- but wrapping the
 * WHOLE boilerplate (including its <link> tags) in a live <div x-demo> made
 * the browser actually parse and fetch those <link href> values as real
 * page resources. The paths were only ever meant to be read as
 * illustrative text, so they resolved (wrongly) against doc-viewer.html's
 * own location: /public/src/styles/themes.css and /public/src/styles/
 * site.css both 404'd on every load of this page.
 *
 * Fix: a fenced block containing <!DOCTYPE>/<html>/<head>/<body> is a
 * whole-file illustration, not a live-renderable snippet -- excluded from
 * conversion regardless of what's nested inside it.
 */
test.describe('Full-document boilerplate examples are never auto-live-rendered', () => {
  test('V3-GUIDE.md loads with no 404s and no console errors', async ({ page }) => {
    const failed404s: string[] = [];
    const errors: string[] = [];
    page.on('response', (res) => { if (res.status() === 404) failed404s.push(res.url()); });
    page.on('requestfailed', (req) => failed404s.push(req.url()));
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/public/doc-viewer.html?file=docs%2FV3-GUIDE.md', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#content', { timeout: 15000 });
    await page.waitForTimeout(2000);

    expect(failed404s, `unexpected 404/failed requests: ${failed404s.join(', ')}`).toEqual([]);
    expect(errors, `unexpected page errors: ${errors.join(', ')}`).toEqual([]);
  });

  test("the boilerplate example's <link> tags never become real page resources", async ({ page }) => {
    const themesRequests: string[] = [];
    page.on('request', (req) => { if (req.url().includes('/public/src/styles/')) themesRequests.push(req.url()); });

    await page.goto('/public/doc-viewer.html?file=docs%2FV3-GUIDE.md', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#content', { timeout: 15000 });
    await page.waitForTimeout(2000);

    expect(
      themesRequests,
      'the boilerplate <link href="src/styles/..."> example must never trigger a real network request'
    ).toEqual([]);
  });
});
