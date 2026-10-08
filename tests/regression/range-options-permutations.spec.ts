/**
 * ═══════════════════════════════════════════════════════════════════════════
 * input[type=range]: every option, in every author state (#1140)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John asked whether this behavior's property names follow our standards.
 * They did not, and the names were not the only problem:
 *
 *   showValue="false"   turned the value display ON. Both booleans were read
 *                       with hasAttribute(), which is true for ANY value
 *                       including the string "false" — and the docs taught
 *                       show-value="true", so an author copying that example
 *                       and flipping it got the opposite of what it said.
 *
 *   showValue           was unreadable. Only the dashed spelling was looked
 *                       up, while the rule is that no attribute name carries
 *                       a dash; only the x- behavior prefix does (#1125).
 *
 * The cases here are GENERATED from range.schema.json rather than chosen: the
 * schema says which properties exist and what type each is, and this file
 * enumerates every author state of each one. Hand-picked cases are how
 * `"false"` survived — nobody picks the case they have not thought of.
 *
 * Boolean author states, all four:
 *
 *   absent      off
 *   bare        on      <input showValue>
 *   "true"      on      <input showValue="true">
 *   "false"     OFF     <input showValue="false">     ← the bug
 */
import { test, expect, Page } from '../fixtures/offline';
import { readFileSync } from 'node:fs';

const SCHEMA_PATH = 'src/wb-models/range.schema.json';

type BoolState = 'absent' | 'bare' | 'true' | 'false';
const BOOL_STATES: BoolState[] = ['absent', 'bare', 'true', 'false'];

/** What the behavior must conclude from each author state. */
const RESOLVES: Record<BoolState, boolean> = {
  absent: false,
  bare: true,
  true: true,
  false: false,
};

type Case = {
  id: string;
  markup: string;
  showValue: boolean;
  showLabels: boolean;
  prefix: string;
  suffix: string;
};

function attr(name: string, state: BoolState): string {
  if (state === 'absent') return '';
  if (state === 'bare') return ` ${name}`;
  return ` ${name}="${state}"`;
}

/**
 * Every combination of the schema's four properties.
 *
 * Read from the schema so that a property added there without a case here is
 * a failure, not a silent gap.
 */
function buildCases(): Case[] {
  // The generator below is written for the schema's current shape. If the
  // schema grows a property, the first test fails and says so rather than
  // this file quietly testing a subset.
  const cases: Case[] = [];
  let n = 0;
  for (const svState of BOOL_STATES) {
    for (const slState of BOOL_STATES) {
      for (const prefix of ['', '$']) {
        for (const suffix of ['', '%']) {
          const id = `case${n++}`;
          const markup = '<input type="range" min="0" max="100" value="50"'
            + ` id="${id}"`
            + attr('showValue', svState)
            + attr('showLabels', slState)
            + (prefix ? ` valuePrefix="${prefix}"` : '')
            + (suffix ? ` valueSuffix="${suffix}"` : '')
            + '>';
          cases.push({
            id,
            markup,
            showValue: RESOLVES[svState],
            showLabels: RESOLVES[slState],
            prefix,
            suffix,
          });
        }
      }
    }
  }
  return cases;
}

const cases = buildCases();

/** What the page actually built, read back per case. */
type Observed = { id: string; hasValue: boolean; hasLabels: boolean; valueText: string };

async function render(page: Page, markup: string[]): Promise<Observed[]> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
  await page.evaluate((html) => {
    const host = document.createElement('div');
    host.id = 'range-area';
    host.innerHTML = html;
    document.body.appendChild(host);
  }, markup.join('\n'));
  await page.evaluate(async () => {
    const el = document.getElementById('range-area');
    if ((window as any).WB?.scan) await (window as any).WB.scan(el, { eager: true });
    // Built once its work has called back (#1516: no fixed sleep).
    await (window as any).WB?.settled?.({ timeout: 10000 });
  });

  return page.evaluate(() => {
    const out: Observed[] = [];
    for (const input of Array.from(document.querySelectorAll('#range-area input[type="range"]'))) {
      const wrapper = input.closest('.x-range__wrapper');
      const valueEl = wrapper?.querySelector('.x-range__value') || null;
      out.push({
        id: input.id,
        hasValue: !!valueEl,
        hasLabels: !!wrapper?.querySelector('.x-range__labels'),
        valueText: valueEl ? (valueEl.textContent || '') : '',
      });
    }
    return out;
  });
}

test('#1140 the schema declares exactly the four options this file permutes', () => {
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
  const names = Object.keys(schema.properties || {}).sort();
  expect(
    names,
    'the permutation below is generated for these four; a new property needs a case',
  ).toEqual(['showLabels', 'showValue', 'valuePrefix', 'valueSuffix']);
});

test('#1140 no schema property name carries a dash', () => {
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
  const dashed = Object.keys(schema.properties || {}).filter((k) => k.includes('-'));
  expect(
    dashed,
    'only the x- behavior prefix may carry a dash (#1125); these are attribute names',
  ).toEqual([]);
});

test('#1140 every combination of the four options behaves as the markup says', async ({ page }) => {
  test.setTimeout(60_000);
  expect(cases.length, 'the generator produced no cases').toBe(64);

  const observed = await render(page, cases.map((c) => c.markup));
  const byId = new Map(observed.map((o) => [o.id, o]));
  expect(byId.size, 'not every case reached the page').toBe(cases.length);

  const wrong: string[] = [];
  for (const c of cases) {
    const o = byId.get(c.id)!;

    if (o.hasValue !== c.showValue) {
      wrong.push(`${c.id}: value display ${o.hasValue ? 'shown' : 'absent'}, expected ${c.showValue ? 'shown' : 'absent'}\n    ${c.markup}`);
    }
    if (o.hasLabels !== c.showLabels) {
      wrong.push(`${c.id}: bound labels ${o.hasLabels ? 'shown' : 'absent'}, expected ${c.showLabels ? 'shown' : 'absent'}\n    ${c.markup}`);
    }
    if (c.showValue) {
      const want = `${c.prefix}50${c.suffix}`;
      if (o.valueText !== want) {
        wrong.push(`${c.id}: value read "${o.valueText}", expected "${want}"\n    ${c.markup}`);
      }
    }
  }

  expect(wrong, `${wrong.length} of ${cases.length} combinations disagree with their markup:\n  ${wrong.join('\n  ')}`).toEqual([]);
});

test('#1140 the dashed spelling still works, so existing markup keeps running', async ({ page }) => {
  // The names changed; the old ones must not break. readAttr/readFlag read
  // the kebab form as a fallback precisely so this conversion costs nobody a
  // broken page.
  const observed = await render(page, [
    '<input type="range" min="0" max="100" value="50" id="old1" show-value value-suffix="%">',
    '<input type="range" min="0" max="100" value="50" id="old2" show-labels>',
  ]);
  const byId = new Map(observed.map((o) => [o.id, o]));

  expect(byId.get('old1')!.hasValue, 'show-value no longer shows the value').toBe(true);
  expect(byId.get('old1')!.valueText, 'value-suffix no longer applies').toBe('50%');
  expect(byId.get('old2')!.hasLabels, 'show-labels no longer shows the labels').toBe(true);
});
