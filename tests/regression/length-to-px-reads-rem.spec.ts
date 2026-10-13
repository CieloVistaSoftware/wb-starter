import { test, expect } from '../fixtures/offline';

/**
 * src/core/length-to-px.js — a CSS length as px, for drags and clamps (#294).
 *
 * Sizes are rem now (Law 19), and the sheet's resize clamp, the notes drawer's
 * minimum and stagelight's radius cap all did `parseInt(config.minWidth)`.
 * On '12.5rem' that is 12: a 200px minimum became a 12px one with no error.
 * These checks pin the conversion each of them now goes through, at the
 * default root and at the phones' larger one.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/fixtures/blank.html');
});

test('rem reads against the root font size, px and bare numbers as px', async ({ page }) => {
  const r = await page.evaluate(async () => {
    const { lengthToPx } = await import('/src/core/length-to-px.js');
    const at16 = [lengthToPx('12.5rem'), lengthToPx('200px'), lengthToPx('200'), lengthToPx(200), lengthToPx('18.75rem', 300)];
    document.documentElement.style.fontSize = '18px';
    const at18 = [lengthToPx('12.5rem'), lengthToPx('200px')];
    document.documentElement.style.fontSize = '';
    return { at16, at18 };
  });
  expect(r.at16, '12.5rem must be 200px at a 16px root, not parseInt\'s 12').toEqual([200, 200, 200, 200, 300]);
  expect(r.at18, 'rem follows the root; px does not').toEqual([225, 200]);
});

test('em reads against the element; anything without a px value is the fallback', async ({ page }) => {
  const r = await page.evaluate(async () => {
    const { lengthToPx } = await import('/src/core/length-to-px.js');
    const host = document.createElement('div');
    host.style.fontSize = '20px';
    document.body.append(host);
    const out = [lengthToPx('2em', 0, host), lengthToPx('50%', 300), lengthToPx('', 7), lengthToPx('wide', 9), lengthToPx(undefined, 5)];
    host.remove();
    return out;
  });
  expect(r).toEqual([40, 300, 7, 9, 5]);
});
