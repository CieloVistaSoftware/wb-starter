import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

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

interface NavItem { menuItemId?: string; pageToLoad?: string }

function sitePages(): string[] {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/site.json'), 'utf8'));
  const menu: NavItem[] = config.navigationMenu || [];
  return [...new Set(
    menu.map((m) => m.pageToLoad || m.menuItemId).filter((p): p is string => Boolean(p)),
  )];
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
    expect(pages.length, 'no pages found in config/site.json navigationMenu').toBeGreaterThan(3);
  });

  for (const pageId of pages) {
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

      await page.goto(`/?page=${pageId}`, { waitUntil: 'networkidle' });
      // Behaviors attach after the fragment is injected, so an error thrown
      // during enhancement lands after load. Waiting only for `load` would
      // miss exactly the class of bug this exists for.
      await page.waitForTimeout(1500);

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
