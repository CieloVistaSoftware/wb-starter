/**
 * ═══════════════════════════════════════════════════════════════════════════
 * <table>: every boolean option, in every author state (#1344)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John pointed at docs/behaviors/table.md. It documented an attribute that
 * breaks the naming rule, and the behavior underneath had six booleans that
 * did the opposite of what the markup said:
 *
 *   striped="false"   turned striping ON. Six options (striped, bordered,
 *                     compact, copyable, selectable, searchable) were read
 *                     with a bare hasAttribute(), which is true for ANY value
 *                     including the string "false" — the #747 trap. The same
 *                     file checked `!== 'false'` correctly for the other
 *                     three, so there was no rule being followed, only
 *                     whichever line was written last.
 *
 *   page-size         was the name the docs taught, while the schema has
 *                     always declared `pageSize`. No attribute name carries a
 *                     dash; only the x- behavior prefix does (#1125).
 *
 * The cases here are GENERATED from table.schema.json rather than chosen: the
 * schema says which properties exist, which are booleans and what each one
 * defaults to, and this file enumerates every author state of each one.
 * Hand-picked cases are exactly how six of these survived — nobody picks the
 * case they have not thought of.
 *
 * Boolean author states, all four:
 *
 *   absent      the schema's own `default`
 *   bare        on       <table striped>
 *   "true"      on       <table striped="true">
 *   "false"     OFF      <table striped="false">     ← the bug
 *
 * A property added to the schema without an observable to check it fails the
 * first two tests by name, rather than this file quietly testing a subset.
 */
import { test, expect, Page } from '../fixtures/offline';
import { readFileSync } from 'node:fs';

const SCHEMA_PATH = 'src/wb-models/table.schema.json';

type SchemaProp = { type?: string; default?: unknown };
type Schema = { properties?: Record<string, SchemaProp> };

const schema: Schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
const props: Record<string, SchemaProp> = schema.properties || {};

/** Exactly the names table.schema.json declares today. */
const DECLARED = [
  'bordered',
  'columns',
  'compact',
  'copyable',
  'data',
  'filterable',
  'headers',
  'hoverable',
  'pageSize',
  'paginated',
  'rows',
  'searchable',
  'selectable',
  'sortable',
  'striped',
];

type BoolState = 'absent' | 'bare' | 'true' | 'false';
const BOOL_STATES: BoolState[] = ['absent', 'bare', 'true', 'false'];

/**
 * What each boolean switches on, as something a reader could see on the page.
 *
 * Keyed by the schema's property name. `filterable` and `searchable` share one
 * observable because the schema declares searchable as `aliasOf: filterable` —
 * two names for the one filter input.
 */
const OBSERVABLE = {
  striped: 'striped',
  bordered: 'bordered',
  compact: 'compact',
  hoverable: 'hover',
  copyable: 'copyable',
  sortable: 'sortableHeader',
  selectable: 'selectableRow',
  searchable: 'searchBox',
  filterable: 'searchBox',
  paginated: 'pager',
} as const;

type ObservableKey = (typeof OBSERVABLE)[keyof typeof OBSERVABLE];

/** Every boolean the schema declares, in declaration order. */
const booleanProps = Object.keys(props).filter((k) => props[k]?.type === 'boolean');

type Case = {
  id: string;
  prop: string;
  state: BoolState;
  observable: ObservableKey;
  expected: boolean;
  markup: string;
};

function attr(name: string, state: BoolState): string {
  if (state === 'absent') return '';
  if (state === 'bare') return ` ${name}`;
  return ` ${name}="${state}"`;
}

/**
 * One case per (boolean property × author state), generated from the schema.
 *
 * Only the property under test is written on its own table, so nothing else
 * can account for what is observed. The `absent` row expects the schema's
 * declared `default` — so the schema is the source of truth for the defaults
 * too, and sortable/hoverable (default true) are not special-cased here.
 */
function buildCases(): Case[] {
  const cases: Case[] = [];
  for (const prop of booleanProps) {
    const observable = OBSERVABLE[prop as keyof typeof OBSERVABLE];
    for (const state of BOOL_STATES) {
      const id = `case-${prop}-${state}`;
      const expected = state === 'absent' ? props[prop]?.default === true : state !== 'false';
      cases.push({
        id,
        prop,
        state,
        observable,
        expected,
        markup:
          `<div class="case" id="${id}">` +
          `<table${attr(prop, state)} headers="Name,Size" ` +
          `rows='[["beta","2"],["alpha","10"],["gamma","1"]]'></table>` +
          `</div>`,
      });
    }
  }
  return cases;
}

