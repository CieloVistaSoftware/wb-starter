import { test, expect } from '@playwright/test';

/**
 * #664 / #666 — the Behaviors page's live selector.
 *
 * The page was rebuilt across ~17 commits, all verified by hand in a browser.
 * That hand-verification caught eight real bugs, but pinned none of them. This
 * spec pins the ones that would silently regress:
 *
 *   - the list is built from BOTH x-* registries (tag-map's extensionMap and
 *     wb-lazy's WB_LAZY_ONLY_ATTRIBUTES). Reading tag-map alone under-reported
 *     the surface by a third and nothing errored (#667).
 *   - auto-injected behaviors are listed as their SEMANTIC ELEMENT, not a
 *     duplicated x-* attribute (<button>, not x-button).
 *   - every axis produces rows: variant enums, non-variant enums (position,
 *     size, ...), and boolean flags (table's striped/bordered/...).
 *   - clicking or arrowing renders the example with that option APPLIED, and
 *     never scrolls the page.
 *   - curated examples come from data/behavior-examples.json, which is the only
 *     copy since the demo sections were removed from the page.
 */

const PAGE = '/pages/behaviors.html';

/** The selector builds asynchronously from two registries plus two data files. */
async function waitForSelector(page: import('@playwright/test').Page) {
  await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 100,
    null,
    { timeout: 30000 }
  );
  // The count is rendered from the same async load; wait for it to stop saying 0.
  await page.waitForFunction(
    () => !/^0 /.test(document.getElementById('behaviors-search-count')?.textContent ?? '0 '),
    null,
    { timeout: 30000 }
  );
}

test.describe('Behaviors selector — structure (#664/#666)', () => {
  test('rows cover both x-* registries, and every row is well formed', async ({ page }) => {
    await waitForSelector(page);

    const report = await page.evaluate(async () => {
      const rows = [...document.querySelectorAll('.behaviors-search-results__row')] as HTMLElement[];
      const root = location.pathname.replace(/pages\/.*$/, '');
      const tagMap: any = await import(root + 'src/core/tag-map.js');
      const lazy: any = await import(root + 'src/core/wb-lazy.js');
      const merged = { ...(lazy.WB_LAZY_ONLY_ATTRIBUTES || {}), ...tagMap.extensionMap };

      const labels = new Set(rows.map((r) => r.dataset.label));
      const attrs = new Set(rows.map((r) => r.dataset.browseToken));
      const malformed = rows.filter((r) => {
        if (!r.dataset.label || !r.dataset.browseToken) return true;
        // A row with a variant must say which property it belongs to.
        if (r.dataset.variant && !r.dataset.prop) return true;
        return r.children.length !== 2; // name column + option column
      });

      return {
        rowCount: rows.length,
        malformed: malformed.length,
        // wb-lazy-only attributes must be present -- reading tag-map alone
        // omitted these entirely (#667).
        lazyOnlyPresent: ['x-fadein', 'x-lightbox', 'x-confirm', 'x-bounce'].filter((t) => attrs.has(t)),
        // Morphing forms are excluded.
        asForms: [...attrs].filter((a) => (a || '').startsWith('x-as-')),
        // Auto-injected behaviors appear as semantic elements, not x-* duplicates.
        semanticLabels: ['button', 'article', 'audio', 'table', 'video'].filter((t) => labels.has(t)),
        duplicatedAttrLabels: ['x-button', 'x-card', 'x-audio', 'x-table'].filter((t) => labels.has(t)),
        registrySize: Object.keys(merged).length,
      };
    });

    expect(report.malformed, 'every row needs a label, a token, and two columns').toBe(0);
    // #783 removed morphing entirely. This assertion is kept deliberately:
    // it now guards against the feature being reintroduced rather than
    // against it leaking into the list.
    expect(report.asForms, 'x-as-* morphing forms must not be listed').toEqual([]);
    expect(report.lazyOnlyPresent, 'wb-lazy-only attributes must be listed (#667)')
      .toEqual(['x-fadein', 'x-lightbox', 'x-confirm', 'x-bounce']);
    expect(report.semanticLabels, 'auto-injected behaviors list as their semantic element')
      .toEqual(['button', 'article', 'audio', 'table', 'video']);
    expect(report.duplicatedAttrLabels, 'the duplicated x-* forms must be gone').toEqual([]);
    expect(report.rowCount).toBeGreaterThan(400);
  });

  test('all three axis kinds produce rows', async ({ page }) => {
    await waitForSelector(page);

    const axes = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('.behaviors-search-results__row')] as HTMLElement[];
      const props = new Set(rows.map((r) => r.dataset.prop).filter(Boolean));
      return {
        variant: rows.filter((r) => r.dataset.prop === 'variant').length,
        nonVariantEnum: rows.filter((r) => r.dataset.prop && r.dataset.prop !== 'variant' && !r.dataset.boolean).length,
        boolean: rows.filter((r) => r.dataset.boolean === '1').length,
        distinctProps: [...props].sort(),
      };
    });

    expect(axes.variant, 'variant enums produce rows').toBeGreaterThan(100);
    expect(axes.nonVariantEnum, 'non-variant enums (position, size, ...) produce rows').toBeGreaterThan(50);
    expect(axes.boolean, 'boolean flags produce rows').toBeGreaterThan(50);
    expect(axes.distinctProps).toEqual(expect.arrayContaining(['variant', 'size', 'position']));
  });
});

