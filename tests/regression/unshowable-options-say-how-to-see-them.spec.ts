/**
 * AN OPTION THE BOX CANNOT SHOW SAYS HOW TO SEE IT (#750)
 * ======================================================
 * John: "the demo should prove it" and "say what it does, in words, where the
 * demo is." Most options do, in the example box. A few cannot:
 *
 *   - `lazy` / cardimage `loading`: the box is always in view, so the image
 *     loads at once and looks exactly like an eager one.
 *   - figure `zoom`: nothing happens until a click.
 *
 * Their schema property carries `demoNote`, and the Behaviors page shows it
 * under the example, after the description. This spec checks both halves:
 * the schemas still carry the notes, and selecting each row shows its note.
 */
import { test, expect, Page } from '../fixtures/offline';
import fs from 'fs';
import path from 'path';

const MODELS = path.join(process.cwd(), 'src/wb-models');

/** Every schema property that carries a demoNote, read from the schemas themselves. */
function notedOptions(): Array<{ name: string; prop: string; note: string }> {
  const out: Array<{ name: string; prop: string; note: string }> = [];
  for (const f of fs.readdirSync(MODELS).filter((f) => f.endsWith('.schema.json'))) {
    const schema = JSON.parse(fs.readFileSync(path.join(MODELS, f), 'utf8'));
    for (const [prop, def] of Object.entries<any>(schema.properties || {})) {
      if (typeof def?.demoNote === 'string') out.push({ name: f.replace('.schema.json', ''), prop, note: def.demoNote });
    }
  }
  return out;
}

const NOTED = notedOptions();

test('the options the box cannot show carry a demoNote', () => {
  const have = new Set(NOTED.map((o) => `${o.name}.${o.prop}`));
  for (const key of ['img.lazy', 'cardimage.loading', 'figure.zoom']) {
    expect(have.has(key), `${key} needs a demoNote saying how to see its effect`).toBe(true);
  }
  for (const o of NOTED) expect(o.note.trim().length, `${o.name}.${o.prop}: empty demoNote`).toBeGreaterThan(20);
});

/** Click the row for `prop` on the behavior `name` (row labels are the tag or the behavior). */
async function showOption(page: Page, name: string, prop: string) {
  const rows = page.locator(`.behaviors-search-results__row[data-prop="${prop}"]`);
  await expect(rows.first()).toBeAttached({ timeout: 30_000 });
  const index = await rows.evaluateAll((els, n) => els.findIndex((el) => {
    const e = el as HTMLElement;
    const label = (e.dataset.label || '').toLowerCase();
    const token = (e.dataset.browseToken || '').toLowerCase();
    const want = n.toLowerCase();
    return label === want || token === `x-${want}` || token === want;
  }), name);
  expect(index, `no ${name} · ${prop} row on the Behaviors page`).toBeGreaterThanOrEqual(0);
  const row = rows.nth(index);
  // #995 folds options into <details> groups, sometimes nested: open every
  // group around the row, or the click waits on a row it can never see.
  await row.evaluate((el) => {
    for (let d = el.closest('details'); d; d = d.parentElement?.closest('details') ?? null) d.open = true;
  });
  await row.click();
  await expect(page.locator('#behaviors-live')).not.toHaveAttribute('aria-busy', 'true');
}

test.describe('the Behaviors page shows each demoNote under its example', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/?page=behaviors'); });

  for (const o of NOTED) {
    test(`${o.name} · ${o.prop}`, async ({ page }) => {
      await showOption(page, o.name, o.prop);
      await expect(page.locator('#behaviors-live-note')).toContainText(o.note);
    });
  }
});
