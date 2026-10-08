import { test, expect } from '../fixtures/offline';
import { readdirSync, readFileSync } from 'node:fs';
import { serveAsGitHubPages, PAGES_ROOT } from '../helpers/github-pages';

/**
 * #1734 -- a page fragment opened directly on a static host must not request
 * anything relative to /pages/ before it redirects.
 *
 * pages/*.html are fragments: their `src/styles/pages/<name>.css` links are
 * right when index.html injects them, and a guard at the top sends a direct
 * visit to ?page=<name>. But location.replace() only SCHEDULES the navigation;
 * the parser went on to the <link> right after the guard, and GitHub Pages
 * answered pages/src/styles/pages/demos.css?v=... with a 404 and a console
 * error on every direct visit (found crawling the live site). server.js wraps
 * fragments itself, so only a static host shows it -- hence the live origin
 * served like Pages (tests/helpers/github-pages.ts), not the dev server.
 *
 * The guard now calls window.stop() first. Every guarded fragment is checked,
 * derived from pages/ so a new one is covered the day it is added.
 *
 * See it by hand: open https://cielovistasoftware.github.io/wb-starter/pages/demos.html
 * with devtools' Network tab open. Before: pages/src/styles/pages/demos.css
 * 404s, then the page moves to ?page=demos. Now: it moves to ?page=demos with
 * no 404.
 */

// The live origin is answered by page.route; sw.js would answer it itself (#1349).
test.use({ serviceWorkers: 'block' });

const PAGES_DIR = new URL('../../pages/', import.meta.url);
const GUARDED = readdirSync(PAGES_DIR)
  .filter((f) => f.endsWith('.html'))
  .filter((f) => /location\.replace\(root/.test(readFileSync(new URL(f, PAGES_DIR), 'utf8')))
  .map((f) => f.replace(/\.html$/, ''))
  .sort();

test('the check is not vacuous: pages/ has guarded fragments, demos among them', () => {
  expect(GUARDED.length).toBeGreaterThan(5);
  expect(GUARDED).toContain('demos');
});

for (const name of GUARDED) {
  test(`pages/${name}.html opened directly redirects without requesting anything under /pages/`, async ({ page }) => {
    await serveAsGitHubPages(page);
    // What the reader gets is what counts: a response from under /pages/ (the
    // 404), or a console error for one. The browser's preload scanner may still
    // START the stylesheet request before the guard runs; window.stop() cancels
    // it, and a cancelled request returns nothing and logs nothing.
    const answeredUnderPages: string[] = [];
    const consoleErrors: string[] = [];
    page.on('response', (r) => {
      const u = new URL(r.url());
      if (u.hostname !== 'cielovistasoftware.github.io') return;
      // The fragment itself, and the SPA fetching it afterwards, are expected.
      if (u.pathname === `/wb-starter/pages/${name}.html`) return;
      if (u.pathname.startsWith('/wb-starter/pages/')) answeredUnderPages.push(`${r.status()} ${r.url()}`);
    });
    page.on('console', (m) => { if (m.type() === 'error' && /404/.test(m.text())) consoleErrors.push(m.text()); });

    await page.goto(`${PAGES_ROOT}pages/${name}.html`, { waitUntil: 'commit' });
    // The guard's redirect: the document leaves /pages/ for the SPA route.
    await page.waitForURL((u) => !u.pathname.includes('/pages/'), { timeout: 30000 });

    expect(answeredUnderPages, 'resolved relative to /pages/ before the redirect').toEqual([]);
    expect(consoleErrors, 'a 404 on the console during a direct visit').toEqual([]);
  });
}
