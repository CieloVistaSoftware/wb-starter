import { test, expect } from '@playwright/test';

/**
 * The site footer (`.site__footer`, a sibling of the scrollable `.site__body`
 * inside `.site`'s fixed-height flex column) must always sit flush against
 * the bottom of the viewport — regardless of page, content length, or
 * viewport size. Two real bugs used to defeat this:
 *   1. `.site` was `height: 100vh` only — on a real (non-devtools-emulated)
 *      browser, 100vh can exceed the actually-visible viewport once browser
 *      chrome is accounted for, leaving dead space the footer can't reach.
 *   2. A wide, non-wrapping `<pre>` (or any other element) could overflow
 *      `.site__body` horizontally, and nothing capped that at the scroll
 *      container — the resulting horizontal scrollbar visually crowded the
 *      footer instead of leaving it a clean, flush bottom edge.
 * Fixed in src/styles/site.css: `.site` also sets `height: 100dvh`, and
 * `.site__body` gets `overflow-x: hidden` plus `flex-shrink: 0` on both
 * `.site__header` and `.site__footer` so neither can be squeezed to make
 * room for the other.
 */
test.describe('footer anchors to viewport bottom (site.css)', () => {
  const PAGES = [
    { url: '/', label: 'home (short content)' },
    { url: '/?page=components', label: 'components (long content, code blocks)' },
  ];

  for (const { url, label } of PAGES) {
    test(`${label}: footer bottom === viewport height, no page-level horizontal scroll`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForSelector('.site__footer', { timeout: 15000 });

      const before = await page.evaluate(() => {
        const footer = document.querySelector('.site__footer')!;
        return {
          footerBottom: Math.round(footer.getBoundingClientRect().bottom),
          innerHeight: window.innerHeight,
          docHasHScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        };
      });
      expect(before.footerBottom).toBe(before.innerHeight);
      expect(before.docHasHScroll).toBe(false);

      // Scroll the inner content container (not the window — .site__body is
      // the single scroll container by design) and re-check: the footer must
      // stay pinned, not drift with scrolled content.
      const after = await page.evaluate(() => {
        const body = document.querySelector('.site__body')!;
        body.scrollTop = body.scrollHeight;
        const footer = document.querySelector('.site__footer')!;
        return {
          footerBottom: Math.round(footer.getBoundingClientRect().bottom),
          innerHeight: window.innerHeight,
        };
      });
      expect(after.footerBottom).toBe(after.innerHeight);
    });
  }

  test('mobile width (375px): footer still anchors, no page-level horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/?page=components', { waitUntil: 'networkidle' });
    await page.waitForSelector('.site__footer', { timeout: 15000 });

    const result = await page.evaluate(() => {
      const footer = document.querySelector('.site__footer')!;
      return {
        footerBottom: Math.round(footer.getBoundingClientRect().bottom),
        innerHeight: window.innerHeight,
        docHasHScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    expect(result.footerBottom).toBe(result.innerHeight);
    expect(result.docHasHScroll).toBe(false);
  });
});
