import { test, expect } from '@playwright/test';

/**
 * demos/registry-browser.html: the "Template Source" column used to show
 * every registered view's raw {{placeholder}} template as a
 * syntax-highlighted <wb-mdhtml> code sample with NO corresponding live
 * render next to it -- exactly the "code with no live example" defect
 * docs/standards/DEMOS-AND-DOCS-STANDARDS.md §16 calls out. Each row now
 * builds a real, live instance of the view's own tag (required attributes
 * filled with placeholder values) wrapped in a <wb-demo>, whose own
 * auto-generated source panel replaces the old <wb-mdhtml> block entirely
 * (§2: never two code samples for one rendered element).
 *
 * John also asked for the demo's "Docs: ..." link to sit in the
 * upper-right corner on this page (reusing demo.css's per-card corner-badge
 * visual pattern, generalized to the shared .wb-demo__links line since
 * these rows render registered VIEW tags, not wb-card* elements).
 */

const PAGE = '/demos/registry-browser.html';

async function ready(page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.registry-table tbody tr', { timeout: 15000 });
  return errors;
}

// Scrolls every matched row into view (the table's wb-demo blocks build
// lazily via an IntersectionObserver, like every other wb-demo on the
// site) and returns per-row facts once each has had a chance to render.
async function collectRowReport(page) {
  return page.evaluate(async () => {
    function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
    const rows = Array.from(document.querySelectorAll('.registry-table tbody tr'));
    const report: any[] = [];
    for (const row of rows) {
      const name = row.querySelector('.view-name')?.textContent?.trim() || '';
      (row as HTMLElement).scrollIntoView({ block: 'center' });
      await sleep(120);
      const demo = row.querySelector('wb-demo');
      const grid = demo ? demo.querySelector('.wb-demo__grid') : null;
      const gridHTML = grid ? grid.innerHTML.trim() : '';
      const code = demo ? demo.querySelector('.wb-demo__code, pre') : null;
      const codeText = code ? (code.textContent || '').trim() : '';
      const hasOldMdhtml = !!row.querySelector('wb-mdhtml');
      const docLink = demo ? demo.querySelector('.wb-demo__links') : null;
      report.push({
        name,
        hasGrid: !!grid,
        gridHTMLLength: gridHTML.length,
        codeLength: codeText.length,
        hasOldMdhtml,
        hasDocLink: !!docLink,
        docLinkText: docLink ? (docLink.textContent || '').trim() : null
      });
    }
    window.scrollTo(0, 0);
    return report;
  });
}

test.describe('registry-browser.html: every row gets a live wb-demo, not just a code sample', () => {
  test('table loads all registered views as rows', async ({ page }) => {
    await ready(page);
    const rowCount = await page.locator('.registry-table tbody tr').count();
    expect(rowCount).toBeGreaterThan(10); // registry currently holds 21 views
  });

  test('a meaningful number of rows render a real wb-demo with a visible grid + source panel', async ({ page }) => {
    const errors = await ready(page);
    const report = await collectRowReport(page);

    expect(report.length).toBeGreaterThan(10);

    const withGrid = report.filter((r) => r.hasGrid && r.gridHTMLLength > 0);
    const withSource = report.filter((r) => r.codeLength > 0);

    // Every row should have live-rendered content and a non-empty source
    // panel -- not just "most" of them. If a future view genuinely can't
    // self-render standalone, that's an intentional, reported exception,
    // not a silent gap this test should tolerate creeping back in.
    expect(
      withGrid.length,
      `rows missing a live grid: ${JSON.stringify(report.filter((r) => !r.hasGrid || r.gridHTMLLength === 0).map((r) => r.name))}`
    ).toBe(report.length);
    expect(
      withSource.length,
      `rows missing a source panel: ${JSON.stringify(report.filter((r) => r.codeLength === 0).map((r) => r.name))}`
    ).toBe(report.length);

    expect(errors, `no page errors while rendering the table: ${JSON.stringify(errors)}`).toEqual([]);
  });

  test('the old <wb-mdhtml> code-only block is gone from every row', async ({ page }) => {
    await ready(page);
    const report = await collectRowReport(page);
    const stillMdhtml = report.filter((r) => r.hasOldMdhtml);
    expect(stillMdhtml, `rows still using the old mdhtml-only block: ${JSON.stringify(stillMdhtml.map((r) => r.name))}`).toEqual([]);
  });

  test('the usage-example above the table still shows its own correct source (no cross-contamination)', async ({ page }) => {
    await ready(page);
    const codeText = await page.locator('#usage-example .wb-demo__code, #usage-example pre').first().innerText();
    expect(codeText).toContain('wb-badge');
    // Regression guard: this page's own explanatory comments about the demo
    // wrapper tag must never leak into the usage-example's shown source --
    // that happened once already (page-source-cache.js's extraction regex
    // has no awareness of HTML/CSS/JS comment syntax, and matched a stray
    // literal mention of the tag as if it were real markup).
    expect(codeText.length).toBeLessThan(500);
    expect(codeText).not.toContain('extractTagBlock');
    expect(codeText).not.toContain('attachCardDocLink');
  });

  test('rows whose view resolves to a real documented component get a corner-pinned doc link', async ({ page }) => {
    await ready(page);
    await collectRowReport(page); // forces every row's wb-demo to build

    const links = page.locator('#registry-container wb-demo > .wb-demo__links');
    const count = await links.count();
    // The registry's "button-group" and "toolbar" views both compose a real
    // <wb-button>, which resolves to a real documented component -- so this
    // page is expected to produce at least one corner doc link deterministically.
    expect(count, 'expected at least one row to resolve a real component doc link').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const demo = page.locator('#registry-container wb-demo').filter({ has: link });
      await expect(demo.first()).toHaveCSS('position', 'relative');
      await expect(link).toHaveCSS('position', 'absolute');
      const top = await link.evaluate((el) => getComputedStyle(el).top);
      const right = await link.evaluate((el) => getComputedStyle(el).right);
      // Pinned to the corner -- negative top/right, matching demo.css's
      // existing per-card corner-badge convention (wb-demo__card-doc-link).
      expect(parseFloat(top)).toBeLessThan(0);
      expect(parseFloat(right)).toBeLessThan(0);
    }
  });
});
