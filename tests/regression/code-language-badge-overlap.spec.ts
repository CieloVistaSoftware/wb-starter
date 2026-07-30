import { test, expect } from '@playwright/test';

/**
 * The docs/behaviors-reference.md "code live example" (`<code x-code
 * language="Python">print("Hello")</code>`) rendered with the language
 * badge ("PYTHON") stacked directly on top of the code text instead of
 * above it. Root cause (src/wb-viewmodels/semantics/code.js): the badge
 * is absolutely positioned, and `element.style.paddingTop` is set to
 * reserve room for it -- but the default 'inline' variant leaves the
 * <code> element `display: inline`, and inline elements never grow their
 * line box for vertical padding (painted, not laid out), so the reserved
 * space never actually pushed the text down. Fixed by promoting to
 * `inline-block` whenever a language badge is added.
 */

async function ready(page) {
  await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/behaviors-reference.md'), {
    waitUntil: 'domcontentloaded',
  });
}

test.describe('x-code language badge does not overlap the code text', () => {
  test('badge sits above the first line of code, not on top of it', async ({ page }) => {
    await ready(page);

    const container = page.locator('wb-demo', { has: page.locator('code[x-code]') }).first();
    await container.scrollIntoViewIfNeeded();

    const codeEl = container.locator('.wb-demo__grid code[x-code]').first();
    await expect(codeEl).toBeVisible({ timeout: 20000 });

    await expect
      .poll(() => codeEl.evaluate((el) => getComputedStyle(el).display), {
        message: 'code element with a language badge should be laid out as inline-block, not plain inline',
        timeout: 10000,
      })
      .toBe('inline-block');

    const badge = container.locator('.x-code__language').first();
    await expect(badge).toBeVisible();

    const badgeBox = await badge.boundingBox();
    const codeBox = await codeEl.boundingBox();
    expect(badgeBox && codeBox, 'both badge and code element should have a bounding box').toBeTruthy();

    // The badge must sit entirely above the code element's own top-most
    // painted content area -- i.e. the code element must have grown tall
    // enough (via paddingTop) that its box starts at/above the badge, with
    // the badge fitting inside that reserved top padding, not overlapping
    // where the actual code text renders.
    const paddingTop = await codeEl.evaluate((el) => parseFloat(getComputedStyle(el).paddingTop));
    expect(paddingTop, 'paddingTop must be a real reserved-space value (>= 24px), not a no-op on an inline box').toBeGreaterThanOrEqual(24);

    // Badge's bottom edge should not extend past the code box's padding-top
    // boundary (i.e. into the text area) by more than a small tolerance.
    const textAreaTop = codeBox!.y + paddingTop;
    expect(badgeBox!.y + badgeBox!.height, 'badge should not overlap into the code text area').toBeLessThanOrEqual(textAreaTop + 2);
  });
});
