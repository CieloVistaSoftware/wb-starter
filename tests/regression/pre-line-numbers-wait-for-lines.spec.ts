import { test, expect } from '../fixtures/offline';

/**
 * CI, doc-viewer-code-panel-audit on docs/guides/create-a-website.md: every
 * gap between line numbers measured 0.0px. pre.js measured the gutter before
 * the code was laid out as separate lines, so every line read the same top,
 * and it still marked each number .x-pre__line-number--placed -- the signal
 * x-demo and the specs wait on -- with all of them stacked on line 1.
 *
 * Multi-line code never puts every line on one row, so that measurement is
 * "not laid out yet", not a position. Reproduced here by holding the block on
 * one row (white-space: normal) and then letting it lay out.
 */
test('line numbers are not marked placed while the code is still on one row', async ({ page }) => {
  await page.goto('/?page=about');
  await page.waitForFunction(() => (window as any).WBSite?.currentPage === 'about');

  const early = await page.evaluate(async () => {
    const WB = (window as any).WB;
    const pre = document.createElement('pre');
    pre.id = 'one-row-pre';
    pre.setAttribute('x-pre', '');
    pre.textContent = 'first line\nsecond line\nthird line';
    // Hold the code on one row, the state CI measured in.
    pre.style.setProperty('white-space', 'normal', 'important');
    document.getElementById('main')!.prepend(pre);
    await WB.scan(pre.parentElement, { eager: true });
    for (let i = 0; i < 6; i++) await new Promise((r) => requestAnimationFrame(r));
    const wrapper = pre.closest('.x-pre__wrapper')!;
    return {
      numbers: wrapper.querySelectorAll('.x-pre__line-numbers > div').length,
      placed: wrapper.querySelectorAll('.x-pre__line-number--placed').length,
    };
  });
  expect(early.numbers, 'the pre behavior did not build a gutter, so this proves nothing').toBe(3);
  expect(early.placed, 'numbers were marked placed while every line sat on one row').toBe(0);

  // Let it lay out as lines: now every number is placed, each on its own line.
  await page.evaluate(() => document.getElementById('one-row-pre')!.style.removeProperty('white-space'));
  await page.waitForFunction(() =>
    document.getElementById('one-row-pre')!.closest('.x-pre__wrapper')!
      .querySelectorAll('.x-pre__line-number--placed').length === 3);
  const tops = await page.evaluate(() => {
    const wrapper = document.getElementById('one-row-pre')!.closest('.x-pre__wrapper')!;
    return Array.from(wrapper.querySelectorAll('.x-pre__line-numbers > div')).map((n) => Math.round(n.getBoundingClientRect().top));
  });
  expect(new Set(tops).size, `line numbers stacked: ${tops.join(', ')}`).toBe(3);
});
