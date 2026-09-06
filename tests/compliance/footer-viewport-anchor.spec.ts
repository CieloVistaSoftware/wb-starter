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
  // #1020: the second case used to be `/?page=behaviors`, picked for being long
  // and full of code blocks. That page no longer has a footer at all — John,
  // arrow drawn on it: "remove this" — so the case moved to What's New, which is
  // longer (11091px of content) and carries more code (481 elements) than the
  // behaviors page ever did, and therefore tests the same two original bugs
  // better. The exemption is asserted below rather than merely tolerated, so a
  // footer going missing from any OTHER page still fails.
  const PAGES = [
    { url: '/', label: 'home (short content)' },
    { url: '/?page=whats-new', label: "what's new (long content, code blocks)" },
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
    // #1020: was `/?page=behaviors` — see the note on PAGES above.
    await page.goto('/?page=whats-new', { waitUntil: 'networkidle' });
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

  /**
   * #1020 — the one page that deliberately has no footer.
   *
   * The behaviors page is a workspace, not a document: two panels that fill the
   * window and scroll internally. John, arrow on the footer: "remove this". Its
   * 85px of copyright and social links were competing with the tool for the
   * bottom of the screen, and were the last thing forcing .site__body to scroll
   * on that page, which is what produced the second scrollbar he also drew an
   * arrow at.
   *
   * Asserted, not just skipped: if the exemption is ever removed the rule above
   * applies again, and if the footer vanishes from some OTHER page the rest of
   * this file still catches it. A page dropping out of a compliance sweep with
   * no assertion left behind is how a rule quietly stops being enforced.
   */
  test('the behaviors workspace has no footer, by design', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/?page=behaviors', { waitUntil: 'networkidle' });
    await page.waitForSelector('#behaviors-workspace', { timeout: 15000 });

    const state = await page.evaluate(() => {
      const footer = document.querySelector('.site__footer');
      const body = document.querySelector('.site__body') as HTMLElement;
      return {
        footerExists: !!footer,
        footerHidden: footer ? getComputedStyle(footer).display === 'none' : false,
        // The point of hiding it: the workspace fills the window and only the
        // panels scroll.
        outerScrolls: body.scrollHeight > body.clientHeight + 1,
      };
    });

    expect(state.footerExists, 'the shell footer element should still be in the DOM').toBe(true);
    expect(
      state.footerHidden,
      'the behaviors page footer is visible again — either the #1020 rule was '
      + 'dropped from behaviors.css, or this exemption is no longer wanted, in '
      + 'which case put /?page=behaviors back in PAGES above.',
    ).toBe(true);
    expect(
      state.outerScrolls,
      'the outer container is scrolling again, which is the two-scrollbars state '
      + 'from #1020.',
    ).toBe(false);
  });
});
