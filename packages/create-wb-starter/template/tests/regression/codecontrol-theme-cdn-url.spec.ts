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
 *
 * The site now loads nothing from a CDN (src/lib/VENDOR.md): genuine
 * highlight.js themes resolve to the vendored copies in src/lib/hljs-styles/.
 * The intent is unchanged -- never /node_modules/, and the URL must load.
 */
import { test, expect } from '@playwright/test';

const PAGE_URL = '/demos/site/content.html';

test.describe('x-codecontrol theme URLs must never point at a dev-only path', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('x-code-theme')).catch(() => {});
  });

  test('the default theme (atom-one-dark) resolves to the vendored src/lib stylesheet, not /node_modules/ or a CDN', async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.waitForFunction(() => {
      const el = document.querySelector('x-codecontrol') as any;
      return !!(el && el.wbCodeControl);
    }, { timeout: 15000 });

    const href = await page.locator('link[data-highlight-theme]').getAttribute('href');

    expect(href, 'must not build a dev-only node_modules path').not.toContain('/node_modules/');
    expect(href, 'must resolve to the vendored highlight.js theme').toContain('/src/lib/hljs-styles/atom-one-dark.min.css');
    expect(href, 'must never point at a CDN').not.toMatch(/cdnjs|jsdelivr|unpkg/);

    const response = await page.request.get(href!);
    expect(response.status(), 'the resolved theme stylesheet must actually serve (not 404)').toBe(200);
  });

  test('selecting a highlight.js theme from the dropdown (e.g. monokai) also resolves to a working vendored URL', async ({ page }) => {
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
    expect(href, 'must resolve to the vendored highlight.js theme').toContain('/src/lib/hljs-styles/monokai.min.css');
    expect(href, 'must never point at a CDN').not.toMatch(/cdnjs|jsdelivr|unpkg/);

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

  test('every CODE_THEMES entry resolves to a stylesheet that is vendored and serves 200', async ({ page }) => {
    await page.goto(PAGE_URL);
    const hrefs: Array<{ id: string; href: string }> = await page.evaluate(async () => {
      const mod = await import('/src/wb-viewmodels/codecontrol.js');
      return mod.CODE_THEMES.map((t: any) => ({
        id: t.id,
        href: t.path || new URL(`/src/lib/hljs-styles/${t.id}.min.css`, location.href).href,
      }));
    });
    expect(hrefs.length).toBeGreaterThan(40);
    const missing: string[] = [];
    for (const { id, href } of hrefs) {
      const res = await page.request.get(href);
      if (res.status() !== 200) missing.push(`${id} -> ${href} (${res.status()})`);
    }
    expect(missing, 'every selectable theme must have a vendored stylesheet').toEqual([]);
  });
});
