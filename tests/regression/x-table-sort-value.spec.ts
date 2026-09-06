/**
 * A COLUMN CAN SORT BY SOMETHING OTHER THAN WHAT IT SHOWS
 * ======================================================
 * #1036. `semantics/table.js` sorted on `td.textContent` alone, so the value a
 * reader SEES was the only value a column could sort by.
 *
 * Found building the issues table: the Priority column renders `—` for an
 * unrated issue, `compareCells()` treated that as ordinary text, and ascending
 * order put every unrated row ABOVE priority 1 — the least urgent first, in the
 * column whose entire purpose is urgency.
 *
 * The comparator already had the right instinct one line earlier:
 *
 *   // Empty values sort last in both directions -- a blank is not "smallest",
 *   // it is missing, and burying it under real data is what a reader expects.
 *
 * `—` is exactly that case and could not reach the rule, because it is not empty.
 *
 * The fix reads `td.getAttribute('sort-value') ?? td.textContent`. These tests
 * hold both halves: the declared key is honoured, AND a table with no declared
 * keys sorts exactly as it always did — the fallback is what makes this safe for
 * the ~40 other tables in the repo that know nothing about it.
 *
 * LAW 11: the key is a PLAIN attribute, `sort-value`, read with getAttribute().
 * The first version of this used `data-sort-value` and `cell.dataset.sortValue`
 * — a `data-` attribute on a behavior element, read through `.dataset`, which
 * the law forbids on both counts.
 *
 * MOUNTING: `/tests/fixtures/blank.html` cannot be used here. Its own comment
 * says it deliberately ships no WB bootstrap, so `waitForFunction(() => WB)`
 * could never resolve and all three tests timed out at 20s — this spec had
 * never passed. Mount on the real site root, which boots WB, then replace the
 * body, the pattern no-inert-behaviors.spec.ts already uses.
 */
import { test, expect } from '@playwright/test';

/** A table whose display text and sort order deliberately disagree. */
const FIXTURE = `
  <table id="t" sortable>
    <thead><tr><th>Priority</th><th>Name</th></tr></thead>
    <tbody>
      <tr><td sort-value="9">—</td><td>unrated</td></tr>
      <tr><td sort-value="2">two</td><td>second</td></tr>
      <tr><td sort-value="1">one</td><td>first</td></tr>
    </tbody>
  </table>`;

/** The same table with no declared keys — the pre-#1036 contract. */
const PLAIN = `
  <table id="t" sortable>
    <thead><tr><th>N</th></tr></thead>
    <tbody>
      <tr><td>10</td></tr>
      <tr><td>2</td></tr>
      <tr><td>33</td></tr>
    </tbody>
  </table>`;

async function mount(page, html) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!(window as any).WB, undefined, { timeout: 20_000 });
  await page.evaluate((markup) => { document.body.innerHTML = markup; }, html);
  await page.evaluate(async () => { await (window as any).WB.scan(document.body); });
  await page.waitForFunction(
    () => document.getElementById('t')?.classList.contains('x-table'),
    undefined,
    { timeout: 20_000 },
  );
}

const column = (page, index: number) =>
  page.$$eval(`#t tbody tr`, (rows, i) =>
    rows.map((r) => (r.children[i as number] as HTMLElement).textContent!.trim()), index);

test.describe('x-table honours sort-value (#1036)', () => {
  test('sorts by the declared key, not the displayed text', async ({ page }) => {
    await mount(page, FIXTURE);

    await page.click('#t thead th:nth-child(1)');          // ascending
    expect(
      await column(page, 0),
      'ascending must order 1, 2 then the unrated 9 — sorting the display text '
      + 'puts "—" first, which is the #1036 defect',
    ).toEqual(['one', 'two', '—']);

    await page.click('#t thead th:nth-child(1)');          // descending
    expect(await column(page, 0)).toEqual(['—', 'two', 'one']);
  });

  test('the rows themselves move, not just the first column', async ({ page }) => {
    await mount(page, FIXTURE);
    await page.click('#t thead th:nth-child(1)');
    expect(
      await column(page, 1),
      'the whole row must travel with its key — a sort that reorders one cell '
      + 'and leaves the rest is worse than no sort',
    ).toEqual(['first', 'second', 'unrated']);
  });

  test('a table with no declared keys sorts exactly as before', async ({ page }) => {
    await mount(page, PLAIN);
    await page.click('#t thead th:nth-child(1)');
    expect(
      await column(page, 0),
      'numeric text must still sort numerically — the fallback is what keeps '
      + 'every existing table unaffected by this change',
    ).toEqual(['2', '10', '33']);
  });
});
