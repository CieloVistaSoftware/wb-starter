import { test, expect, Page, Locator } from '../fixtures/offline';
import { demoWidthsSettled } from '../base';
import fs from 'node:fs';
import path from 'node:path';

/**
 * docs/behaviors/cardhorizontal.md: John asked for unit tests on
 * every live demo rendered on this doc page
 * (public/doc-viewer.html?file=docs%2Fbehaviors%2Fcardhorizontal.md).
 *
 * The doc was rewritten (4e36ea09/adacd650) around <div x-demo> blocks -- its
 * old ```html fences are gone, and card docs must not hide executable markup
 * in a static fence (#419). The rewrite kept only the Usage demo and dropped
 * the ones that showed image-position and image-width working, so the two
 * attributes the page exists to explain had no example. Five demos again, one
 * per claim: the default layout, authored body text, image-position="left"
 * written explicitly, image-position="right", and image-width="60%".
 *
 * The card names its title and subtitle by tag (a8a7362e): the content
 * column's <h3> and <p>, not .x-card__title/.x-card__subtitle.
 *
 * Two real bugs were found and fixed while writing/running these tests
 * (confirmed live via console/computed-style inspection on the actual
 * doc-viewer page, and independently re-confirmed/fixed on `main`):
 *
 * 1. (#601, fixed on main) All demos originally pointed at
 *    `/images/feature.jpg` or `/images/wide.jpg` -- neither file exists
 *    anywhere in the repo. Every <img> 404d. Replaced with real,
 *    distinct picsum.photos URLs (matching demos/site/cards.html's own
 *    convention), 1000x800 so the short edge stays >= 800px.
 * 2. (#602, fixed on main) The "Image on Right" and "Custom Image Width"
 *    examples wrote `imagePosition="right"` / `imageWidth="60%"` --
 *    camelCase attributes. HTML lowercases attribute names on parse
 *    (`imageposition`, no hyphen), which never matches cardhorizontal()'s
 *    (src/wb-viewmodels/card.js) kebab-case
 *    `element.getAttribute('image-position')` /
 *    `('image-width')` lookups, so both properties were silently
 *    ignored -- confirmed live: "Image on Right"'s computed flex-direction
 *    stayed `row` (should be `row-reverse`), and "Custom Image Width"'s
 *    figure measured ~40% (the default) instead of 60%. Fixed to
 *    kebab-case (`image-position`, `image-width`) site-wide in this doc.
 *
 * Separately (not a docs issue -- a real component gap): cardhorizontal()'s
 * <img> had no 'error' handler at all, so a broken image src rendered as a
 * silent broken-image icon with zero console/error-log signal. See
 * tests/regression/x-cardhorizontal-image-error-on-broken-src.spec.ts for
 * the fix + dedicated regression coverage of that behavior.
 */

const DOC_FILE = 'docs/behaviors/cardhorizontal.md';
const DOC_URL = `/public/doc-viewer.html?file=${encodeURIComponent(DOC_FILE)}`;

/**
 * #1196: this was a hard-coded 5. When 4.0.0 regenerated the doc down to two
 * examples, every test here died at the count wait, all five were filed as
 * known failures, and the spec tested nothing for weeks. The count is read
 * from the doc: live x-cardhorizontal markup outside code fences.
 */