const cases = buildCases();

type Observed = Record<ObservableKey, boolean> & { id: string; rows: number };

/**
 * Render markup into the harness and read back what the behavior built.
 *
 * Read in the page rather than with locators: 40 cases × 9 observables is 360
 * round trips through the driver, and a single evaluate is one.
 */
async function render(page: Page, markup: string[]): Promise<Observed[]> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
  await page.evaluate((html: string) => {
    const host = document.createElement('div');
    host.id = 'table-area';
    host.innerHTML = html;
    document.body.appendChild(host);
  }, markup.join('\n'));
  await page.evaluate(async () => {
    const el = document.getElementById('table-area');
    if ((window as any).WB?.scan) await (window as any).WB.scan(el, { eager: true });
  });

  // Wait on the OUTCOME -- every case's table carrying the behavior's base
  // class -- not on a guessed sleep.
  await expect
    .poll(
      () =>
        page.locator('#table-area .case > table.x-table').count(),
      { timeout: 20000, message: 'table() never attached to the generated cases' },
    )
    .toBe(markup.length);

  return page.evaluate(() => {
    const out: any[] = [];
    for (const host of Array.from(document.querySelectorAll('#table-area .case'))) {
      const t = host.querySelector('table');
      out.push({
        id: host.id,
        striped: !!t?.classList.contains('x-table--striped'),
        bordered: !!t?.classList.contains('x-table--bordered'),
        compact: !!t?.classList.contains('x-table--compact'),
        hover: !!t?.classList.contains('x-table--hover'),
        copyable: !!t?.classList.contains('x-table--copyable'),
        sortableHeader: !!host.querySelector('th.x-table__sortable'),
        selectableRow: !!host.querySelector('tbody tr.x-table__selectable'),
        searchBox: !!host.querySelector('input.x-table__search'),
        pager: !!host.querySelector('nav.x-table__pager'),
        rows: host.querySelectorAll('tbody tr').length,
      });
    }
    return out;
  });
}

test('#1344 the schema declares exactly the properties this file permutes', () => {
  const names = Object.keys(props).sort();
  expect(
    names,
    'a property added to table.schema.json needs a case here; the permutation '
      + 'below is generated for exactly this list',
  ).toEqual([...DECLARED].sort());

  expect(booleanProps.length, 'ten of the declared properties are booleans').toBe(10);

  const unobserved = booleanProps.filter((p) => !(p in OBSERVABLE));
  expect(
    unobserved,
    'every boolean needs something observable to check it by, or its cases prove nothing',
  ).toEqual([]);

  expect(
    cases.length,
    'ten booleans x four author states; a schema change must move this number',
  ).toBe(40);
});

test('#1344 no schema property name carries a dash', () => {
  const dashed = Object.keys(props).filter((k) => k.includes('-'));
  expect(
    dashed,
    'only the x- behavior prefix may carry a dash (#1125); these are attribute names',
  ).toEqual([]);
});

test('#1344 the documented attribute table matches the schema', () => {
  const doc = readFileSync('docs/behaviors/table.md', 'utf8');

  // Every declared property is documented under the name the schema uses.
  const missing = Object.keys(props).filter((p) => !doc.includes('| `' + p + '` |'));
  expect(
    missing,
    'docs/behaviors/table.md must name each attribute as table.schema.json declares it',
  ).toEqual([]);

  // And none under a dashed one. `page-size` is the name the doc taught while
  // the schema said pageSize -- the whole of #1344's first finding.
  const dashedRows = Object.keys(props)
    .map((p) => p.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()))
    .filter((kebab) => kebab.includes('-') && doc.includes('| `' + kebab + '` |'));
  expect(
    dashedRows,
    'the doc is what people copy from; a dashed attribute name there teaches the forbidden spelling',
  ).toEqual([]);
});

