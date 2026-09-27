/**
 * REGRESSION: codecontrol.js's own applyTheme() (distinct from
 * semantics/code.js's separate fallback loader, already covered by
 * code-theme-local-vs-cdn.spec.ts) built every non-local theme's stylesheet
 * URL from HLJS_STYLES_PATH ('/node_modules/highlight.js/styles/') -- a
 * dev-only path never deployed to production. applyTheme() runs
 * immediately on <div x-codecontrol> init (not just on user selection), so
 * this broke syntax highlighting for the DEFAULT theme ('atom-one-dark')
 * on every page load that includes a <div x-codecontrol>, plus any of the
 * ~40 other non-local themes a user could pick from the dropdown.
 * Confirmed live: setting the theme link to that node_modules path on the
 * deployed .io site produces a real network 404, wiping out all coloring.
 *
 * Tested against demos/site/content.html, a real page that already ships
 * a <div x-codecontrol> instance, rather than synthetic injection.
 */
import { test, expect } from '@playwright/test';

const PAGE_URL = '/demos/site/content.html';

test.describe('x-codecontrol theme URLs must never point at a dev-only path', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('x-code-theme')).catch(() => {});
  });

  test('the default theme (atom-one-dark) resolves to a real cdnjs URL, not /node_modules/', async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.waitForFunction(() => {
      const el = document.querySelector('x-codecontrol') as any;
      return !!(el && el.wbCodeControl);
    }, { timeout: 15000 });

    const href = await page.locator('link[data-highlight-theme]').getAttribute('href');

    expect(href, 'must not build a dev-only node_modules path').not.toContain('/node_modules/');
    expect(href, 'must resolve to a real cdnjs URL for a genuine CDN theme').toContain('cdnjs.cloudflare.com');

    const response = await page.request.get(href!);
    expect(response.status(), 'the resolved theme stylesheet must actually serve (not 404)').toBe(200);
  });

  test('selecting a non-local theme from the dropdown (e.g. monokai) also resolves to a working cdnjs URL', async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.waitForFunction(() => {
      const el = document.querySelector('x-codecontrol') as any;
      return !!(el && el.wbCodeControl);
    }, { timeout: 15000 });

    await page.evaluate(() => {
      const el = document.querySelector('x-codecontrol') as any;
      el.wbCodeControl.setTheme('monokai');
    });
    await page.waitForTimeout(200);

    const href = await page.locator('link[data-highlight-theme]').getAttribute('href');
    expect(href, 'must not build a dev-only node_modules path').not.toContain('/node_modules/');
    expect(href, 'must resolve to a real cdnjs URL').toContain('cdnjs.cloudflare.com');

    const response = await page.request.get(href!);
    expect(response.status(), 'the resolved theme stylesheet must actually serve (not 404)').toBe(200);
  });

  test('selecting the local x-grayscale-dark theme still resolves to its real local file, not a CDN URL', async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.waitForFunction(() => {
      const el = document.querySelector('x-codecontrol') as any;
      return !!(el && el.wbCodeControl);
    }, { timeout: 15000 });

    await page.evaluate(() => {
      const el = document.querySelector('x-codecontrol') as any;
      el.wbCodeControl.setTheme('x-grayscale-dark');
    });
    await page.waitForTimeout(200);

    const href = await page.locator('link[data-highlight-theme]').getAttribute('href');
    expect(href, 'a local WB theme must not be misrouted to cdnjs').not.toContain('cdnjs.cloudflare.com');
    expect(href, 'a local WB theme must resolve to its real local file').toContain('/src/styles/code-themes/x-grayscale-dark.css');

    const response = await page.request.get(href!);
    expect(response.status(), 'the local theme file itself must actually serve').toBe(200);
  });
});
