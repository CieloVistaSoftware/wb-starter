import { test, expect } from '../fixtures/offline';
import { injectAndScan } from '../helpers/inject-and-scan';

/**
 * MARKDOWN RENDERS WITHOUT ANY THIRD-PARTY HOST
 * =============================================
 * mdhtml.js loaded marked.js at runtime from
 * `https://cdn.jsdelivr.net/npm/marked/marked.min.js` -- unpinned, so the live
 * site ran whatever marked was newest (18.1.0 on 2026-10-08) while the repo
 * declares 17.0.1 and the offline test cache held 15.0.12. Any visitor whose
 * network, extension or CDN hiccup blocked jsdelivr got
 * "mdhtml Unexpected Error: Failed to load marked.js from CDN" for every
 * markdown block: the entries John's error viewer showed on the live site
 * (Behaviors, Themes, demos/site/content.html). marked now ships with the site
 * in src/lib, next to highlight.js.
 *
 * See it by hand: in DevTools block requests to cdn.jsdelivr.net and open
 * ?page=themes. Before: the markdown sections are empty and the error log gets
 * "mdhtml Unexpected Error". Now: they render.
 */

test.describe('x-mdhtml needs no CDN', () => {
  // Routes below abort other hosts; sw.js would answer them first (#1349).
  test.use({ serviceWorkers: 'block' });

  test('renders markdown with every other host unreachable, and logs nothing', async ({ page }) => {
    const thirdParty: string[] = [];
    await page.route((url) => url.hostname !== 'localhost' && url.hostname !== '127.0.0.1', (route) => {
      thirdParty.push(route.request().url());
      return route.abort();
    });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

    await injectAndScan(page, '<div id="md" x-mdhtml># Heading\n\nSome **bold** text.</div>');

    await expect(page.locator('#md h1')).toHaveText('Heading');
    await expect(page.locator('#md strong')).toHaveText('bold');
    expect(thirdParty.filter((u) => u.includes('marked')), 'marked must come from the site itself').toEqual([]);
    expect(errors.filter((e) => /mdhtml|marked/i.test(e)), 'no mdhtml error').toEqual([]);
    const logged = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('wb:error-log') || '{"errors":[]}').errors.map((e: { message: string }) => e.message); } catch { return []; }
    });
    expect(logged.filter((m: string) => /mdhtml/i.test(m)), 'error log').toEqual([]);
  });
});
