import { test, expect } from '@playwright/test';

/**
 * demos/frameworks.html: "this code layout is not right". The
 * `pre[language]` rule's own comment said "vertical (one line per line, no
 * wrap → scroll)" but the actual CSS did the opposite: `overflow-x: hidden`
 * + `white-space: pre-wrap` + `overflow-wrap: anywhere` -- long code lines
 * wrapped instead of scrolling, and `anywhere` breaks at ANY character once
 * a line nears the edge, including mid-identifier (same class of bug as the
 * inline <code> tag-chip mid-hyphen wrap fixed earlier this session).
 *
 * Fixed to match the comment's own stated intent and this project's other
 * scrollable-block-code convention (code.js): `white-space: pre` (never
 * wraps) + `overflow-x: auto` (a genuinely long line scrolls horizontally
 * within its own box instead of breaking).
 */

test('demos/frameworks.html: code blocks never wrap mid-line, scroll horizontally instead', async ({ page }) => {
  await page.goto('/demos/frameworks.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  const pres = page.locator('pre[language]');
  const count = await pres.count();
  expect(count).toBeGreaterThanOrEqual(5);

  for (let i = 0; i < count; i++) {
    const pre = pres.nth(i);
    const style = await pre.evaluate((el) => ({
      whiteSpace: getComputedStyle(el).whiteSpace,
      overflowX: getComputedStyle(el).overflowX,
    }));
    expect(style.whiteSpace, `pre[language] #${i} must never wrap`).toBe('pre');
    expect(style.overflowX, `pre[language] #${i} must scroll horizontally instead of wrapping`).toBe('auto');

    // Rendered visual line count should track the declared \n count with
    // only a small, constant offset from the block's own fixed padding --
    // not vary with content length, which would indicate lines are still
    // wrapping.
    const { declaredLines, visualLines } = await pre.evaluate((el) => {
      const code = el.querySelector('code')!;
      const lines = (code.textContent || '').split('\n').length;
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
      return { declaredLines: lines, visualLines: el.getBoundingClientRect().height / lineHeight };
    });
    expect(visualLines - declaredLines, `pre[language] #${i} should not have extra wrapped lines`).toBeLessThan(6);
  }

  // The page itself must never grow past its own declared max-width from a
  // long unwrapped code line -- each pre's own overflow-x:auto must contain
  // the scroll, not the whole page.
  const overflow = await page.evaluate(() => document.body.scrollWidth > document.body.clientWidth + 2);
  expect(overflow, 'page must not have horizontal overflow from code blocks').toBe(false);
});
