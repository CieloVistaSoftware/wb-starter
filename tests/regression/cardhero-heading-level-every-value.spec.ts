import { test, expect } from '@playwright/test';

/**
 * x-cardhero headingLevel picks the title's heading tag, for every value (#1124).
 *
 * The schema declares `headingLevel` (enum "1".."6", default "3"). cardhero()
 * read `getAttribute('heading-level')`, a dashed spelling no author writes and
 * the parser never produces -- `headingLevel` in markup arrives as
 * `headinglevel`. So every one of the six values rendered h3, and the six demo
 * rows were identical.
 *
 * Generated from the parameter space, not hand-picked:
 *   value     : absent, 1..6 (the enum), "h1".."h6" (the h-prefix the code
 *               strips), and out-of-range / junk
 *   oracle    : a valid level N renders <hN>; anything else renders the
 *               documented default <h3>
 *
 * The default is asserted too, but it is not the proof: h3 is also what the
 * broken code rendered for everything. Levels 1, 2, 4, 5 and 6 are the rows
 * that can only pass when the attribute is actually read.
 */

type Case = { label: string; attr: string | null; expected: string };

const CASES: Case[] = [
  { label: 'absent', attr: null, expected: 'h3' },
  ...[1, 2, 3, 4, 5, 6].map((n) => ({ label: `"${n}"`, attr: String(n), expected: `h${n}` })),
  ...[1, 2, 3, 4, 5, 6].map((n) => ({ label: `"h${n}"`, attr: `h${n}`, expected: `h${n}` })),
  { label: '"0" (below range)', attr: '0', expected: 'h3' },
  { label: '"7" (above range)', attr: '7', expected: 'h3' },
  { label: '"big" (junk)', attr: 'big', expected: 'h3' },
];

type Row = { label: string; expected: string; tag: string | null };

test.describe('x-cardhero headingLevel renders the declared heading (#1124)', () => {
  let rows: Row[];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });

    rows = await page.evaluate(async (cases) => {
      const host = document.createElement('div');
      host.id = 'heading-level-sweep';
      host.innerHTML = cases
        .map((c, i) => {
          const attr = c.attr === null ? '' : ` headingLevel="${c.attr}"`;
          return `<div id="hl-${i}" x-cardhero title="Hero ${i}"${attr}></div>`;
        })
        .join('');
      document.body.appendChild(host);
      await (window as any).WB.scan(host, { eager: true });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const out = cases.map((c, i) => {
        const title = document.querySelector(`#hl-${i} .x-card__hero-title`);
        return { label: c.label, expected: c.expected, tag: title ? title.tagName.toLowerCase() : null };
      });
      host.remove();
      return out;
    }, CASES);

    await page.close();
  });

  test('every case produced a hero title', () => {
    const missing = rows.filter((r) => r.tag === null).map((r) => r.label);
    expect(missing, 'a hero rendered no .x-card__hero-title, so nothing was measured').toEqual([]);
    expect(rows.length).toBe(CASES.length);
  });

  test('each headingLevel value renders its heading tag', () => {
    const wrong = rows
      .filter((r) => r.tag !== r.expected)
      .map((r) => `headingLevel=${r.label}: expected <${r.expected}>, got <${r.tag}>`);
    expect(wrong, 'headingLevel was not honoured').toEqual([]);
  });

  test('the six levels are six different tags, not one', () => {
    // The #1124 shape exactly: every row identical. Stated directly so a
    // regression reads as the defect it is, not as five unrelated mismatches.
    const tags = new Set(rows.filter((r) => /^"\d"$/.test(r.label) && Number(r.label[1]) >= 1 && Number(r.label[1]) <= 6).map((r) => r.tag));
    expect(tags.size, `levels 1..6 rendered only ${[...tags].join(', ')}`).toBe(6);
  });
});
