/**
 * #725 — a page that exists must be reachable by its own URL.
 *
 * `navigateTo()` used to rewrite any pageId that was not a NAVIGATION MENU item
 * to 'home' — silently, URL unchanged, no 404. 10 of the 20 files in pages/
 * were unreachable, including ?page=privacy and ?page=terms, which the site's
 * own footer links to on every page.
 *
 * The same rule existed twice: once in navigateTo() and once in init(), where
 * the ?page= parameter was dropped before navigateTo() ever saw it. Fixing one
 * changed nothing, which is why this test loads pages through the real URL
 * rather than calling navigateTo() directly — only the URL path exercises both.
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const PAGES_DIR = path.join(process.cwd(), 'pages');

/** Pages that legitimately do not render through the SPA route. */
const NOT_SPA_ROUTED = new Set([
  'newpage',                  // template scaffold, not a real page
  'ai-permutation-test',      // harness
]);

const pageIds = fs.readdirSync(PAGES_DIR)
  .filter((f) => f.endsWith('.html'))
  .map((f) => f.replace(/\.html$/, ''))
  .filter((id) => !NOT_SPA_ROUTED.has(id));

test.describe('#725 — every page is reachable by URL', () => {
  for (const id of pageIds) {
    test(`?page=${id} renders ${id}, not home`, async ({ page }) => {
      await page.goto(`/?page=${id}`);
      await page.waitForFunction(() => (window as any).WBSite?.currentPage, { timeout: 25000 });
      await page.waitForTimeout(900);

      const state = await page.evaluate(() => {
        const main = document.getElementById('main');
        const first = main?.firstElementChild as HTMLElement | null;
        return {
          currentPage: (window as any).WBSite?.currentPage,
          container: first?.id || null,
          is404: !!document.getElementById('empty404'),
        };
      });

      expect(state.currentPage, `?page=${id} must not be rewritten`).toBe(id);
      expect(state.is404, `${id}.html exists, so it must not 404`).toBe(false);
      expect(state.container, `expected the ${id} page container`).toBe(`mainPage-${id}`);
    });
  }

  test('the footer links the reader can actually click land on their pages', async ({ page }) => {
    await page.goto('/?page=behaviors');
    await page.waitForSelector('#behaviors-search', { timeout: 25000 });

    const hrefs = await page.evaluate(() =>
      [...document.querySelectorAll('footer a[href^="?page="]')].map((a) => a.getAttribute('href') || ''),
    );
    expect(hrefs.length, 'expected footer page links').toBeGreaterThan(0);

    for (const href of hrefs) {
      const id = new URLSearchParams(href.replace(/^\?/, '')).get('page');
      await page.goto(`/${href}`);
      await page.waitForFunction(() => (window as any).WBSite?.currentPage, { timeout: 25000 });
      await page.waitForTimeout(700);
      const landed = await page.evaluate(() => (window as any).WBSite?.currentPage);
      expect(landed, `footer link ${href} landed on ${landed}`).toBe(id);
    }
  });
});

test.describe('#725 — a page that does not exist says so', () => {
  test('an unknown page renders the 404 state, not home', async ({ page }) => {
    await page.goto('/?page=definitely-not-a-page');
    await page.waitForFunction(() => (window as any).WBSite?.currentPage, { timeout: 25000 });
    await page.waitForTimeout(900);

    const state = await page.evaluate(() => ({
      currentPage: (window as any).WBSite?.currentPage,
      is404: !!document.getElementById('empty404'),
      isHome: document.getElementById('mainPage-home') !== null,
    }));

    expect(state.is404, 'a missing page must show the 404 state').toBe(true);
    expect(state.isHome, 'and must NOT quietly show home').toBe(false);
  });

  test('an invalid page id is refused before any fetch', async ({ page }) => {
    await page.goto('/?page=behaviors');
    await page.waitForSelector('#behaviors-search', { timeout: 25000 });

    const state = await page.evaluate(async () => {
      const requested: string[] = [];
      const origFetch = window.fetch;
      window.fetch = function (input: any, ...rest: any[]) {
        requested.push(String(typeof input === 'string' ? input : input?.url));
        return origFetch.call(this, input, ...rest);
      } as any;

      await (window as any).WBSite.navigateTo('../../etc/passwd');
      await new Promise((r) => setTimeout(r, 600));
      window.fetch = origFetch;

      return {
        is404: !!document.getElementById('empty404'),
        fetchedTraversal: requested.some((u) => u.includes('..')),
      };
    });

    expect(state.fetchedTraversal, 'a traversal id must never reach the fetch').toBe(false);
    expect(state.is404, 'and it must land on the 404 state').toBe(true);
  });
});
