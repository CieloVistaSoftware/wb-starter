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
        // Auto-injected behaviors appear as semantic elements...
        semanticLabels: ['button', 'article', 'audio', 'table', 'video'].filter((t) => labels.has(t)),
        // ...AND, since #764, as their attribute form too -- one row per
        // authoring form. See the assertion below.
        attributeFormLabels: ['x-button', 'x-card', 'x-audio', 'x-table'].filter((t) => labels.has(t)),
        formsUsed: [...new Set(rows.map((r) => r.dataset.form))].sort(),
        rowsMissingForm: rows.filter((r) => !r.dataset.form).length,
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
    // #950: this used to demand the x-* forms be ABSENT (#666). #764 superseded
    // that -- John: "add radio buttons for filtering x-behaviors and semantic or
    // both". A behavior with a native host offers two genuinely different things
    // to write (`<progress value="72">` vs `<div x-progress value="72">`), so it
    // gets one row PER AUTHORING FORM; a single row made "Both" and "Semantic"
    // render the same list. So assert what the filter actually needs: both forms
    // present, and every row labelled with which form it is.
    expect(report.attributeFormLabels, 'the attribute authoring form must be listed too (#764)')
      .toEqual(['x-button', 'x-card', 'x-audio', 'x-table']);
    expect(report.formsUsed, 'rows must be tagged semantic vs attribute (#764)')
      .toEqual(['attribute', 'semantic']);
    expect(report.rowsMissingForm, 'every row must declare its authoring form').toBe(0);
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
    // #950: 'x-alert', not 'alert'. alert has no native host in nativeMap, so
    // only the attribute authoring form exists and the row is labelled by the
    // attribute (5 rows, all with a prop). Looking for 'alert' matched nothing
    // and the test died on minRows with Received: 0.
    { label: 'x-alert', kind: 'variant', minRows: 4 },
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
          // #950: the header is NOT a readiness signal for the code panel. The
          // header updates in ~20ms; renderSource() awaits a dynamic import of
          // demo.js, formats, then awaits an eager WB.scan() before writing the
          // source -- measured at ~1000ms behind. Waiting on the header and
          // reading the code immediately read the PREVIOUS row's source, and 47
          // of 51 permutations failed against a page that was working. So wait
          // on the thing actually being asserted: the code panel.
          // #952: the page emits multi-word properties squashed to lowercase
          // (`fullwidth`, `showplaybutton`) rather than the documented kebab
          // (`full-width`, `show-play-button`). Both work -- readAttr() reaches
          // them through a case-insensitive getAttribute -- so that spelling is
          // its own issue, not this test's business. Accept any of the three
          // spellings so this test asserts "the option was applied" and #952
          // stays the single place the spelling is argued.
          const spellings = (prop: string) => [...new Set([
            prop,
            prop.toLowerCase(),
            prop.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(),
          ])].join('|');
          const isApplied = (code: string) => {
            const p = spellings(row.dataset.prop as string);
            return row.dataset.boolean === '1'
              ? (row.dataset.variant === 'false'
                  ? new RegExp(`\\s(?:${p})="false"`).test(code)
                  : new RegExp(`\\s(?:${p})(?![=\\w-])`).test(code))
              : new RegExp(`(?:${p})="${row.dataset.variant}"`).test(code);
          };

          const deadline = Date.now() + 15000;
          let header = '';
          let code = '';
          while (Date.now() < deadline) {
            header = document.getElementById('behaviors-live-token')?.textContent ?? '';
            code = document.querySelector('#behaviors-live-code code')?.textContent ?? '';
            if (header.includes(want as string) && isApplied(code)) break;
            await new Promise((r) => setTimeout(r, 100));
          }
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
            applied: isApplied(code),
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
        // The host element IS <table>; it holds thead/tbody directly rather
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

      // #950: walk far enough to force a scroll instead of assuming 10 steps do.
      // The list is a fixed `max-height: 24rem` (384px), so how many rows fit
      // depends on the row height -- 49.2px in a real browser (7 visible), but a
      // smaller font metric would fit all 10 and the list would correctly NOT
      // scroll, failing a working feature.
      const rowH = rows()[0].getBoundingClientRect().height;
      const steps = Math.ceil(list.clientHeight / rowH) + 3;

      const walked: string[] = [];
      const strayed: number[] = [];
      for (let i = 0; i < steps; i++) {
        const cur = list.querySelector('[aria-current="true"]') as HTMLElement;
        cur.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
        await new Promise((r) => setTimeout(r, 250));
        const now = list.querySelector('[aria-current="true"]') as HTMLElement;
        walked.push(now.dataset.label + '·' + (now.dataset.variant || ''));
        // The real requirement: the selection never leaves the visible list.
        const nowBox = now.getBoundingClientRect();
        const listBox = list.getBoundingClientRect();
        if (nowBox.top < listBox.top - 1 || nowBox.bottom > listBox.bottom + 1) strayed.push(i);
      }
      const expected = rows().slice(1, steps + 1).map((r) => r.dataset.label + '·' + (r.dataset.variant || ''));

      return {
        walked, expected, strayed, steps,
        pageMoved: Math.round(scroller.scrollTop) !== pageBefore,
        listMoved: Math.round(list.scrollTop) !== listBefore,
      };
    });

    expect(result.walked, 'ArrowDown walks the rows in order').toEqual(result.expected);
    // scrollIntoView({block:'nearest'}) scrolls ancestors too -- the list must
    // be scrolled by hand so the page stays put.
    expect(result.pageMoved, 'the page must not scroll').toBe(false);
    // #950: the assertion that matters is that the selection stays visible --
    // `scrollTop changed` is only a proxy, and a false one whenever the walked
    // rows happen to fit inside the list.
    expect(result.strayed, 'the selected row must stay inside the visible list').toEqual([]);
    expect(result.listMoved, 'walking past the visible rows must scroll the list').toBe(true);
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
      // #950: opening it must WORK, even though nothing opens it automatically.
      const summary = panel.querySelector('summary') as HTMLElement | null;
      if (summary) summary.click(); else panel.open = true;
      await new Promise((r) => setTimeout(r, 200));
      return {
        visible: !panel.hidden,
        opensOnClick: panel.open,
        // markdown was PARSED, not dumped as text
        renderedHtml: !!body.querySelector('h1,h2,table'),
        hasPropertiesTable: !!body.querySelector('table'),
      };
    });

    expect(doc.visible).toBe(true);
    // #950: this used to assert `panel.open === true` on arrival ("collapsed
    // reads as no docs"). Nothing in the page opens either panel
    // programmatically -- exclusivePanels([liveApi, liveDoc]) makes API and Docs
    // mutually exclusive click-to-open disclosures, added for John's "When
    // clicking api or docs, this panel should fill to the bottom". Auto-opening
    // Docs on every row click would force-close API each time.
    //
    // Whether Docs SHOULD auto-open is a product call, not a test call, so this
    // asserts only what holds either way: the panel is there, populated, and
    // actually opens when clicked. If the answer comes back "auto-open", add
    // that assertion here rather than inverting this one.
    expect(doc.opensOnClick, 'the docs panel must open when clicked').toBe(true);
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
  test('no <div x-demo> blocks, and curated examples still come from the catalogue', async ({ page }) => {
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
        demoBlocks: document.querySelectorAll('[x-demo]').length,
        code: document.querySelector('#behaviors-live-code code')?.textContent ?? '',
      };
    });

    expect(r.demoBlocks, 'the 88 demo sections were migrated into the catalogue').toBe(0);
    // If the catalogue were lost, this would silently become a generated stub.
    expect(r.code, 'curated example must survive, not degrade to a stub').toContain('confirm-title');
  });
});
