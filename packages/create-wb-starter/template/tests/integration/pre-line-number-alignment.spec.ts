import { test, expect } from '@playwright/test';

/**
 * #298: pre.js's line-number gutter positioned line 1 with a hardcoded
 * `top: 0px`, while every other line was measured via a zero-width `Range`
 * against the actual rendered text position. That special case ignored the
 * <pre>'s own padding-top (1rem/1.5rem/2rem depending on whether a language
 * badge/copy button is present), so line 1's number sat above where the
 * first code line actually paints while lines 2+ lined up correctly. The
 * code fix (measureAndPosition() in src/wb-viewmodels/semantics/pre.js) was
 * already committed (f8219e9) but shipped with no automated regression test
 * — this is that test.
 *
 * Rather than re-deriving each line's rendered position via an independent
 * Range/TreeWalker pass (which raced against the syntax-highlighter
 * mutating text nodes after pre.js's own measurement, producing flaky
 * results), this asserts the two properties the bug actually broke:
 *   1. Line 1's gutter number sits at (approximately) the <pre>'s own
 *      padding-top, not 0px — the exact regression described in the issue.
 *   2. The gap between every consecutive pair of gutter numbers is uniform
 *      (matches the code's line-height) — confirming line 1 isn't just
 *      "close to right" but in the same uniform sequence as lines 2+.
 */
test('pre.js line-number gutter: line 1 accounts for padding-top, all lines evenly spaced (#298)', async ({ page }) => {
  // demos/behaviors-showcase.html was retired in favor of the SPA route.
  await page.goto('/?page=behaviors', { waitUntil: 'networkidle' });

  // pre.js positions the gutter async (double-rAF, plus a ResizeObserver that
  // can re-fire). Wait until two consecutive animation frames report the same
  // top for the first gutter row before measuring, so this test isn't racing
  // pre.js's own in-flight layout pass.
  await page.waitForFunction(() => {
    const gutter = document.querySelector('.x-pre__line-numbers');
    if (!gutter || !gutter.children[0]) return false;
    const readTop = () => gutter.children[0].style.top;
    const first = readTop();
    if (!first) return false;
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(readTop() === first)));
    });
  }, { timeout: 10000 });

  const result = await page.evaluate(() => {
    const gutter = document.querySelector('.x-pre__line-numbers');
    if (!gutter) return { error: 'no .x-pre__line-numbers gutter found on page' };
    // pre.js wraps the gutter + the real <pre> in its own plain div — the
    // padding-top that matters is on the <pre> itself, not that wrapper.
    const pre = gutter.parentElement.querySelector('pre') || gutter.nextElementSibling;
    if (!pre) return { error: 'could not locate the <pre> sibling of the gutter' };
    const paddingTop = parseFloat(getComputedStyle(pre).paddingTop) || 0;
    const gutterTops = [...gutter.children].map((el) => parseFloat(el.style.top));
    return { paddingTop, gutterTops };
  });

  expect(result.error, result.error).toBeUndefined();
  expect(result.gutterTops.length).toBeGreaterThanOrEqual(2);

  // Regression check: line 1 must NOT be 0px (the old hardcoded bug value)
  // when the <pre> has real padding-top, and must be close to that padding.
  expect(result.paddingTop).toBeGreaterThan(0);
  expect(
    Math.abs(result.gutterTops[0] - result.paddingTop),
    `line 1 top (${result.gutterTops[0]}px) should match <pre>'s padding-top (${result.paddingTop}px), not sit above it`
  ).toBeLessThan(3);

  // Every consecutive gap (including line 1 -> line 2) should be uniform.
  const gaps = result.gutterTops.slice(1).map((top, i) => top - result.gutterTops[i]);
  const firstGap = gaps[0];
  gaps.forEach((gap, i) => {
    expect(
      Math.abs(gap - firstGap),
      `gap between line ${i + 1} and line ${i + 2} (${gap}px) should match the other gaps (${firstGap}px)`
    ).toBeLessThan(3);
  });
});
