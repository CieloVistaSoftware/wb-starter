import { test, expect } from '@playwright/test';

/**
 * EVERY hero in the playground lays out properly. All 120 of them.
 *
 * John: "ok i've had enough test every herocard in playground for proper
 * layout, we should have never see the narrow ones."
 *
 * The narrow ones came from one line in hero.css. `.x-card__hero-content` is a
 * COLUMN flex container, and it set `align-items: center` (and flex-start /
 * flex-end for xalign). In a column flex the cross axis is horizontal, so
 * align-items makes every child shrink to its own fit-content width instead of
 * filling the column. Measured over these same 120 heroes: the title box came
 * out at 43-56% of the hero width at EVERY variant and EVERY xalign. Once a
 * heading is that narrow the card's `overflow-wrap: break-word` starts
 * splitting words mid-character — "Compose, don't configure" rendered as
 * "Com / pose / don' / t / confi / gure".
 *
 * The playground's 120-hero example is the right fixture precisely because it
 * is a permutation sweep: 5 variants x 3 alignments x 4 heights x backgrounds,
 * each offset by a different multiple so pairings keep shifting. A per-variant
 * spot check is what let this survive — it is uniform across variants, so any
 * single sample looks as wrong as the rest and reads as "the design".
 *
 * Run at two widths. The bug is a shrink-to-fit, so it is worst where there is
 * least room, and a desktop-only check understates it.
 */

const WIDTHS = [1280, 700];

/** Share of its CONTENT COLUMN the title must be able to use.
 *  Measured against the content box, not the hero: the content column is
 *  inset by `padding: clamp(2rem, 5vw, 4rem)` on purpose, and counting that
 *  padding as "narrow" would fault a hero for being well spaced. What the
 *  shrink-wrap bug does is make the title narrower than the space the column
 *  actually offers it, which is what this measures. */
const MIN_TITLE_SHARE = 90;

type Row = {
  index: number; pretitle: string | null; variant: string; xalign: string | null;
  heroW: number; contentW: number; available: number; titleW: number; titleShare: number;
  brokenWord: string | null;
};

async function sweep(page: any, width: number): Promise<Row[]> {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/demos/playground.html');
  await page.waitForFunction(() => (window as any).WB, { timeout: 20000 });
  // The 120 heroes only exist once this example is chosen.
  await page.selectOption('#pg-examples', 'heroes-120');
  await page.waitForTimeout(3000);

  return page.evaluate((minShare: number) => {
    const rows: any[] = [];
    const els = [...document.querySelectorAll('#pg-preview [x-cardhero]')] as HTMLElement[];

    els.forEach((el, index) => {
      const content = el.querySelector('.x-card__hero-content') as HTMLElement | null;
      const title = el.querySelector('h1,h2,h3,h4') as HTMLElement | null;
      if (!content || !title) return;

      const heroW = el.getBoundingClientRect().width;
      const titleW = title.getBoundingClientRect().width;

      // The column's INNER width — its box minus its own padding. Comparing a
      // title against the column's outer width can never reach 90% when the
      // column carries 64px of padding a side, which is a property of the
      // measurement, not of the layout.
      const ccs = getComputedStyle(content);
      const available = content.getBoundingClientRect().width
        - (parseFloat(ccs.paddingLeft) || 0)
        - (parseFloat(ccs.paddingRight) || 0);

      // A word split mid-character: compare the rendered line boxes against
      // the words. Range gives the real visual lines, unlike the element box.
      let brokenWord: string | null = null;
      const range = document.createRange();
      range.selectNodeContents(title);
      const lineCount = range.getClientRects().length;
      const words = (title.textContent || '').trim().split(/\s+/);
      // More rendered lines than words means at least one word was split.
      if (lineCount > words.length) brokenWord = `${lineCount} lines for ${words.length} words`;

      rows.push({
        index,
        pretitle: el.getAttribute('pretitle'),
        variant: el.getAttribute('variant') || 'default',
        xalign: el.getAttribute('xalign'),
        heroW: Math.round(heroW),
        contentW: Math.round(content.getBoundingClientRect().width),
        titleW: Math.round(titleW),
        available: Math.round(available),
        titleShare: available > 0 ? Math.round((titleW / available) * 100) : 0,
        brokenWord,
      });
    });
    return rows;
  }, MIN_TITLE_SHARE);
}

test.describe('every playground hero lays out', () => {
  for (const width of WIDTHS) {
    test.describe(`at ${width}px`, () => {
      let rows: Row[];

      test.beforeAll(async ({ browser }) => {
        const page = await browser.newPage();
        rows = await sweep(page, width);
        await page.close();
      });

      test('the sweep actually ran', () => {
        // The heroes only exist after the example is selected; a silent failure
        // there would report perfect compliance over an empty list.
        expect(rows.length, 'no heroes were measured').toBeGreaterThan(100);
      });

      test('no hero squeezes its title into a narrow column', () => {
        const narrow = rows
          .filter((r) => r.titleShare < MIN_TITLE_SHARE)
          .map((r) => `#${r.index} ${r.variant}/${r.xalign}: title ${r.titleW}px of ${r.available}px available (${r.titleShare}%), hero ${r.heroW}px`);
        expect(
          narrow.slice(0, 12),
          `${narrow.length} of ${rows.length} heroes render their title under ` +
          `${MIN_TITLE_SHARE}% of their own content column — a column flex that ` +
          'aligns with align-items shrink-wraps its children to fit-content',
        ).toEqual([]);
      });

      test('no hero breaks a word mid-character', () => {
        const broken = rows
          .filter((r) => r.brokenWord)
          .map((r) => `#${r.index} ${r.variant}/${r.xalign}: ${r.brokenWord}`);
        expect(
          broken.slice(0, 12),
          `${broken.length} of ${rows.length} heroes split a word across lines ` +
          '(DEMOS-AND-DOCS-STANDARDS §23: reduce the size or scroll, never break a word)',
        ).toEqual([]);
      });

      test('every variant and alignment is actually covered', () => {
        // The sweep is only meaningful if the permutations are present.
        const variants = new Set(rows.map((r) => r.variant));
        const aligns = new Set(rows.map((r) => r.xalign));
        expect([...variants].sort().length, `only saw variants: ${[...variants].join(', ')}`)
          .toBeGreaterThanOrEqual(4);
        expect([...aligns].sort().length, `only saw alignments: ${[...aligns].join(', ')}`)
          .toBeGreaterThanOrEqual(3);
      });
    });
  }
});
