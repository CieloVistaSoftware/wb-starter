import { test, expect } from '../fixtures/offline';
import { demoWidthsSettled, wbIdle } from '../base';

/**
 * #560: "docs/behaviors/article.md: doc-viewer code panels render
 * too narrow" -- reported live on public/doc-viewer.html, whose
 * `<div x-demo>`-wrapped examples (Standard Semantic Article / WB Card /
 * WB Card Data Attributes) render through the exact SAME demo.js
 * shrink-to-fit code path as demos/*.html direct pages: doc-viewer.html
 * imports `demo` from src/wb-viewmodels/demo.js directly, and every
 * <div x-demo> in a rendered .md also upgrades to the real WBDemo custom
 * element (src/wb-viewmodels/x-demo.js) via the same wb.js -> demo.js
 * call once await WB.scan() runs -- there is no separate doc-viewer-specific
 * code-panel renderer.
 *
 * The narrow LOOK on article.md's small demos (a bare <article>, a small
 * <article>) is correct per Standard §7 ("a demo is only as wide as what
 * it renders") -- confirmed live, those code panels show their full
 * source with no wrapping/truncation. What must NEVER happen, on
 * doc-viewer.html specifically or any other page using the same demo.js
 * path, is the code panel being sized a few px NARROWER than its own
 * content -- the #563/#569 bug (fixed by CODE_WIDTH_SAFETY_PX in
 * demo.js) that tripped an unnecessary horizontal scrollbar and made an
 * already-small code sample look even more cramped, clipping its last
 * character(s). This test locks that in specifically for doc-viewer.html
 * (tests/integration/doc-viewer-wb-demo.spec.ts covers upgrade behavior
 * but not width), across both a small-content doc (card.md) and a
 * wide-content doc (table.md) so a regression in either direction is
 * caught.
 */
const DOCS = [
  'docs/behaviors/card.md',
  'docs/behaviors/figure.md',
  'docs/behaviors/table.md',
];

test.describe('doc-viewer.html code panels are never narrower than their own content (#560)', () => {
  for (const file of DOCS) {
    test(`${file}: no <div x-demo> code panel shows a forced horizontal scrollbar`, async ({ page }) => {
      await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent(file), {
        waitUntil: 'domcontentloaded',
      });

      const demos = page.locator('[x-demo]');
      await expect(demos.first()).toBeVisible({ timeout: 20000 });
      // Let shrink-to-fit's rAF-scheduled measurement settle -- and then wait
      // for every demo to have committed it (demoWidthsSettled: until then
      // demo.css holds the panel at the 50vw cap, whatever it will commit).
      await page.waitForTimeout(500);
      await demoWidthsSettled(page);

      const count = await demos.count();
      expect(count, `${file} should render at least one <div x-demo>`).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const codePanels = demos.nth(i).locator('.x-demo__code');
        const panelCount = await codePanels.count();
        for (let p = 0; p < panelCount; p++) {
          const panel = codePanels.nth(p);
          const { scrollWidth, clientWidth, atCap } = await panel.evaluate((el) => ({
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            atCap: el.getBoundingClientRect().width >= window.innerWidth * 0.5 - 2,
          }));
          // The one scroll that is correct: code wider than 50vw sits AT the
          // cap and scrolls the rest. Owner requirement 2026-08-07, "all
          // x-demo code must show all the code up to 50% vw", pinned by
          // demo-code-panel-50vw.spec.ts; #390 made scroll-not-wrap the x-demo
          // rule. This check predates the cap and read every scroll as the
          // #563/#569 too-narrow bug -- card.md's byline <article> demo has a
          // 66-character body line (688px at 1280) that now correctly stops
          // at 640px. A panel narrower than the cap is still held to its
          // content, which is the bug this file exists for.
          if (atCap) continue;
          // Small tolerance for sub-pixel rounding only -- any real gap
          // means the box is sized narrower than its own content again.
          expect(
            scrollWidth,
            `${file} [x-demo][${i}] code panel [${p}] is ${scrollWidth}px of content in a ` +
            `${clientWidth}px box -- narrower than its own content, forcing an unnecessary scrollbar`
          ).toBeLessThanOrEqual(clientWidth + 2);
        }
      }
    });
  }

  test('card.md: a plain (non-wb-demo) fenced code block spans the full reading column, not a cramped sliver', async ({ page }) => {
    await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/behaviors/card.md'), {
      waitUntil: 'domcontentloaded',
    });

    const content = page.locator('#content');
    await expect(content.locator('h1')).toBeVisible({ timeout: 20000 });

    // A plain fence (card.md's ```text block under "Styling") stays a plain
    // <pre> enhanced by pre.js (x-pre) -- a completely different code path
    // from x-demo's, and one that must fill the doc's own reading column
    // width, not collapse to its content's natural size the way a
    // <div x-demo> does.
    //
    // #1241: this used to take `pre` .first(). Once the page finished, the
    // first <pre> is an x-demo's own code panel (pre.x-demo__code), which is
    // MEANT to fit its content -- so the test passed only when it measured
    // before the demos had built their panels, and failed when they won the
    // race (1 run in 5). Wait for the runtime to finish, then measure the
    // first <pre> that is not a demo's code panel.
    await wbIdle(page);
    const pre = content.locator('pre:not(.x-demo__code)').first();
    await expect(pre).toBeVisible();

    const preWidth = await pre.evaluate((el) => el.getBoundingClientRect().width);
    const contentWidth = await content.evaluate((el) => el.getBoundingClientRect().width);

    expect(
      preWidth / contentWidth,
      `plain fenced code block is ${Math.round(preWidth)}px inside a ${Math.round(contentWidth)}px reading column -- ` +
      `should fill it, not render as a narrow sliver`
    ).toBeGreaterThan(0.9);
  });
});
