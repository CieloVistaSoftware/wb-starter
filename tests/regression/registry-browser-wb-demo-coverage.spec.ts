import { test, expect } from '@playwright/test';

/**
 * demos/registry-browser.html: the "Template Source" column used to show
 * every registered view's raw {{placeholder}} template as a
 * syntax-highlighted <div x-mdhtml> code sample with NO corresponding live
 * render next to it -- exactly the "code with no live example" defect
 * docs/standards/DEMOS-AND-DOCS-STANDARDS.md §16 calls out. Each row now
 * builds a real, live instance of the view's own tag (required attributes
 * filled with placeholder values) wrapped in a <div x-demo>, whose own
 * auto-generated source panel replaces the old <div x-mdhtml> block entirely
 * (§2: never two code samples for one rendered element).
 *
 * John also asked for the demo's "Docs: ..." link to sit in the
 * upper-right corner on this page (reusing demo.css's per-card corner-badge
 * visual pattern, generalized to the shared .x-demo__links line since
 * these rows render registered VIEW tags, not x-card* elements).
 */

const PAGE = '/demos/registry-browser.html';

async function ready(page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.registry-table tbody tr', { timeout: 15000 });
  return errors;
}

// Scrolls every matched row into view (the table's x-demo blocks build
// lazily via an IntersectionObserver, like every other x-demo on the
// site) and returns per-row facts once each has had a chance to render.
// Each row is POLLED (not just given a fixed delay) until its grid + code
// panel actually appear, or a generous per-row timeout elapses -- demo()'s
// own behavior/CSS load is a dynamic import (async, JIT-loaded, see
// wb-lazy.js's WB.inject) and can legitimately take longer than a short
// fixed sleep on a cold first call, especially for the first few rows
// scrolled to right after page load.
async function collectRowReport(page) {
  return page.evaluate(async () => {
    function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
    const rows = Array.from(document.querySelectorAll('.registry-table tbody tr'));
    const report: any[] = [];
    for (const row of rows) {
      const name = row.querySelector('.view-name')?.textContent?.trim() || '';
      (row as HTMLElement).scrollIntoView({ block: 'center' });

      const deadline = Date.now() + 4000;
      let grid: Element | null = null;
      let code: Element | null = null;
      while (Date.now() < deadline) {
        const demo = row.querySelector('[x-demo]');
        grid = demo ? demo.querySelector('.x-demo__grid') : null;
        code = demo ? demo.querySelector('.x-demo__code, pre') : null;
        if (grid && grid.innerHTML.trim().length > 0 && code && (code.textContent || '').trim().length > 0) {
          break;
        }
        await sleep(100);
      }

      const demo = row.querySelector('[x-demo]');
      const gridHTML = grid ? grid.innerHTML.trim() : '';
      const codeText = code ? (code.textContent || '').trim() : '';
      const hasOldMdhtml = !!row.querySelector('[x-mdhtml]');
      const docLink = demo ? demo.querySelector('.x-demo__links') : null;
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

test.describe('registry-browser.html: every row gets a live [x-demo], not just a code sample', () => {
  test('table loads all registered views as rows', async ({ page }) => {
    await ready(page);
    const rowCount = await page.locator('.registry-table tbody tr').count();
    expect(rowCount).toBeGreaterThan(10); // registry currently holds 21 views
  });

  test('a meaningful number of rows render a real [x-demo] with a visible grid + source panel', async ({ page }) => {
    // 21 rows, each polled up to 4s worst case (see collectRowReport) --
    // generous headroom over the 30s default, matching the precedent set
    // for other x-demo-hydration-heavy pages (see playwright.config.ts's
    // integration project comment on the same class of contention).
    test.setTimeout(90000);
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

  test('the old <div x-mdhtml> code-only block is gone from every row', async ({ page }) => {
    // No need to wait for lazy render here -- the markup is generated
    // directly by loadRegistry() and never contains a x-mdhtml tag
    // regardless of whether each row's x-demo has finished building yet.
    await ready(page);
    const count = await page.locator('#registry-container [x-mdhtml]').count();
    expect(count, 'no row should still use the old mdhtml-only code block').toBe(0);
  });

  test('the usage-example above the table still shows its own correct source (no cross-contamination)', async ({ page }) => {
    await ready(page);
    const codeText = await page.locator('#usage-example .x-demo__code, #usage-example pre').first().innerText();
    expect(codeText).toContain('[x-badge]');
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
    test.setTimeout(90000);
    await ready(page);
    await collectRowReport(page); // forces every row's x-demo to build

    const links = page.locator('#registry-container [x-demo] > .x-demo__links');
    const count = await links.count();
    // The registry's "button-group" and "toolbar" views both compose a real
    // <button>, which resolves to a real documented component -- so this
    // page is expected to produce at least one corner doc link deterministically.
    expect(count, 'expected at least one row to resolve a real component doc link').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const demo = page.locator('#registry-container [x-demo]').filter({ has: link });
      await expect(demo.first()).toHaveCSS('position', 'relative');
      await expect(link).toHaveCSS('position', 'absolute');
      const top = await link.evaluate((el) => getComputedStyle(el).top);
      const right = await link.evaluate((el) => getComputedStyle(el).right);
      // Pinned to the corner -- negative top/right, matching demo.css's
      // existing per-card corner-badge convention (x-demo__card-doc-link).
      expect(parseFloat(top)).toBeLessThan(0);
      expect(parseFloat(right)).toBeLessThan(0);
    }
  });
});