test('#1344 every boolean option behaves as its markup says, in all four states', async ({ page }) => {
  test.setTimeout(90_000);

  const observed = await render(page, cases.map((c) => c.markup));
  const byId = new Map(observed.map((o) => [o.id, o]));
  expect(byId.size, 'not every generated case reached the page').toBe(cases.length);

  const wrong: string[] = [];
  for (const c of cases) {
    const o = byId.get(c.id)!;
    const actual = o[c.observable];
    if (actual !== c.expected) {
      wrong.push(
        `${c.prop} ${c.state}: ${c.observable} ${actual ? 'on' : 'off'}, `
          + `expected ${c.expected ? 'on' : 'off'}\n    ${c.markup}`,
      );
    }
    if (o.rows !== 3) {
      wrong.push(`${c.id}: built ${o.rows} rows, expected 3\n    ${c.markup}`);
    }
  }

  expect(
    wrong,
    `${wrong.length} of ${cases.length} cases disagree with their markup:\n  ${wrong.join('\n  ')}`,
  ).toEqual([]);
});

test('#1344 pageSize is read, and the dashed page-size still is', async ({ page }) => {
  const observed = await render(page, [
    `<div class="case" id="camel"><table paginated pageSize="2" headers="Name,Size" `
      + `rows='[["a","1"],["b","2"],["c","3"],["d","4"],["e","5"]]'></table></div>`,
    `<div class="case" id="kebab"><table paginated page-size="2" headers="Name,Size" `
      + `rows='[["a","1"],["b","2"],["c","3"],["d","4"],["e","5"]]'></table></div>`,
    `<div class="case" id="default"><table paginated headers="Name,Size" `
      + `rows='[["a","1"],["b","2"],["c","3"],["d","4"],["e","5"]]'></table></div>`,
  ]);
  expect(observed.length, 'the pageSize cases did not render').toBe(3);

  const pages = await page.evaluate(() =>
    ['camel', 'kebab', 'default'].map((id) => ({
      id,
      status: document.querySelector('#' + id + ' .x-table__pager-status')?.textContent || '',
      visible: Array.from(
        document.querySelectorAll('#' + id + ' tbody tr'),
      ).filter((tr) => !(tr as HTMLElement).hidden).length,
    })),
  );
  const byId = new Map(pages.map((p) => [p.id, p]));

  expect(byId.get('camel')!.visible, 'pageSize="2" did not limit the page to 2 rows').toBe(2);
  expect(byId.get('camel')!.status, 'pageSize="2" over 5 rows is 3 pages').toContain('Page 1 of 3');

  // Back-compat is the whole reason readNumber keeps the kebab lookup: the
  // docs taught page-size, so pages already written use it.
  expect(byId.get('kebab')!.visible, 'page-size="2" stopped working').toBe(2);

  // Absent falls back to the schema's default of 10, which is more than the 5
  // rows here, so one page holds them all.
  expect(byId.get('default')!.visible, 'the default pageSize of 10 should show all 5 rows').toBe(5);
});

test('#1344 a cell sorts by sortValue, and sort-value still works', async ({ page }) => {
  // The display text orders alpha < beta < gamma; the sort keys order it
  // exactly backwards, so a pass cannot be luck.
  await render(page, [
    `<div class="case" id="camel"><table headers="Name" `
      + `rows='[["alpha"],["beta"],["gamma"]]'></table></div>`,
  ]);
  const order = async (id: string) =>
    page.$$eval('#' + id + ' tbody tr td', (tds) => tds.map((td) => td.textContent?.trim() || ''));

  await page.evaluate(() => {
    const keys: Record<string, string> = { alpha: '3', beta: '2', gamma: '1' };
    for (const td of Array.from(document.querySelectorAll('#camel tbody td'))) {
      td.setAttribute('sortValue', keys[(td.textContent || '').trim()]);
    }
  });
  await page.click('#camel th');
  expect(await order('camel'), 'sortValue was ignored; the column sorted by its display text').toEqual([
    'gamma', 'beta', 'alpha',
  ]);

  // The older dashed spelling, on a fresh table.
  await render(page, [
    `<div class="case" id="dashed"><table headers="Name" `
      + `rows='[["alpha"],["beta"],["gamma"]]'></table></div>`,
  ]);
  await page.evaluate(() => {
    const keys: Record<string, string> = { alpha: '3', beta: '2', gamma: '1' };
    for (const td of Array.from(document.querySelectorAll('#dashed tbody td'))) {
      td.setAttribute('sort-value', keys[(td.textContent || '').trim()]);
    }
  });
  await page.click('#dashed th');
  expect(await order('dashed'), 'sort-value stopped working, so existing cells lost their sort key').toEqual([
    'gamma', 'beta', 'alpha',
  ]);
});
