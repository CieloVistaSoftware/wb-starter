import { test, expect } from '@playwright/test';

/**
 * #560: "docs/components/semantic/article.md: doc-viewer code panels render
 * too narrow" -- reported live on public/doc-viewer.html, whose
 * `<div x-demo>`-wrapped examples (Standard Semantic Article / WB Card /
 * WB Card Data Attributes) render through the exact SAME demo.js
 * shrink-to-fit code path as demos/*.html direct pages: doc-viewer.html
 * imports `demo` from src/wb-viewmodels/demo.js directly, and every
 * <div x-demo> in a rendered .md also upgrades to the real WBDemo custom
 * element (src/wb-viewmodels/x-demo.js) via the same wb.js -> demo.js
 * call once WB.scan() runs -- there is no separate doc-viewer-specific
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
 * but not width), across both a small-content doc (article.md) and a
 * wide-content doc (table.md) so a regression in either direction is
 * caught.
 */
const DOCS = [
  'docs/components/semantic/article.md',
  'docs/components/semantic/figure.md',
  'docs/components/semantics/table.md',
];

test.describe('doc-viewer.html code panels are never narrower than their own content (#560)', () => {
  for (const file of DOCS) {
    test(`${file}: no <div x-demo> code panel shows a forced horizontal scrollbar`, async ({ page }) => {
      await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent(file), {
        waitUntil: 'domcontentloaded',
      });

      const demos = page.locator('x-demo');
      await expect(demos.first()).toBeVisible({ timeout: 20000 });
      // Let shrink-to-fit's rAF-scheduled measurement settle.
      await page.waitForTimeout(500);

      const count = await demos.count();
      expect(count, `${file} should render at least one <div x-demo>`).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const codePanels = demos.nth(i).locator('.x-demo__code');
        const panelCount = await codePanels.count();
        for (let p = 0; p < panelCount; p++) {
          const panel = codePanels.nth(p);
          const { scrollWidth, clientWidth } = await panel.evaluate((el) => ({
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
          }));
          // Small tolerance for sub-pixel rounding only -- any real gap
          // means the box is sized narrower than its own content again.
          expect(
            scrollWidth,
            `${file} x-demo[${i}] code panel [${p}] is ${scrollWidth}px of content in a ` +
            `${clientWidth}px box -- narrower than its own content, forcing an unnecessary scrollbar`
          ).toBeLessThanOrEqual(clientWidth + 2);
        }
      }
    });
  }

  test('article.md: a plain (non-wb-demo) fenced code block spans the full reading column, not a cramped sliver', async ({ page }) => {
    await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/components/semantic/article.md'), {
      waitUntil: 'domcontentloaded',
    });

    const content = page.locator('#content');
    await expect(content.locator('h1')).toBeVisible({ timeout: 20000 });

    // The "Structure" section's ```html fence has no wb-*/x-* tags, so
    // mdhtml.js's auto-live-render leaves it as a plain <pre> enhanced by
    // pre.js (x-pre) -- a completely different code path from x-demo's,
    // and one that must fill the doc's own reading column width, not
    // collapse to its content's natural size the way a <div x-demo> does.
    const pre = content.locator('pre').first();
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
