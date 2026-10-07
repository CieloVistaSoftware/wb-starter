import { test, expect } from '../fixtures/offline';

/**
 * WB.settled() waits for behavior CSS that is still loading (#1516).
 *
 * input-theming read a native-white <input> in a dark theme on CI right after
 * WB.settled() had resolved: settled said the page was built while the
 * behavior's stylesheet was still on its way. Two holes let that happen in
 * src/core/style-loader.js:
 *
 *   1. A behavior <link> already in the document counted as loaded the moment
 *      it was found, though it could still be loading (put there by
 *      preloadCssForHtml(), or left by an earlier load the cache had dropped).
 *   2. A CSS load no injection awaited -- a preload, or fix-card.js's
 *      fire-and-forget ensureBehaviorCss() -- was invisible to the runtime's
 *      idle signal.
 *
 * Here card.css is held on a gate the test opens, so "still loading" is a
 * state the test controls rather than a race it hopes to win.
 */
test.use({ serviceWorkers: 'block' }); // #1349: this spec holds a request with page.route

const CARD_CSS = '**/src/styles/behaviors/card.css*';

/** Two frames: long enough for anything already resolvable to resolve. */
const frames = (page: import('@playwright/test').Page) =>
  page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

async function holdCardCss(page: import('@playwright/test').Page) {
  let open!: () => void;
  const gate = new Promise<void>((r) => { open = r; });
  await page.route(CARD_CSS, async (route) => { await gate; await route.continue(); });
  return open;
}

test.beforeEach(async ({ page }) => {
  // No scripts of its own: nothing has asked for card.css before the test does.
  await page.goto('/tests/fixtures/blank.html');
});

test('an unawaited behavior CSS load holds WB.settled() until it arrives', async ({ page }) => {
  const openGate = await holdCardCss(page);
  const requested = page.waitForRequest(CARD_CSS, { timeout: 10000 });

  await page.evaluate(async () => {
    const { runtimeTracker } = await import('/src/core/injection-tracker.js');
    const { ensureBehaviorCss } = await import('/src/core/style-loader.js');
    const w = window as any;
    w.__css = { loaded: false, settled: false };
    // Not awaited, the way fix-card.js and a page preload call it.
    void ensureBehaviorCss('card').then(() => { w.__css.loaded = true; });
    void runtimeTracker.settled({ timeout: 20000 }).then(() => { w.__css.settled = true; });
  });

  await requested; // card.css is on its way, and held
  await frames(page);
  expect(await page.evaluate(() => (window as any).__css), 'resolved while card.css was still loading')
    .toEqual({ loaded: false, settled: false });

  openGate();
  await expect.poll(() => page.evaluate(() => (window as any).__css), { timeout: 10000 })
    .toEqual({ loaded: true, settled: true });
  expect(await page.evaluate(() => {
    const link = document.querySelector('link[data-x-behavior-css="card.css"]') as HTMLLinkElement | null;
    return { sheet: !!link?.sheet, state: link?.dataset.xCssState };
  })).toEqual({ sheet: true, state: 'loaded' });
});

test('a behavior <link> already in the page but still loading is waited for, not taken as loaded', async ({ page }) => {
  const openGate = await holdCardCss(page);
  const requested = page.waitForRequest(CARD_CSS, { timeout: 10000 });

  await page.evaluate(async () => {
    // The state preloadCssForHtml() or a dropped cache entry leaves behind: the
    // file's <link> is in the document and still on its way.
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('/src/styles/behaviors/card.css', location.href).href;
    link.dataset.xBehaviorCss = 'card.css';
    document.head.appendChild(link);
  });
  await requested;

  await page.evaluate(async () => {
    const { ensureBehaviorCss } = await import('/src/core/style-loader.js');
    const w = window as any;
    w.__css = { loaded: false };
    void ensureBehaviorCss('card').then(() => { w.__css.loaded = true; });
  });
  await frames(page);
  expect(await page.evaluate(() => (window as any).__css.loaded), 'an existing, still-loading <link> was taken as loaded')
    .toBe(false);

  openGate();
  await expect.poll(() => page.evaluate(() => (window as any).__css.loaded), { timeout: 10000 }).toBe(true);
  expect(await page.evaluate(() => document.querySelectorAll('link[data-x-behavior-css="card.css"]').length),
    'waiting on the existing <link> must not stack a second one').toBe(1);
});