test.describe('Behaviors selector — permutations render with their option applied', () => {
  // One control per axis kind, walked EXHAUSTIVELY. Walking all ~583 rows would
  // be minutes of wall-clock for little extra signal; these cover every code
  // path the option-application logic has.
  const CONTROLS: Array<{ label: string; kind: string; minRows: number }> = [
    { label: 'table', kind: 'boolean', minRows: 7 },   // John: "many permutations of table"
    { label: 'alert', kind: 'variant', minRows: 4 },
    { label: 'button', kind: 'variant', minRows: 8 },
  ];

  for (const control of CONTROLS) {
    test(`${control.label}: every permutation renders and applies its ${control.kind}`, async ({ page }) => {
      test.slow(); // several sequential renders, each waiting on a lazy import
      await waitForSelector(page);

      const results = await page.evaluate(async (ctl) => {
        const out: any[] = [];
        const rows = [...document.querySelectorAll('.behaviors-search-results__row')] as HTMLElement[];
        const mine = rows.filter((r) => r.dataset.label === ctl.label && r.dataset.prop);

        for (const row of mine) {
          row.click();
          // Wait for THIS row's render rather than a fixed delay -- the panel
          // renders through a dynamic import, and a fixed wait produced false
          // mismatches while developing this page.
          // Mirrors optionLabel() in the page: a boolean reads as a BARE flag
          // name when demonstrated ON, and `prop=false` when demonstrated OFF.
          const want = row.dataset.prop === 'variant'
            ? row.dataset.variant
            : (row.dataset.boolean === '1'
                ? (row.dataset.variant === 'false' ? `${row.dataset.prop}=false` : row.dataset.prop)
                : `${row.dataset.prop}=${row.dataset.variant}`);
          const deadline = Date.now() + 8000;
          let header = '';
          while (Date.now() < deadline) {
            header = document.getElementById('behaviors-live-token')?.textContent ?? '';
            if (header.includes(want as string)) break;
            await new Promise((r) => setTimeout(r, 100));
          }
          const code = document.querySelector('#behaviors-live-code code')?.textContent ?? '';
          const stage = document.getElementById('behaviors-live-stage')!;
          out.push({
            option: want,
            header,
            headerMatches: header.includes(want as string),
            rendered: stage.children.length > 0,
            // A boolean is authored BARE (Standard §20); an enum as prop="value".
            // A boolean demonstrated ON must appear BARE; demonstrated OFF it
            // must appear as prop="false". A bare attribute cannot express
            // "off", and elevated/clickable are authored bare by this
            // project's own convention (card.js:159, #627).
            applied: row.dataset.boolean === '1'
              ? (row.dataset.variant === 'false'
                  ? new RegExp(`\\s${row.dataset.prop}="false"`).test(code)
                  : new RegExp(`\\s${row.dataset.prop}(?![=\\w])`).test(code))
              : new RegExp(`${row.dataset.prop}="${row.dataset.variant}"`).test(code),
          });
        }
        return out;
      }, control);

      expect(results.length, `${control.label} should expose permutations`)
        .toBeGreaterThanOrEqual(control.minRows);

      for (const r of results) {
        expect(r.headerMatches, `header should name the option: ${r.option} (got "${r.header}")`).toBe(true);
        expect(r.rendered, `${r.option} should render something`).toBe(true);
        expect(r.applied, `${r.option} should appear in the emitted source`).toBe(true);
      }
    });
  }

  test('table renders REAL rows, not an empty stub', async ({ page }) => {
    // striped/bordered are invisible on a table with no rows, so the curated
    // example matters as much as the flag.
    await waitForSelector(page);
    const info = await page.evaluate(async () => {
      const row = [...document.querySelectorAll('.behaviors-search-results__row')]
        .find((r: any) => r.dataset.label === 'table' && r.dataset.prop === 'striped') as HTMLElement;
      row.click();
      const deadline = Date.now() + 8000;
      while (Date.now() < deadline) {
        // The host element IS <wb-table>; it holds thead/tbody directly rather
        // than wrapping a nested <table>.
        if (document.querySelector('#behaviors-live-stage tbody tr')) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      const tbl = document.querySelector('#behaviors-live-stage > *');
      return {
        bodyRows: tbl ? tbl.querySelectorAll('tbody tr').length : 0,
        headers: tbl ? [...tbl.querySelectorAll('th')].map((t) => t.textContent!.trim()) : [],
      };
    });
    expect(info.bodyRows, 'the table example must have real rows').toBeGreaterThan(2);
    expect(info.headers.length, 'and real headers').toBeGreaterThan(2);
  });
});

test.describe('Behaviors selector — interaction', () => {
  test('arrow keys walk the list and never scroll the page', async ({ page }) => {
    await waitForSelector(page);

    const result = await page.evaluate(async () => {
      const list = document.getElementById('behaviors-search-results')!;
      const scroller = (document.getElementById('siteBody') || document.scrollingElement)!;
      const rows = () => [...list.querySelectorAll('.behaviors-search-results__row')] as HTMLElement[];

      rows()[0].click();
      await new Promise((r) => setTimeout(r, 1200));
      const pageBefore = Math.round(scroller.scrollTop);
      const listBefore = Math.round(list.scrollTop);

      const walked: string[] = [];
      for (let i = 0; i < 10; i++) {
        const cur = list.querySelector('[aria-current="true"]') as HTMLElement;
        cur.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
        await new Promise((r) => setTimeout(r, 250));
        const now = list.querySelector('[aria-current="true"]') as HTMLElement;
        walked.push(now.dataset.label + '·' + (now.dataset.variant || ''));
      }
      const expected = rows().slice(1, 11).map((r) => r.dataset.label + '·' + (r.dataset.variant || ''));

      return {
        walked, expected,
        pageMoved: Math.round(scroller.scrollTop) !== pageBefore,
        listMoved: Math.round(list.scrollTop) !== listBefore,
      };
    });

    expect(result.walked, 'ArrowDown walks the rows in order').toEqual(result.expected);
    // scrollIntoView({block:'nearest'}) scrolls ancestors too -- the list must
    // be scrolled by hand so the page stays put.
    expect(result.pageMoved, 'the page must not scroll').toBe(false);
    expect(result.listMoved, 'the list itself should follow the selection').toBe(true);
  });

  test('a behavior with a doc renders it inline, opened', async ({ page }) => {
    await waitForSelector(page);
    const doc = await page.evaluate(async () => {
      const row = [...document.querySelectorAll('.behaviors-search-results__row')]
        .find((r: any) => r.dataset.browseToken === 'x-ripple') as HTMLElement;
      row.click();
      const deadline = Date.now() + 10000;
      while (Date.now() < deadline) {
        const b = document.getElementById('behaviors-live-doc-body');
        if (b && b.querySelector('h1,h2,table')) break;
        await new Promise((r) => setTimeout(r, 150));
      }
      const panel = document.getElementById('behaviors-live-doc') as HTMLDetailsElement;
      const body = document.getElementById('behaviors-live-doc-body')!;
      return {
        visible: !panel.hidden,
        open: panel.open,
        // markdown was PARSED, not dumped as text
        renderedHtml: !!body.querySelector('h1,h2,table'),
        hasPropertiesTable: !!body.querySelector('table'),
      };
    });

    expect(doc.visible).toBe(true);
    expect(doc.open, 'collapsed reads as "no docs" -- it must open').toBe(true);
    expect(doc.renderedHtml, 'markdown must be parsed to HTML').toBe(true);
    expect(doc.hasPropertiesTable, 'the Properties table is the point of showing docs').toBe(true);
  });

  test('search filters the selector, and clearing restores it', async ({ page }) => {
    await waitForSelector(page);
    const r = await page.evaluate(async () => {
      const input = document.getElementById('behaviors-search') as HTMLInputElement;
      const count = () => document.querySelectorAll('.behaviors-search-results__row').length;
      const before = count();
      input.value = 'ripple';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((res) => setTimeout(res, 500));
      const filtered = count();
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((res) => setTimeout(res, 500));
      return { before, filtered, restored: count() };
    });

    expect(r.filtered).toBeGreaterThan(0);
    expect(r.filtered).toBeLessThan(r.before);
    expect(r.restored).toBe(r.before);
  });
});

test.describe('Behaviors page — the demo sections stay removed', () => {
  test('no <wb-demo> blocks, and curated examples still come from the catalogue', async ({ page }) => {
    await waitForSelector(page);
    const r = await page.evaluate(async () => {
      const row = [...document.querySelectorAll('.behaviors-search-results__row')]
        .find((x: any) => x.dataset.browseToken === 'x-confirm') as HTMLElement;
      row.click();
      const deadline = Date.now() + 8000;
      while (Date.now() < deadline) {
        const c = document.querySelector('#behaviors-live-code code')?.textContent ?? '';
        if (c.includes('confirm-title')) break;
        await new Promise((res) => setTimeout(res, 100));
      }
      return {
        demoBlocks: document.querySelectorAll('wb-demo').length,
        code: document.querySelector('#behaviors-live-code code')?.textContent ?? '',
      };
    });

    expect(r.demoBlocks, 'the 88 demo sections were migrated into the catalogue').toBe(0);
    // If the catalogue were lost, this would silently become a generated stub.
    expect(r.code, 'curated example must survive, not degrade to a stub').toContain('confirm-title');
  });
});
