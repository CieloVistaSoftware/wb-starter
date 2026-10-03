/**
 * EVERY BEHAVIOR OFFERS AT LEAST FIVE VARIED EXAMPLES (#997)
 * ==========================================================
 * John: "all items on left must have minimum of 5 examples, either varying
 * colors etc."
 *
 * The list on ?page=behaviors builds each behavior's rows from data:
 *   - one per enum value and one per boolean in the behavior's schema;
 *   - one per sample value a free-form property declares in JSON Schema's
 *     `examples` keyword (x-stack's gap / bg / pad, x-glow's color, ...);
 *   - one per authored example in data/behavior-examples.json `examples`
 *     (the click animations read no attribute at all, so they vary by host
 *     and colour instead).
 * Measured before the fix: 132 of 185 entries offered fewer than five rows,
 * 100 of them a single row.
 *
 * Two things are checked for every entry, in both authoring forms:
 *   1. it lists at least five rows;
 *   2. those rows render at least five DIFFERENT pieces of markup -- five
 *      labels over one example would satisfy (1) and still show the reader
 *      the same thing five times.
 * That the different markup also LOOKS different on screen is
 * variants-render-differently.spec.ts's job: it fingerprints the computed
 * style of every row, these new kinds included.
 */

import { test, expect } from '../fixtures/offline';

const LIST = '#behaviors-search-results';
const ROW = '.behaviors-search-results__row';
const MINIMUM = 5;

test.describe('every behavior offers at least five varied examples (#997)', () => {
  test('each entry in the list has at least five rows, rendering five different examples', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
    // The list renders from the schema index and is re-rendered once the
    // example catalogue (which carries the authored examples) has arrived.
    await expect
      .poll(() => page.locator(`${LIST} ${ROW}`).count(), { timeout: 30_000 })
      .toBeGreaterThan(900);
    await page.waitForFunction(() => typeof (window as any).__wbExampleSource === 'function');

    const entries = await page.evaluate(({ LIST, ROW }) => {
      const source = (window as any).__wbExampleSource;
      const list = document.querySelector(LIST)!;
      return Array.from(list.children).map((li) => {
        const rows = Array.from(li.querySelectorAll(ROW)) as HTMLElement[];
        const first = rows[0];
        if (!first) return null;
        const sources = rows.map((r) => String(source(
          r.dataset.browseToken, r.dataset.form || 'attribute', r.dataset.prop || '',
          r.dataset.variant || '', r.dataset.boolean === '1', r.dataset.example, r.dataset.label || '',
        ) || ''));
        return {
          name: `${first.dataset.label} (${first.dataset.form || 'attribute'})`,
          rows: rows.length,
          distinct: new Set(sources.map((s) => s.replace(/\s+/g, ' ').trim())).size,
        };
      }).filter(Boolean) as { name: string; rows: number; distinct: number }[];
    }, { LIST, ROW });

    expect(entries.length, 'the list should hold every behavior').toBeGreaterThan(150);

    const tooFew = entries.filter((e) => e.rows < MINIMUM).map((e) => `${e.name}: ${e.rows} row(s)`);
    expect(
      tooFew,
      `${tooFew.length} behavior(s) offer fewer than ${MINIMUM} examples. Give the schema property ` +
      `sample values (JSON Schema "examples") or add authored ones to data/behavior-examples.json:\n  ` +
      tooFew.join('\n  '),
    ).toEqual([]);

    const samey = entries.filter((e) => e.distinct < MINIMUM).map((e) => `${e.name}: ${e.distinct} distinct of ${e.rows}`);
    expect(
      samey,
      `${samey.length} behavior(s) list ${MINIMUM}+ rows that render fewer than ${MINIMUM} different examples:\n  ` +
      samey.join('\n  '),
    ).toEqual([]);
  });

  test('an authored example renders its own markup when its row is selected', async ({ page }) => {
    await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
    const row = page.locator(`${ROW}[data-browse-token="x-bounce"][data-example="1"]`);
    await expect(row).toHaveCount(1, { timeout: 30_000 });
    await row.evaluate((el) => (el as HTMLElement).click());
    const example = page.locator('#behaviors-live-example');
    // The second authored x-bounce example is a large warning button.
    await expect(example.locator('button[x-bounce][variant="warning"][size="lg"]')).toHaveCount(1, { timeout: 15_000 });
    await expect(page.locator('#behaviors-live-token')).toContainText('large warning button');
  });
});
