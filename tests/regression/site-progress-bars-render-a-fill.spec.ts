import { test, expect } from '@playwright/test';

/**
 * #510 — "Progress bars not rendering / showing nothing".
 *
 * ROOT CAUSE (traced, not guessed):
 * demos/site/feedback.html is written by scripts/generate-site.mjs. That
 * generator builds a demo per enum value ("Variants", "size variants") and
 * per boolean prop ("Toggles"), and it only ever filled in SUPPORTING
 * attributes that the schema marks `required`. `wb-progress`'s `value` is
 * not required, and its schema default is the low boundary (0), so those
 * sweeps emitted `<wb-progress variant="success">` with no `value` at all.
 * semantics/progress.js then reads `element.getAttribute('value') ?? 0`,
 * computes pct=0 and sets `.wb-progress__bar { width: 0% }` — a bar that is
 * present, correctly enhanced, and paints nothing. 13 of the 28 bars on the
 * page were in that state: all 6 "Variants", all 5 "size variants" and both
 * "Toggles" bars. That is the user report.
 *
 * The demos with an explicit value (the schema `test.matrix` sweep) always
 * worked, which is why this never showed up as a component-level bug — the
 * defect is in the generated markup, so this test asserts on the real
 * generated page rather than on a hand-written fixture.
 *
 * Deliberately NOT asserting "every bar is non-zero": `<wb-progress
 * value="0">` is a legitimate matrix combination that must render 0%, and
 * `<wb-progress indeterminate>` has no value-derived width at all (it gets
 * an animated sweep from .wb-progress--indeterminate). Those two are the
 * only allowed empty fills.
 */

const PAGE = '/demos/site/feedback.html';

type BarInfo = {
  index: number;
  openingTag: string;
  value: string | null;
  indeterminate: boolean;
  hasBar: boolean;
  fillWidth: number;
};

/**
 * wb-demo defers building every block past the first 5 to an
 * IntersectionObserver (wb-demo.js, EAGER_BUILD_COUNT). The progress
 * sections sit far below the fold, so their children are never enhanced
 * until scrolled near. Walk the whole page once so every block builds —
 * without this the bars have no `.wb-progress__bar` child at all and the
 * test would fail for a reason that has nothing to do with #510.
 */
async function buildEveryLazyDemo(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 60)));
    }
    window.scrollTo(0, 0);
  });
  // Every <wb-progress> should now have been enhanced into host + fill div.
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const els = Array.from(document.querySelectorAll('wb-progress'));
          return els.filter((el) => el.querySelector('.wb-progress__bar')).length === els.length;
        }),
      { timeout: 15000, message: 'every <wb-progress> should be enhanced with a .wb-progress__bar' }
    )
    .toBe(true);
}

async function readBars(page: import('@playwright/test').Page): Promise<BarInfo[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('wb-progress')).map((el, index) => {
      const bar = el.querySelector('.wb-progress__bar') as HTMLElement | null;
      return {
        index,
        openingTag: el.outerHTML.slice(0, el.outerHTML.indexOf('>') + 1),
        value: el.getAttribute('value'),
        indeterminate: el.hasAttribute('indeterminate'),
        hasBar: !!bar,
        fillWidth: bar ? bar.getBoundingClientRect().width : -1
      };
    })
  );
}

test.describe('#510 — generated showcase progress bars actually paint a fill', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!(window as any).WB, undefined, { timeout: 20000 });
    await page.waitForSelector('wb-progress', { timeout: 20000 });
    await buildEveryLazyDemo(page);
  });

  test('no generated <wb-progress> demo is emitted without a value', async ({ page }) => {
    const bars = await readBars(page);
    // Guard against the test silently passing on an empty/renamed page.
    expect(bars.length, `expected the feedback showcase to contain <wb-progress> demos`).toBeGreaterThanOrEqual(14);

    const valueless = bars.filter((b) => !b.indeterminate && b.value === null);
    expect(
      valueless.map((b) => b.openingTag),
      'every determinate <wb-progress> demo must declare a value — a valueless bar renders a 0% (invisible) fill'
    ).toEqual([]);
  });

  test('every determinate, non-zero-value bar paints a non-zero fill width', async ({ page }) => {
    const bars = await readBars(page);
    const shouldPaint = bars.filter((b) => !b.indeterminate && b.value !== '0');
    expect(shouldPaint.length, 'expected some determinate progress demos').toBeGreaterThan(0);

    const empty = shouldPaint.filter((b) => b.fillWidth <= 0);
    expect(
      empty.map((b) => `${b.openingTag} → fill width ${b.fillWidth}px`),
      'these bars render nothing on screen'
    ).toEqual([]);
  });
});
