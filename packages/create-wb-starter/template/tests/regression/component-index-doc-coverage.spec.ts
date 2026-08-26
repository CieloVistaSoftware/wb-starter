import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';

/**
 * #581: docs/components/feedback/alert.md (and 14 sibling files) were unwritten
 * placeholder stubs -- "# Alert\n\nMoved from feedback.readme.md. Update content
 * as needed." -- for an unknown length of time, with nothing in the test suite
 * to catch it. John: "write a test that clicks on all components on the
 * component page and tests to ensure the proper things are displayed."
 *
 * This test is driven entirely by data/component-index.json (the same data
 * source pages/components.html itself renders its table from -- see
 * `fetch('data/component-index.json')` in that page's own script), so it
 * automatically covers every current and future component, not just the 15
 * files fixed for #581.
 *
 * Two things are asserted for every component's doc-viewer page:
 *   1. It is not a placeholder stub, and has more than just a title.
 *   2. It contains at least one LIVE `<div x-demo>` example with real rendered
 *      content (not an empty/placeholder `.x-demo__grid`) -- proof the doc
 *      actually shows the component working, not just prose about it.
 */

type ComponentEntry = {
  name: string;
  title: string;
  description: string;
  category: string;
  tag: string;
  docPath: string;
  demoPage: string | null;
  demoAnchor: string | null;
};

const INDEX: { components: ComponentEntry[] } = JSON.parse(
  readFileSync('data/component-index.json', 'utf-8')
);

function docHref(docPath: string): string {
  return `/public/doc-viewer.html?file=${encodeURIComponent(docPath)}`;
}

// A doc is a "stub" if its rendered body is just the auto-generated
// migration placeholder ("Moved from X.readme.md. Update content as
// needed.") with nothing else added -- the exact defect #581 was filed for.
const STUB_PATTERN = /moved from [\w.-]+\.readme\.md\.?\s*update content as needed/i;

// Components whose doc does not (yet) contain a live-renderable `<wb-*>`/`x-*`
// example for mdhtml.js's autoLiveRender to promote into a `<div x-demo>` --
// confirmed by crawling every doc-viewer page in this component index and
// counting `.x-demo__grid` elements with children. Both are PRE-EXISTING
// (neither is one of the 15 docs #581 covers) and use markup mdhtml.js's
// promotion rule deliberately does not treat as "real component usage"
// (see src/wb-viewmodels/mdhtml.js's `isRenderable` check -- it requires a
// `wb-*` tag or an `x-*` attribute, so a plain `<pre language="JS">` or a
// customized-built-in `<ul is="x-list">` example is left as a static,
// syntax-highlighted code sample rather than being upgraded to live):
//   - docs/components/semantics/pre.md   -- examples are plain `<pre>` tags
//   - docs/components/semantics/list.md  -- example uses `<ul is="x-list">`
// Tracked as a follow-up outside #581's scope (writing 15 stub docs); do not
// grow this list for anything else without the same live-crawl verification.
const NO_LIVE_DEMO_DOCPATHS = new Set<string>([
  'docs/components/semantics/pre.md',
  'docs/components/semantics/list.md',
]);

test.describe('component index page (#581)', () => {
  test('lists every component from data/component-index.json with a working doc link', async ({ page }) => {
    await page.goto('/pages/components.html', { waitUntil: 'domcontentloaded' });

    const table = page.locator('#component-index-table');
    await expect(table).toBeVisible();

    const rows = page.locator('#component-index-tbody tr');
    await expect(rows).toHaveCount(INDEX.components.length);

    // Spot-check: every row's first link resolves to /public/doc-viewer.html?file=...
    const hrefs = await page.locator('#component-index-tbody tr td:first-child a').evaluateAll(
      (as) => as.map((a) => (a as HTMLAnchorElement).getAttribute('href') || '')
    );
    expect(hrefs).toHaveLength(INDEX.components.length);
    for (const href of hrefs) {
      expect(href).toContain('public/doc-viewer.html?file=');
    }
  });

  test('clicking a component link navigates to its real, non-stub doc', async ({ page }) => {
    await page.goto('/pages/components.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#component-index-table')).toBeVisible();

    // Alert is one of the fifteen #581 components -- clicking through it
    // from the live index page (not just navigating directly) exercises the
    // actual "click on a component in the list" path John asked for.
    await page.locator('#component-index-search').fill('alert');
    const row = page.locator('#component-index-tbody tr', { hasText: 'Alert' }).first();
    await expect(row).toBeVisible();
    await row.locator('a').first().click();

    await expect(page).toHaveURL(/doc-viewer\.html\?file=docs%2Fcomponents%2Ffeedback%2Falert\.md/);
    const bodyText = (await page.locator('body').innerText()).trim();
    expect(STUB_PATTERN.test(bodyText)).toBe(false);
    await expect(page.locator('x-demo').first().locator('.x-demo__grid > *').first()).toBeVisible();
  });
});

test.describe('every component doc renders real content + a live example (#581)', () => {
  for (const c of INDEX.components) {
    test(`${c.name} (${c.docPath}): not a stub, has real content`, async ({ page }) => {
      const errs: string[] = [];
      page.on('pageerror', (e) => errs.push(String(e)));

      await page.goto(docHref(c.docPath), { waitUntil: 'domcontentloaded' });

      // 1. Not a placeholder stub -- and more than just an H1 title.
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();

      const bodyText = (await page.locator('body').innerText()).trim();
      expect(STUB_PATTERN.test(bodyText), `${c.docPath} still renders the #581 placeholder stub text`).toBe(false);

      const headingText = (await heading.innerText()).trim();
      const remainder = bodyText.replace(headingText, '').trim();
      expect(
        remainder.length,
        `${c.docPath} renders nothing beyond its H1 title (found only: "${bodyText}")`
      ).toBeGreaterThan(40);

      expect(errs, `no page errors while rendering ${c.docPath}`).toEqual([]);
    });

    if (!NO_LIVE_DEMO_DOCPATHS.has(c.docPath)) {
      test(`${c.name} (${c.docPath}): has at least one live x-demo example`, async ({ page }) => {
        await page.goto(docHref(c.docPath), { waitUntil: 'domcontentloaded' });

        // mdhtml.js promotes eligible ```html fences (or raw <div x-demo> blocks
        // already in the source) into live <div x-demo> elements -- each one
        // builds a `.x-demo__grid` containing the actual rendered control.
        // Some components upgrade a beat after DOMContentLoaded, so poll.
        await expect
          .poll(
            async () =>
              page.locator('x-demo .x-demo__grid').evaluateAll((grids) =>
                grids.some((g) => g.children.length > 0)
              ),
            {
              message: `${c.docPath} should render at least one live x-demo example with real content`,
              timeout: 15000,
            }
          )
          .toBe(true);
      });
    }
  }
});
