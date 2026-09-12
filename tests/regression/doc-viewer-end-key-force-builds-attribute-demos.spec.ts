import { test, expect, type Route } from '@playwright/test';

/**
 * REGRESSION (#1070): doc-viewer's End-key force-build must find the demos that
 * docs actually contain — the `x-demo` ATTRIBUTE, not a `<x-demo>` TAG.
 *
 * WHAT THE SELECTOR DRIVES. `scrollToTrueBottom()` in public/doc-viewer.html
 * awaits `contentReady()`, then calls `demo(el, { …, isLazy: true })` on every
 * element `document.querySelectorAll(<selector>)` returns, awaits them all, and
 * only then scrolls. `demo()` (src/wb-viewmodels/demo.js) moves the block's
 * children into a freshly built `<div class="x-demo__grid">`. So the observable
 * effect of the selector is: after End, every block has an `.x-demo__grid`.
 * Before 0e143e38 the selector was the tag `'x-demo'`. No doc has that tag
 * (4.0.0 removed it), so it matched nothing, `pending` was `[]`, and the
 * force-build never built anything.
 *
 * WHY THE PREVIOUS GUARD PROVES NOTHING ABOUT THE SELECTOR.
 * `doc-viewer-end-key-true-bottom.spec.ts` passes on EITHER selector. The
 * commit that changed it measured and said so ("2/2 on either selector"). The
 * reason is in the code, not in timing luck: doc-viewer runs
 * `await WB.scan(docEl)` in its `wb:mdhtml:loaded` handler BEFORE it resolves
 * `contentReady`, and wb.js's scan dispatches `demo` on every `[x-demo]`
 * EAGERLY (the `{prefix}-{name}` shorthand loop — there is no
 * IntersectionObserver deferral in this runtime any more). So by the time End's
 * handler gets past `contentReady()`, every block is already
 * `_demoInitialized`. The force-build is a no-op whichever selector it uses,
 * and End-lands-at-bottom cannot tell them apart. Also, until 0e143e38 that
 * spec's fixture had zero demos.
 *
 * WHEN THE SELECTOR DOES MATTER. The force-build earns its place only on the
 * path it was written for: End is pressed and `contentReady()` gives up waiting
 * (its 4s ceiling) while the runtime has NOT yet built the blocks. A slow
 * network or a slow WB boot is the real-world version. This spec produces that
 * state deterministically, without touching product code:
 *   - `demo.css` is held at the network layer. `WB.inject()` awaits
 *     `ensureBehaviorCss('demo')` before it calls `demo()`, so WB's own demo
 *     injections cannot run while it is held. The held `<link>` stays connected,
 *     so neither style-loader's removal watch nor its readystatechange sweep
 *     settles it. `WB.scan()` therefore does not resolve and `contentReady`
 *     falls through to its 4s ceiling, exactly as on a slow machine.
 *   - While it is held, the ONLY code on the page that can build a block is
 *     the End handler's force-build.
 *
 * HOW IT FAILS AGAINST THE OLD CODE. With `querySelectorAll('x-demo')` the
 * fixture's six `<div x-demo>` blocks are not matched, nothing calls `demo()`,
 * WB cannot (demo.css held), and no block ever gets an `.x-demo__grid`. The
 * assertion "every [x-demo] block has an .x-demo__grid after End" reads 0 of 6
 * and fails. With `querySelectorAll('[x-demo]')` all six are built by the
 * force-build ~4s after the press.
 *
 * FIXTURE. The doc is served by `page.route`, not read from docs/. The previous
 * guard died silently when 4.0.0 rewrote the doc it borrowed (card.md went to
 * zero demos). A fixture this spec owns cannot drift out from under it, and it
 * is written in exactly the form docs/ uses: `<div x-demo>` blocks in markdown.
 *
 * No sleeps. The waits are for a real network request arriving, the rendered
 * blocks existing, and the grids being built.
 */

const FIXTURE_PATH = 'docs/__regression__/doc-viewer-end-key-force-build.md';
const BLOCKS = 6;