function liveCardCount(): number {
  const md = fs.readFileSync(path.join(process.cwd(), DOC_FILE), 'utf8');
  const prose = md.replace(/^(```|~~~)[\s\S]*?^\1/gm, '');
  return (prose.match(/<[a-z][a-z0-9-]*\s[^>]*?\bx-cardhorizontal\b/g) || []).length;
}
const EXPECTED_DEMO_COUNT = liveCardCount();
// The tests below cover five claims by position; fewer demos means the doc
// lost one of them, which must fail here with that message, not as a timeout.
test.beforeAll(() => {
  expect(EXPECTED_DEMO_COUNT, `${DOC_FILE} must keep a live demo for each of the five claims tested here`)
    .toBeGreaterThanOrEqual(5);
});

async function gotoDoc(page: Page): Promise<void> {
  await page.goto(DOC_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const t = document.getElementById('content')?.innerText || '';
    return t.length > 200 && !t.includes('Loading documentation');
  }, { timeout: 15000 });
  const cards = page.locator('[x-cardhorizontal]');
  await expect(cards).toHaveCount(EXPECTED_DEMO_COUNT, { timeout: 15000 });
  // Let shrink-to-fit's rAF-scheduled code-panel measurement settle (same
  // wait used by doc-viewer-code-panel-not-narrow.spec.ts for this exact
  // demo.js code path).
  await page.waitForTimeout(500);
  // ...and then until every demo has COMMITTED its width. Until it does,
  // demo.css caps the code panel at 50vw, and demos 2-4 have a card wider
  // than that (~800px at 1280): read inside the 500ms above -- the photo not
  // yet decoded, so nothing committed -- demo 2 was "649px of content in a
  // 640px box", a frame the reader never settles on.
  await demoWidthsSettled(page);
}

// Real, external picsum.photos requests -- give the network a real chance
// to finish (cold connection/DNS on the very first request of a test run
// is measurably slower than gotoDoc's fixed 500ms settle wait) instead of
// racing a fixed timeout, which is exactly the kind of test-side flake this
// project's standing "no flaky tests" policy calls a real defect to fix.
async function isImageLoaded(img: Locator): Promise<boolean> {
  try {
    await expect.poll(
      () => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0),
      { timeout: 15000 }
    ).toBe(true);
    return true;
  } catch {
    return false;
  }
}

/** Standard §6: the demo's code panel(s) must never wrap and must show
 * their full source (no artificial narrowing forcing a scrollbar). */
async function assertCodePanelStandards(demo: Locator, label: string): Promise<void> {
  // Read only once demo.js has committed the block's width: while it holds
  // .x-demo--measuring the panel is capped at 50vw (640px at 1280), and the
  // loaded pre-commit gate read "649px of content in a 640px box" mid-measure.
  await expect(demo).not.toHaveClass(/x-demo--measuring/);
  const panels = demo.locator('.x-demo__code');
  const count = await panels.count();
  expect(count, `${label}: expected a code panel`).toBeGreaterThan(0);
  for (let p = 0; p < count; p++) {
    const panel = panels.nth(p);
    const metrics = await panel.evaluate((el) => ({
      whiteSpace: getComputedStyle(el).whiteSpace,
      overflowX: getComputedStyle(el).overflowX,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(metrics.whiteSpace, `${label}: code panel [${p}] must never wrap`).toBe('pre');
    expect(metrics.overflowX, `${label}: code panel [${p}] must scroll horizontally instead of wrapping`).toBe('auto');
    expect(
      metrics.scrollWidth,
      `${label}: code panel [${p}] is ${metrics.scrollWidth}px of content in a ${metrics.clientWidth}px box -- narrower than its own content`
    ).toBeLessThanOrEqual(metrics.clientWidth + 2);
  }
}

/** Standard §13: >= 1rem padding inside the card's rendered content area. */
async function assertContentPadding(card: Locator, label: string): Promise<void> {
  const content = card.locator('.x-card__horizontal-content');
  await expect(content, `${label}: expected .x-card__horizontal-content`).toHaveCount(1);
  const padding = await content.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      left: parseFloat(cs.paddingLeft),
      right: parseFloat(cs.paddingRight),
      top: parseFloat(cs.paddingTop),
      bottom: parseFloat(cs.paddingBottom),
    };
  });
  const ONE_REM_PX = 16;
  for (const [side, value] of Object.entries(padding)) {
    expect(value, `${label}: content padding-${side} must be >= 1rem`).toBeGreaterThanOrEqual(ONE_REM_PX);
  }
}

async function assertNoPageHorizontalScroll(page: Page, label: string): Promise<void> {
  const overflow = await page.evaluate(() => document.body.scrollWidth > document.body.clientWidth + 2);
  expect(overflow, `${label}: page must not have horizontal overflow`).toBe(false);
}

/** One demo on the page: its card, its x-demo block, and a label for messages. */
function demoAt(page: Page, n: number, what: string) {
  return {
    label: `demo ${n + 1} (${what})`,
    card: page.locator('[x-cardhorizontal]').nth(n),
    demo: page.locator('[x-demo]').nth(n),
  };
}

async function assertText(card: Locator, label: string, title: string, subtitle: string, body?: string) {
  await expect(card.locator('.x-card__horizontal-content > h3'), `${label}: title`).toHaveText(title);
  await expect(card.locator('.x-card__horizontal-content > p'), `${label}: subtitle`).toHaveText(subtitle);
  if (body) await expect(card.locator('.x-card__horiz-body'), `${label}: body`).toContainText(body);
}

async function assertImageLoads(card: Locator, label: string) {
  const img = card.locator('.x-card__figure img');
  await expect(img, `${label}: image element`).toHaveCount(1);
  expect(await isImageLoaded(img), `${label}: image must actually load, not 404/render broken`).toBe(true);
}

const flexDirection = (card: Locator) => card.evaluate((el) => getComputedStyle(el).flexDirection);

test.describe('docs/behaviors/cardhorizontal.md live demos (doc-viewer)', () => {
  test('demo 1 -- <div x-demo> block (Overview): Basic Horizontal Card renders correctly', async ({ page }) => {
    await gotoDoc(page);
    const { label, card, demo } = demoAt(page, 0, 'Usage');

    await assertText(card, label, 'Ridge loop, 8km', 'Moderate · 3h');
    await assertImageLoads(card, label);

    // Default image-position="left": figure precedes content in DOM/flex order.
    expect(await flexDirection(card), `${label}: default image-position should render image on the left (row)`).toBe('row');

    await assertContentPadding(card, label);
    await assertCodePanelStandards(demo, label);
    await assertNoPageHorizontalScroll(page, label);
  });

  test('demo 2 -- authored body text renders under the title', async ({ page }) => {
    await gotoDoc(page);
    const { label, card, demo } = demoAt(page, 1, 'authored body');

    await assertText(card, label, 'Summit push, 14km', 'Hard · 6h', 'The last kilometre is exposed scree');
    await assertImageLoads(card, label);
    expect(await flexDirection(card), `${label}: default image-position should render image on the left (row)`).toBe('row');

    await assertContentPadding(card, label);
    await assertCodePanelStandards(demo, label);
    await assertNoPageHorizontalScroll(page, label);
  });

  test('demo 3 -- image-position="left" (explicit): image renders on the left', async ({ page }) => {
    await gotoDoc(page);
    const { label, card, demo } = demoAt(page, 2, 'image-position="left"');

    await assertText(card, label, 'Harbour walk, 3km', 'Easy · 1h', 'Flat all the way');
    await assertImageLoads(card, label);

    // Explicit left, matching the default -- must render exactly like it.
    expect(await flexDirection(card), `${label}: image-position="left" must render the image on the left (row)`).toBe('row');

    await assertContentPadding(card, label);
    await assertCodePanelStandards(demo, label);
    await assertNoPageHorizontalScroll(page, label);
  });

  test('demo 4 -- image-position="right": image renders on the right', async ({ page }) => {
    await gotoDoc(page);
    const { label, card, demo } = demoAt(page, 3, 'image-position="right"');

    await assertText(card, label, 'Sunrise viewpoint, 5km', 'Moderate · 2h', 'faces due east');
    await assertImageLoads(card, label);

    // The card must actually reverse its layout -- and the image must really
    // be painted right of the text, not just carry the computed value.
    expect(await flexDirection(card), `${label}: image-position="right" must render the image on the right (row-reverse)`).toBe('row-reverse');
    const figureBox = await card.locator('.x-card__figure').boundingBox();
    const contentBox = await card.locator('.x-card__horizontal-content').boundingBox();
    expect(figureBox!.x, `${label}: the figure must sit right of the text`).toBeGreaterThanOrEqual(contentBox!.x + contentBox!.width - 2);

    await assertContentPadding(card, label);
    await assertCodePanelStandards(demo, label);
    await assertNoPageHorizontalScroll(page, label);
  });

  test('demo 5 -- image-width="60%": image width is 60%', async ({ page }) => {
    await gotoDoc(page);
    const { label, card, demo } = demoAt(page, 4, 'image-width="60%"');

    await assertText(card, label, 'Valley panorama', 'Photo stop', 'The widest view on the route.');
    await assertImageLoads(card, label);

    // The figure must actually measure ~60% of the card's own content box
    // (the width a percentage resolves against).
    const { figureWidth, contentWidth } = await card.evaluate((el) => {
      const figure = el.querySelector('.x-card__figure') as HTMLElement;
      const cs = getComputedStyle(el);
      return {
        figureWidth: figure.getBoundingClientRect().width,
        contentWidth: el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
      };
    });
    const ratio = figureWidth / contentWidth;
    expect(ratio, `${label}: image-width="60%" -- figure is ${Math.round(ratio * 100)}% of the card, expected ~60%`).toBeGreaterThan(0.58);
    expect(ratio, `${label}: image-width="60%" -- figure is ${Math.round(ratio * 100)}% of the card, expected ~60%`).toBeLessThan(0.62);

    await assertContentPadding(card, label);
    await assertCodePanelStandards(demo, label);
    await assertNoPageHorizontalScroll(page, label);
  });
});
