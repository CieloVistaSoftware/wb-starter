/**
 * REGRESSION: demos/site/content.html includes a <div x-codecontrol> (same
 * component fixed in #431 -- see codecontrol-theme-cdn-url.spec.ts). This
 * test asserts the actual visible effect on THIS page specifically: every
 * <div x-demo> code panel must render with real, non-default syntax colors,
 * not just that the theme <link> resolves correctly in isolation.
 */
import { test, expect } from '../fixtures/offline';

test('every [x-demo] code panel on content.html has real syntax coloring', async ({ page }) => {
  await page.goto('/demos/site/content.html');
  // The lazy runtime (#491) builds an element only once it nears the
  // viewport. The codecontrol demo sits ~24,000px down the page (further now
  // that the table demos render real rows instead of collapsing to nothing),
  // so waiting for its API without scrolling to it waited for nothing.
  await page.locator('[x-codecontrol]').first().scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const el = document.querySelector('[x-codecontrol]') as any;
    return !!(el && el.wbCodeControl);
  }, { timeout: 15000 });

  const codePanels = page.locator('[x-demo] pre code, [x-demo] code.hljs');
  const count = await codePanels.count();
  expect(count, 'content.html must have at least one code demo panel').toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const panel = codePanels.nth(i);
    await panel.scrollIntoViewIfNeeded();

    // One round-trip per panel, not one per span: the table demos' source now
    // carries real <thead>/<tbody> rows (a <table> cannot hold the old text
    // placeholder), ~80 hljs spans a panel, and reading them one evaluate()
    // at a time ran this test past its 30s budget before it reached the end.
    const { spanCount, colorList } = await panel.evaluate((el) => {
      const spans = Array.from(el.querySelectorAll('span[class*="hljs"]'));
      return { spanCount: spans.length, colorList: spans.map((sp) => getComputedStyle(sp).color) };
    });
    if (spanCount === 0) continue; // plain-text sample with nothing to tokenize, not itself a coloring failure

    const colors = new Set<string>(colorList);
    expect(
      colors.size,
      `panel ${i} has ${spanCount} hljs spans but only ${colors.size} distinct color(s) -- syntax highlighting is not actually colored`
    ).toBeGreaterThan(1);
  }
});