const MARKDOWN = [
  '# End-key force-build fixture',
  '',
  'Six live demo blocks, authored in the attribute form every doc uses.',
  '',
  ...Array.from({ length: BLOCKS }, (_, i) => [
    '<div x-demo>',
    `<span class="fixture-demo-child">Demo block ${i + 1}</span>`,
    '</div>',
    '',
  ].join('\n')),
].join('\n');

/** Reject with `message` if `p` has not settled within `ms`. A deadline, not a readiness sleep. */
function within<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([p, deadline]).finally(() => clearTimeout(timer));
}

test.describe('doc-viewer End key force-builds [x-demo] blocks (#1070)', () => {
  test('End builds every <div x-demo> block the runtime has not built yet', async ({ page }) => {
    // goto + markdown render + contentReady's fixed 4s ceiling (product code,
    // not a test sleep) + six demo() builds. 60s covers that under 8-worker
    // contention; the red path ends at the 20s build wait below.
    test.setTimeout(60000);
    await page.setViewportSize({ width: 1280, height: 855 });

    await page.route(`**/${FIXTURE_PATH}`, (route) =>
      route.fulfill({ status: 200, contentType: 'text/markdown; charset=utf-8', body: MARKDOWN }),
    );

    const held: Route[] = [];
    let signalHeld!: () => void;
    const demoCssHeld = new Promise<void>((resolve) => { signalHeld = resolve; });
    await page.route(
      (url) => url.pathname.endsWith('/src/styles/behaviors/demo.css'),
      (route) => { held.push(route); signalHeld(); },
    );

    try {
      // 'domcontentloaded', not 'load': a stylesheet inserted before the load
      // event delays it, and demo.css is deliberately never answered.
      await page.goto(`/public/doc-viewer.html?file=${FIXTURE_PATH}`, { waitUntil: 'domcontentloaded' });

      // The doc rendered, with all six blocks in it.
      await page.waitForSelector('#content [x-demo]', { timeout: 20000 });
      await expect(page.locator('#content [x-demo]'), 'fixture must render its six <div x-demo> blocks')
        .toHaveCount(BLOCKS);

      // WB has reached its demo injections and is now waiting on demo.css.
      await within(demoCssHeld, 20000,
        'precondition: the runtime never requested demo.css, so WB never reached its demo injections — this test cannot isolate the force-build without that');

      // Nothing has built a block yet. If this fails, something other than the
      // End handler builds demos while demo.css is held, and the assertion
      // below could no longer attribute the grids to the force-build.
      await expect(page.locator('#content [x-demo] > .x-demo__grid'),
        'precondition: with demo.css held, no block may be built before End is pressed')
        .toHaveCount(0);

      await page.keyboard.press('End');

      // The assertion that separates the two selectors. The force-build runs
      // once contentReady() gives up (4s after the press), so allow for that
      // plus six builds.
      const built = await page
        .waitForFunction((n) => {
          const blocks = Array.from(document.querySelectorAll('#content [x-demo]'));
          return blocks.length === n && blocks.every((b) => b.querySelector(':scope > .x-demo__grid'));
        }, BLOCKS, { timeout: 20000 })
        .then(() => BLOCKS)
        .catch(() => page.locator('#content [x-demo] > .x-demo__grid').count());

      expect(built,
        `End force-built ${built} of ${BLOCKS} <div x-demo> blocks. The force-build selector did not match the ` +
        `attribute form docs use (querySelectorAll('x-demo') matches a tag that does not exist).`)
        .toBe(BLOCKS);

      // The authored children really moved into the grids, one per block.
      await expect(page.locator('#content [x-demo] > .x-demo__grid .fixture-demo-child')).toHaveCount(BLOCKS);

      // And WB still cannot have done it: demo.css was requested and is still
      // unanswered, so every WB.inject(…, 'demo') is still parked before demo().
      expect(held.length, 'demo.css must still be held, so the grids can only have come from the force-build')
        .toBeGreaterThan(0);
    } finally {
      for (const route of held) await route.continue().catch(() => {});
      await page.unrouteAll({ behavior: 'ignoreErrors' }).catch(() => {});
    }
  });
});
