import { test, expect } from '@playwright/test';

/**
 * John, live report -- demos/frameworks.html's HTMX section's <div x-demo> code
 * panel showed the ENTIRE rest of the document as "its source": a huge block
 * starting mid-comment in the React section and running through Vue,
 * Svelte, Angular, and Solid, ending in mismatched nested `</div>` tags.
 *
 * Root cause: src/wb-viewmodels/page-source-cache.js's extractTagBlock()
 * regex-scans the raw page HTML for `<div x-demo ...>...</div>` occurrences
 * with no concept of HTML comment boundaries. The React/Vue/Svelte/Angular/
 * Solid sections each explain, in a real `<!-- -->` comment, why THEY don't
 * use <div x-demo> -- prose that happens to contain the literal substring
 * "<div x-demo>" (e.g. "...which <div x-demo>'s HTML-source extraction has no way
 * to represent..."). The regex counted that prose mention as a real
 * occurrence, then its non-greedy capture scanned forward for the next
 * literal "</div>" ANYWHERE later in the file -- landing on the real
 * closing tag of the one actual <div x-demo> (wrapping the HTMX section) and
 * swallowing every other framework's markup in between as "its source".
 *
 * Fix: getPageSource() strips HTML comments (alongside the pre-existing
 * <template>-stripping from #580) before scanning, so prose that merely
 * mentions a tag name doesn't get counted as the tag itself.
 */

test.describe('demos/frameworks.html: [x-demo] code panel is bounded to its own section, not the rest of the page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/frameworks.html');
    // The HTMX section's <div x-demo> is the only one on the page -- wait for
    // its code panel to finish rendering (demo.js builds `.x-demo__code`
    // asynchronously after measuring/formatting the extracted source).
    await page.waitForSelector('[x-demo] .x-demo__code', { timeout: 30000 });
  });

  test('the HTMX [x-demo] code panel contains only the HTMX section\'s own markup', async ({ page }) => {
    const codePanel = page.locator('[x-demo] .x-demo__code').first();
    await expect(codePanel).toContainText('hx-post');
    await expect(codePanel).toContainText('Click Me (HTMX)');
  });

  test('the HTMX [x-demo] code panel does NOT swallow other frameworks\' markup', async ({ page }) => {
    const codeText = await page.locator('[x-demo] .x-demo__code').first().innerText();

    // None of these should ever appear in the HTMX section's own source --
    // if any do, extractTagBlock() has regressed to over-capturing again.
    const foreignMarkers = [
      'React.createElement',
      'react-dom',
      'createApp', // Vue
      'v-model',
      'svelte@',
      'onMount',
      '@angular/core',
      'bootstrapApplication',
      'solid-js',
      'createSignal',
    ];

    for (const marker of foreignMarkers) {
      expect(codeText, `HTMX code panel should not contain "${marker}" (another framework section's content)`).not.toContain(marker);
    }
  });

  test('the HTMX [x-demo] code panel is a short, single-section block, not a multi-thousand-character dump', async ({ page }) => {
    const codeText = await page.locator('[x-demo] .x-demo__code').first().innerText();
    // The real HTMX block is ~200 chars; the regressed bug produced a block
    // spanning 5 other framework sections (thousands of characters). A
    // generous 500-char ceiling catches the regression without being
    // brittle to minor formatting/whitespace changes in the real block.
    expect(codeText.length, `HTMX code panel is ${codeText.length} chars -- looks like it swallowed unrelated content`).toBeLessThan(500);
  });
});
