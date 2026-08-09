/**
 * Showcase code blocks must read like a code editor: lines preserved (no
 * mid-token wrapping), long lines scroll horizontally. (#199 / pre.js)
 * Checks EVERY code block, fresh load (no cache).
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.WB_BASE || 'http://localhost:3000';
const URL = `${BASE.replace(/\/$/, '')}/?page=behaviors`;

test('NO demo code block wraps/breaks tokens (editor style, horizontal scroll)', async ({ page }) => {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#mainPage-behaviors', { timeout: 25000 });
  await page.waitForTimeout(3000);

  const blocks = await page.evaluate(() => {
    const pres = [...document.querySelectorAll('pre.x-pre, .x-pre-wrapper pre, pre.wb-demo__code')];
    return pres.map((p, i) => {
      const cs = getComputedStyle(p as HTMLElement);
      return { i, whiteSpace: cs.whiteSpace, overflowX: cs.overflowX, wordBreak: cs.wordBreak };
    });
  });

  expect(blocks.length, 'no code blocks found').toBeGreaterThan(3);
  const wrappers = blocks.filter((b) => b.whiteSpace !== 'pre');
  const breakers = blocks.filter((b) => b.wordBreak === 'break-word');
  expect(
    wrappers,
    `${wrappers.length}/${blocks.length} code blocks still wrap (white-space != pre): ${JSON.stringify(wrappers.slice(0, 3))}`
  ).toEqual([]);
  expect(
    breakers,
    `${breakers.length}/${blocks.length} code blocks break tokens (word-break: break-word)`
  ).toEqual([]);
});
