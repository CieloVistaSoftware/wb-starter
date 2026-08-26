import { test, expect, Page, Locator } from '@playwright/test';

/**
 * docs/components/cards/cardhorizontal.md: John asked for unit tests on
 * every live demo rendered on this doc page
 * (public/doc-viewer.html?file=docs%2Fcomponents%2Fcards%2Fcardhorizontal.md).
 * mdhtml.js's auto-live-render promotes the doc's one hand-authored
 * <div x-demo> block plus its four ```html fenced examples ("Basic Horizontal
 * Card", "Image on Left (explicit)", "Image on Right", "Custom Image
 * Width") into five live <div x-cardhorizontal> instances (the doc's final
 * fenced block, "Generated Structure", stays plain text -- it's
 * native-tag-only markup with no wb- or x- attribute, so mdhtml's
 * isRenderable check correctly leaves it alone).
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

const DOC_FILE = 'docs/components/cards/cardhorizontal.md';
const DOC_URL = `/public/doc-viewer.html?file=${encodeURIComponent(DOC_FILE)}`;
const EXPECTED_DEMO_COUNT = 5;

async function gotoDoc(page: Page): Promise<void> {
  await page.goto(DOC_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const t = document.getElementById('content')?.innerText || '';
    return t.length > 200 && !t.includes('Loading documentation');
  }, { timeout: 15000 });
  const cards = page.locator('x-cardhorizontal');
  await expect(cards).toHaveCount(EXPECTED_DEMO_COUNT, { timeout: 15000 });
  // Let shrink-to-fit's rAF-scheduled code-panel measurement settle (same
  // wait used by doc-viewer-code-panel-not-narrow.spec.ts for this exact
  // demo.js code path).
  await page.waitForTimeout(500);
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

test.describe('docs/components/cards/cardhorizontal.md live demos (doc-viewer)', () => {
  test('demo 1 -- <div x-demo> block (Overview): Basic Horizontal Card renders correctly', async ({ page }) => {
    await gotoDoc(page);
    const label = 'demo 1 (x-demo block)';
    const card = page.locator('x-cardhorizontal').nth(0);
    const demo = page.locator('x-demo').nth(0);

    await expect(card.locator('.x-card__title'), `${label}: title`).toHaveText('Feature Title');
    await expect(card.locator('.x-card__subtitle'), `${label}: subtitle`).toHaveText('Feature description');
    await expect(card.locator('.x-card__horiz-body'), `${label}: body`).toContainText('Detailed content here.');

    const img = card.locator('.x-card__figure img');
    await expect(img, `${label}: image element`).toHaveCount(1);
    expect(await isImageLoaded(img), `${label}: image must actually load, not 404/render broken`).toBe(true);

    // Default image-position="left": figure precedes content in DOM/flex order.
    const flexDirection = await card.evaluate((el) => getComputedStyle(el).flexDirection);
    expect(flexDirection, `${label}: default image-position should render image on the left (row)`).toBe('row');

    await assertContentPadding(card, label);
    await assertCodePanelStandards(demo, label);
    await assertNoPageHorizontalScroll(page, label);
  });

  test('demo 2 -- "Basic Horizontal Card" fenced example renders correctly', async ({ page }) => {
    await gotoDoc(page);
    const label = 'demo 2 (Basic Horizontal Card)';
    const card = page.locator('x-cardhorizontal').nth(1);
    const demo = page.locator('x-demo').nth(1);

    await expect(card.locator('.x-card__title'), `${label}: title`).toHaveText('Feature Title');
    await expect(card.locator('.x-card__subtitle'), `${label}: subtitle`).toHaveText('Feature description');
    await expect(card.locator('.x-card__horiz-body'), `${label}: body`).toContainText('Detailed content here.');

    const img = card.locator('.x-card__figure img');
    await expect(img, `${label}: image element`).toHaveCount(1);
    expect(await isImageLoaded(img), `${label}: image must actually load, not 404/render broken`).toBe(true);

    const flexDirection = await card.evaluate((el) => getComputedStyle(el).flexDirection);
    expect(flexDirection, `${label}: default image-position should render image on the left (row)`).toBe('row');

    await assertContentPadding(card, label);
    await assertCodePanelStandards(demo, label);
    await assertNoPageHorizontalScroll(page, label);
  });

  test('demo 3 -- "Image on Left (explicit)" fenced example: image renders on the left', async ({ page }) => {
    await gotoDoc(page);
    const label = 'demo 3 (Image on Left, explicit)';
    const card = page.locator('x-cardhorizontal').nth(2);
    const demo = page.locator('x-demo').nth(2);

    await expect(card.locator('.x-card__title'), `${label}: title`).toHaveText('Left Image');
    await expect(card.locator('.x-card__horiz-body'), `${label}: body`).toContainText('Content appears on the right.');

    const img = card.locator('.x-card__figure img');
    await expect(img, `${label}: image element`).toHaveCount(1);
    expect(await isImageLoaded(img), `${label}: image must actually load, not 404/render broken`).toBe(true);

    // The doc's own attribute is image-position="left" (explicit, matching
    // the default) -- must render exactly like the default: row, image first.
    const flexDirection = await card.evaluate((el) => getComputedStyle(el).flexDirection);
    expect(flexDirection, `${label}: image-position="left" must render the image on the left (row)`).toBe('row');

    await assertContentPadding(card, label);
    await assertCodePanelStandards(demo, label);
    await assertNoPageHorizontalScroll(page, label);
  });

  test('demo 4 -- "Image on Right" fenced example: image renders on the right', async ({ page }) => {
    await gotoDoc(page);
    const label = 'demo 4 (Image on Right)';
    const card = page.locator('x-cardhorizontal').nth(3);
    const demo = page.locator('x-demo').nth(3);

    await expect(card.locator('.x-card__title'), `${label}: title`).toHaveText('Right Image');
    await expect(card.locator('.x-card__horiz-body'), `${label}: body`).toContainText('Content appears on the left.');

    const img = card.locator('.x-card__figure img');
    await expect(img, `${label}: image element`).toHaveCount(1);
    expect(await isImageLoaded(img), `${label}: image must actually load, not 404/render broken`).toBe(true);

    // The doc's own attribute is image-position="right" -- the card must
    // actually reverse layout so the image renders on the right.
    const flexDirection = await card.evaluate((el) => getComputedStyle(el).flexDirection);
    expect(flexDirection, `${label}: image-position="right" must render the image on the right (row-reverse)`).toBe('row-reverse');

    await assertContentPadding(card, label);
    await assertCodePanelStandards(demo, label);
    await assertNoPageHorizontalScroll(page, label);
  });

  test('demo 5 -- "Custom Image Width" fenced example: image width is 60%', async ({ page }) => {
    await gotoDoc(page);
    const label = 'demo 5 (Custom Image Width)';
    const card = page.locator('x-cardhorizontal').nth(4);
    const demo = page.locator('x-demo').nth(4);

    await expect(card.locator('.x-card__title'), `${label}: title`).toHaveText('Large Image');
    await expect(card.locator('.x-card__horiz-body'), `${label}: body`).toContainText('Narrower content area.');

    const img = card.locator('.x-card__figure img');
    await expect(img, `${label}: image element`).toHaveCount(1);
    expect(await isImageLoaded(img), `${label}: image must actually load, not 404/render broken`).toBe(true);

    // The doc's own attribute is image-width="60%" -- the figure must
    // actually measure ~60% of the card's own width (small tolerance for
    // border/box-sizing rounding).
    const { figureWidth, cardWidth } = await card.evaluate((el) => {
      const figure = el.querySelector('.x-card__figure') as HTMLElement;
      return { figureWidth: figure.getBoundingClientRect().width, cardWidth: el.getBoundingClientRect().width };
    });
    const ratio = figureWidth / cardWidth;
    expect(ratio, `${label}: image-width="60%" -- figure is ${Math.round(ratio * 100)}% of the card, expected ~60%`).toBeGreaterThan(0.55);
    expect(ratio, `${label}: image-width="60%" -- figure is ${Math.round(ratio * 100)}% of the card, expected ~60%`).toBeLessThan(0.65);

    await assertContentPadding(card, label);
    await assertCodePanelStandards(demo, label);
    await assertNoPageHorizontalScroll(page, label);
  });
});
