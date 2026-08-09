/**
 * REGRESSION: demos/site/content.html includes a <wb-codecontrol> (same
 * component fixed in #431 -- see codecontrol-theme-cdn-url.spec.ts). This
 * test asserts the actual visible effect on THIS page specifically: every
 * <wb-demo> code panel must render with real, non-default syntax colors,
 * not just that the theme <link> resolves correctly in isolation.
 */
import { test, expect } from '@playwright/test';

test('every wb-demo code panel on content.html has real syntax coloring', async ({ page }) => {
  await page.goto('/demos/site/content.html');
  await page.waitForFunction(() => {
    const el = document.querySelector('wb-codecontrol') as any;
    return !!(el && el.wbCodeControl);
  }, { timeout: 15000 });

  const codePanels = page.locator('wb-demo pre code, wb-demo code.hljs');
  const count = await codePanels.count();
  expect(count, 'content.html must have at least one code demo panel').toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const panel = codePanels.nth(i);
    await panel.scrollIntoViewIfNeeded();

    const spans = panel.locator('span[class*="hljs"]');
    const spanCount = await spans.count();
    if (spanCount === 0) continue; // plain-text sample with nothing to tokenize, not itself a coloring failure

    const colors = new Set<string>();
    for (let s = 0; s < spanCount; s++) {
      colors.add(await spans.nth(s).evaluate(el => getComputedStyle(el).color));
    }
    expect(
      colors.size,
      `panel ${i} has ${spanCount} hljs spans but only ${colors.size} distinct color(s) -- syntax highlighting is not actually colored`
    ).toBeGreaterThan(1);
  }
});
