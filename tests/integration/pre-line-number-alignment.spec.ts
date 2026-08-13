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

/**
 * #559: a wrapped-mode code panel (`wrap="true"`, or the forced wrap doc-viewer
 * pages apply via mdhtml.css) positions each line's gutter number by measuring
 * the rendered position of the character immediately after that line's real
 * `\n` (pre.js's measureAndPosition). When a line opens with indentation
 * whitespace (e.g. "  src=...") and the row is narrow enough (a long wrapped
 * attribute value, or an enlarged font-size), that leading whitespace run can
 * itself soft-wrap onto its own visual row -- landing the number next to an
 * empty-looking row while the line's real, visible content starts one row
 * below with no number of its own. Reads live as a phantom blank line in the
 * gutter, exactly matching the reported repro (docs/components/semantics/
 * audio.md's "With Bass/Treble Boost" sample, a long `src="https://…"` value).
 *
 * Forces the exact split deterministically: a 2-space-indented second line in
 * a `pre` clamped to a 2ch-wide content box, so " " + " " alone fills the
 * first row and the line's real content is guaranteed to wrap to the next.
 * The fix (skip leading whitespace when locating a line's measurement anchor)
 * means the gutter number must land on the row where the visible content
 * actually starts, not the blank whitespace-only row above it.
 */
test('pre.js line-number gutter: number tracks visible content, not leading whitespace that wraps onto its own row (#559)', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    const { pre } = await import('/src/wb-viewmodels/semantics/pre.js');

    const preEl = document.createElement('pre');
    const codeEl = document.createElement('code');
    // Line 2 opens with 2 leading spaces before its real content ("BBBB") --
    // the exact "  attr=..." shape that triggered #559.
    codeEl.textContent = 'AAAA\n  BBBB\nCCCC';
    preEl.appendChild(codeEl);
    document.body.appendChild(preEl);

    pre(preEl, { showLineNumbers: true, wrap: true });

    // Force the deterministic split described above: a monospace, 2-char-wide
    // content box means the 2 leading spaces exactly fill line 2's first row,
    // pushing "BBBB" onto the row below on its own.
    Object.assign(preEl.style, {
      fontFamily: 'monospace',
      fontSize: '16px',
      width: '2ch',
      maxWidth: '2ch',
    });

    // Wait for pre.js's double-rAF deferred measurement (+ a possible
    // ResizeObserver re-fire from the width override above) to settle.
    await new Promise((resolve) => {
      const gutter = preEl.parentElement.querySelector('.x-pre__line-numbers');
      const settle = () => {
        if (gutter.children[1] && gutter.children[1].style.top) {
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        } else {
          requestAnimationFrame(settle);
        }
      };
      settle();
    });

    const gutter = preEl.parentElement.querySelector('.x-pre__line-numbers');
    const line2Top = parseFloat(gutter.children[1].style.top);

    // Real rendered position of "BBBB"'s first character ('B') -- the
    // ground truth for where line 2's number SHOULD sit.
    const codeTextNode = codeEl.firstChild;
    const bIndex = codeTextNode.nodeValue.indexOf('BBBB');
    const range = document.createRange();
    range.setStart(codeTextNode, bIndex);
    range.setEnd(codeTextNode, bIndex + 1);
    const bRect = range.getClientRects()[0];
    const containerTop = preEl.getBoundingClientRect().top;
    const bTop = bRect.top - containerTop;

    return { line2Top, bTop };
  });

  expect(
    Math.abs(result.line2Top - result.bTop),
    `line 2's gutter number (top: ${result.line2Top}px) should sit on the same row as its visible content ("BBBB", top: ${result.bTop}px), not a blank leading-whitespace row above it`
  ).toBeLessThan(3);
});
