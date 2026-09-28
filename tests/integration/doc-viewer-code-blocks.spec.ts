import { test, expect } from '../fixtures/offline';

/**
 * Standard §6: doc-viewer code blocks never wrap -- a long line scrolls inside
 * its own code block instead.
 *
 * This used to assert the opposite (every <pre> `white-space: pre-wrap`, no
 * block may scroll), from #248's "no horizontal scrollbars on code". §6 was
 * reversed since (#583/#589, John: "CODE TEXT CANNOT WRAP EVER"): no code text
 * wraps anywhere, long lines get `white-space: pre` + `overflow-x: auto` --
 * pre.css's own editor-style default (pre.js defaultWrap=false, #199). The
 * product follows the new rule, so the old assertion failed on every block.
 *
 * What still has to hold: line breaks are preserved (guarded separately by
 * doc-viewer-code-multiline.spec.ts), and a block wider than its box scrolls
 * inside that box rather than pushing the page sideways.
 */
test('doc-viewer code blocks never wrap; long lines scroll inside the block (§6)', async ({ page }) => {
  await page.goto('/public/doc-viewer.html?file=docs/V3-GUIDE.md', { waitUntil: 'domcontentloaded' });
  // Wait for the render to FINISH, not start: highlighting is the last step
  // of doc-viewer's wb:mdhtml:loaded handler, and until then the blocks are
  // bare <pre> without their JIT-loaded stylesheets (#342), so neither their
  // white-space nor their overflow is final yet.
  await page.waitForFunction(() => {
    const blocks = Array.from(document.querySelectorAll('#content pre code'));
    return blocks.length > 0 && blocks.every((b) => b.classList.contains('hljs'));
  }, { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);

  const r = await page.evaluate(() => {
    const pres = Array.from(document.querySelectorAll('#content pre')) as HTMLElement[];
    const overflowing = pres.filter((p) => p.scrollWidth > p.clientWidth + 2);
    return {
      count: pres.length,
      wrapping: pres.filter((p) => getComputedStyle(p).whiteSpace !== 'pre').map((p) => p.className),
      overflowing: overflowing.length,
      unscrollable: overflowing
        .filter((p) => !['auto', 'scroll'].includes(getComputedStyle(p).overflowX))
        .map((p) => p.className),
    };
  });

  expect(r.count, 'expected code blocks in the doc').toBeGreaterThan(0);
  expect(r.wrapping, 'code blocks must not wrap (white-space: pre)').toEqual([]);
  // A long line is expected somewhere in this guide -- it is what makes the
  // scroll check below mean anything.
  expect(r.overflowing, 'expected at least one code line longer than its block').toBeGreaterThan(0);
  expect(r.unscrollable, 'a code block wider than its box must scroll inside it (overflow-x: auto)').toEqual([]);
});
