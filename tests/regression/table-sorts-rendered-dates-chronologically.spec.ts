/**
 * A SORTABLE DATE COLUMN MUST SORT BY DATE, NOT BY MONTH NAME
 * ==========================================================
 * #1011, second pass. The first fix taught the comparator ISO dates
 * (`2026-09-03`) and dotted versions (`4.0.10`), which are the formats the DATA
 * is in. Pages do not render those. `pages/issues.html:329` prints
 *
 *   toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
 *
 * — "Sep 5, 2026" — straight into a `<table sortable>`. That matches none of the
 * typed rules, so it fell through to `localeCompare`, which orders by the month
 * NAME: April before March, January after February.
 *
 * Measured against the shipped comparator before this fix:
 *
 *   compare("Apr 1, 2025", "Mar 1, 2020") = -1   chronologically +1  (5 years wrong)
 *   compare("Jan 2, 2026", "Feb 1, 2026") = +1   chronologically -1
 *
 * Why it survived a look: plenty of pairs come out right by accident.
 * "Sep 5, 2026" vs "Dec 1, 2025" happens to agree, so glancing at the Updated
 * column shows a plausible order. The dates chosen below are ones where
 * alphabetical and chronological DISAGREE — anything else cannot tell the two
 * apart, which is exactly how this shipped.
 */

import { test, expect, type Page } from '@playwright/test';

/** Alphabetical by month name gives a DIFFERENT order to chronological here. */
const ROWS = [
  { label: 'oldest', shown: 'Mar 1, 2020' },
  { label: 'middle', shown: 'Apr 1, 2025' },
  { label: 'newer', shown: 'Jan 2, 2026' },
  { label: 'newest', shown: 'Feb 1, 2026' },
];

async function buildTable(page: Page): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15_000 });

  // Deliberately NOT in date order in the DOM, so a sort that does nothing at
  // all cannot pass by accident.
  const html = `
    <table id="date-sort" x-behavior="table" sortable>
      <thead><tr><th>Item</th><th>Updated</th></tr></thead>
      <tbody>
        <tr><td>middle</td><td>Apr 1, 2025</td></tr>
        <tr><td>newest</td><td>Feb 1, 2026</td></tr>
        <tr><td>oldest</td><td>Mar 1, 2020</td></tr>
        <tr><td>newer</td><td>Jan 2, 2026</td></tr>
      </tbody>
    </table>`;

  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'date-sort-area';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => {
    if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true });
  });
  await page.waitForTimeout(400);
}

test('sorting a column of rendered dates orders them chronologically', async ({ page }) => {
  await buildTable(page);

  const header = page.locator('#date-sort thead th').nth(1);
  await header.click();
  await page.waitForTimeout(300);

  const order = await page.$$eval('#date-sort tbody tr', (rows) =>
    rows.map((r) => r.children[1]?.textContent?.trim() || ''),
  );

  const chronological = [...ROWS].sort((a, b) => Date.parse(a.shown) - Date.parse(b.shown)).map((r) => r.shown);
  const alphabetical = [...ROWS].sort((a, b) => a.shown.localeCompare(b.shown)).map((r) => r.shown);

  // Guard the test itself: if these two agreed, passing would prove nothing.
  expect(
    chronological,
    'the chosen dates sort the same way alphabetically and chronologically, so this test cannot distinguish them',
  ).not.toEqual(alphabetical);

  const ascending = order.join('|') === chronological.join('|');
  const descending = order.join('|') === [...chronological].reverse().join('|');

  expect(
    ascending || descending,
    `The Updated column sorted to:\n  ${order.join('\n  ')}\n\n` +
    `Chronological order is:\n  ${chronological.join('\n  ')}\n\n` +
    `Alphabetical-by-month-name order is:\n  ${alphabetical.join('\n  ')}\n\n` +
    'If the result matches the alphabetical list, the comparator is treating rendered dates as plain text.',
  ).toBe(true);
});

test('a column of prose is still sorted as text, not guessed at as dates', async ({ page }) => {
  // The date rule must not be so eager that it reorders a Title column.
  // Date.parse accepts "March of the Penguins" happily enough to matter.
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15_000 });

  await page.evaluate(() => {
    const c = document.createElement('div');
    c.innerHTML = `
      <table id="prose-sort" x-behavior="table" sortable>
        <thead><tr><th>Title</th></tr></thead>
        <tbody>
          <tr><td>March of the Penguins</td></tr>
          <tr><td>April in Paris</td></tr>
          <tr><td>Before Sunrise</td></tr>
        </tbody>
      </table>`;
    document.body.appendChild(c);
  });
  await page.evaluate(async () => {
    if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true });
  });
  await page.waitForTimeout(400);

  await page.locator('#prose-sort thead th').first().click();
  await page.waitForTimeout(300);

  const order = await page.$$eval('#prose-sort tbody tr', (rows) =>
    rows.map((r) => r.children[0]?.textContent?.trim() || ''),
  );

  const alphabetical = ['April in Paris', 'Before Sunrise', 'March of the Penguins'];
  expect(
    order.join('|') === alphabetical.join('|') || order.join('|') === [...alphabetical].reverse().join('|'),
    `A Title column sorted to:\n  ${order.join('\n  ')}\nExpected plain alphabetical order.`,
  ).toBe(true);
});
