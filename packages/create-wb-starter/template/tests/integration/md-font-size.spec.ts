import { test, expect } from '@playwright/test';

/**
 * All .md docs must render at a readable size on mobile — 1rem equivalent —
 * driven by ONE configuration setting: --md-font-size (themes.css, 1rem).
 * mdhtml's old size map defaulted the container to 0.55rem (!), making every
 * doc unreadably small.
 */
test.describe('markdown font size — single --md-font-size setting, 1rem', () => {
  test('doc-viewer body text and code render at >= 16px on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/V3-GUIDE.md'), {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForFunction(() => !!document.querySelector('#content p'), { timeout: 20000 });

    const sizes = await page.evaluate(() => {
      const px = (el: Element | null) => (el ? parseFloat(getComputedStyle(el).fontSize) : 0);
      return {
        container: px(document.querySelector('#content')),
        paragraph: px(document.querySelector('#content p')),
        code: px(document.querySelector('#content pre code')),
        inlineCode: px(document.querySelector('#content p code, #content li code')),
      };
    });

    expect(sizes.paragraph, `paragraph ${sizes.paragraph}px`).toBeGreaterThanOrEqual(16);
    expect(sizes.code, `pre code ${sizes.code}px`).toBeGreaterThanOrEqual(16);
    if (sizes.inlineCode) expect(sizes.inlineCode, `inline code ${sizes.inlineCode}px`).toBeGreaterThanOrEqual(16);
  });

  test('the --md-font-size knob drives the rendered size', async ({ page }) => {
    await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/V3-GUIDE.md'), {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForFunction(() => !!document.querySelector('#content p'), { timeout: 20000 });

    const at = async () =>
      page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#content p')!).fontSize));

    const before = await at();
    await page.evaluate(() => document.documentElement.style.setProperty('--md-font-size', '20px'));
    const after = await at();

    expect(before, 'default follows the 1rem setting').toBeGreaterThanOrEqual(16);
    expect(after, 'changing the single setting changes the doc text').toBe(20);
  });
});
