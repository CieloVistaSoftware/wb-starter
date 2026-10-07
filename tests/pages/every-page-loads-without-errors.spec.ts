import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import path from 'path';

import { settlePage } from '../base';
/**
 * Every page loads without throwing. The minimum smoke test.
 *
 * WHY IT DID NOT EXIST, AND WHAT THAT COST
 *
 * A migration rewrote a tag name into `customElements.define('[x-grid]', …)`.
 * That is not a valid custom element name, so the browser threw a
 * SyntaxError on load and the module never ran:
 *
 *   Uncaught SyntaxError: Failed to execute 'define' on
 *   'CustomElementRegistry': "[x-grid]" is not a valid custom element name
 *
 * 426 tests passed while that was true. John found it by opening the site.
 *
 * The reason is that a page which throws still RENDERS. The HTML parses, the
 * DOM exists, and assertions about headings, links and text all pass. Only
 * the JavaScript died. Unless something explicitly watches for uncaught
 * errors, a crash on load is invisible to a test suite — and only 3 of ~30
 * page specs listened for `pageerror`, none of them on a page that loaded the
 * broken module.
 *
 * So this asserts the absence of a problem, which is the thing the rest of
 * the suite could not do. It is deliberately shallow and covers everything,
 * rather than deep and covering a few.
 *
 * SCOPE
 *
 * Every page in config/site.json's navigationMenu — the real site, from the
 * same source the nav is built from, so a page added to the site is covered
 * here the day it is added rather than when someone remembers to add a test.
 */

const ROOT = process.cwd();

interface NavItem { menuItemId?: string; pageToLoad?: string; href?: string }

/**
 * id -> the URL the nav actually opens. An item with `href` is a plain link
 * (site-engine.js renderNav: `if (item.href) href = item.href`), not an SPA
 * page -- error-log opens errors-viewer.html. Loading it as ?page=error-log
 * tested a URL no link on the site points at, and reported the missing-page
 * placeholder for a nav entry that works. Each item is loaded where its link
 * goes, so an href item is still covered, just at its real address.
 */
function sitePages(): Map<string, string> {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/site.json'), 'utf8'));
  const menu: NavItem[] = config.navigationMenu || [];
  const pages = new Map<string, string>();
  for (const m of menu) {
    const id = m.pageToLoad || m.menuItemId;
    if (!id || pages.has(id)) continue;
    pages.set(id, m.href && !m.pageToLoad ? `/${m.href.replace(/^\//, '')}` : `/?page=${id}`);
  }
  return pages;
}

/** Noise that is not a page defect: third-party embeds, blocked trackers, 404s for optional assets. */
const IGNORE = [
  /favicon/i,
  /net::ERR_/i,
  /Failed to load resource/i,
  /youtube|doubleclick|googletagmanager/i,
  /ResizeObserver loop/i,          // benign, fires on legitimate layout work
];

const ignored = (text: string) => IGNORE.some((re) => re.test(text));

test.describe('Every page loads without errors', () => {
  const pages = sitePages();

  test('the page list is not empty', () => {
    // A silently-empty list would make every test below vacuously pass.
    expect(pages.size, 'no pages found in config/site.json navigationMenu').toBeGreaterThan(3);
  });

  for (const [pageId, url] of pages) {
    test(`${pageId} — no uncaught errors`, async ({ page }) => {
      const errors: string[] = [];

      // An uncaught exception. This is the one that would have caught the
      // customElements crash.
      page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));

      // console.error — a caught-but-reported failure. Still a defect.
      page.on('console', (msg) => {
        if (msg.type() !== 'error') return;
        const text = msg.text();
        if (!ignored(text)) errors.push(`console.error: ${text}`);
      });

      const response = await page.goto(url, { waitUntil: 'load' });
      expect(response?.status(), `${pageId}: ${url} did not load`).toBeLessThan(400);
      // Let the page's own requests settle, but bounded: the issues page pages
      // through the live GitHub API via /api/issues, and on a loaded CI runner
      // "network idle" arrived after the whole 30s test budget, so the test
      // timed out without ever looking for an error. Errors thrown by then are
      // still collected; one thrown later is caught by the wait below.
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      // Behaviors attach after the fragment is injected, so an error thrown
      // during enhancement lands after load. Waiting only for `load` would
      // miss exactly the class of bug this exists for.
      // Everything that could warn or fail has run once WB settles, where the page boots it (#1516: no fixed sleep).
      await settlePage(page, { timeout: 15000 }).catch(() => {});

      // A page that does not EXIST also throws nothing: the missing-page
      // fallback catches the 404, prints a placeholder and raises no console
      // error, so "did not throw" cannot tell a working page from an absent
      // one. error-log sat dead in the nav while this spec was green (#894).
      const body = (await page.locator('body').innerText()).trim();
      expect(
        body,
        `${pageId} rendered the missing-page placeholder — it is in the nav but has no pages/${pageId}.html`,
      ).not.toMatch(/Page not found/i);
      // The length floor is for SPA fragments, where a near-empty body means
      // the fragment never arrived. A standalone href page (errors-viewer.html)
      // is its own document -- its existence is the status check above, and an
      // EMPTY error log is legitimately short (161 chars): that is the page
      // working, not missing.
      if (url.startsWith('/?page=')) {
        expect(
          body.length,
          `${pageId} rendered almost nothing (${body.length} chars)`,
        ).toBeGreaterThan(200);
      }

      expect(
        errors.filter((e) => !ignored(e)),
        `${pageId} threw while loading.\n\n`
        + `A page that throws still renders — the DOM parses and assertions about\n`
        + `headings and links keep passing. Only the JavaScript died. That is why\n`
        + `this check exists separately from every other page test.\n`,
      ).toEqual([]);
    });
  }
});
