/**
 * Showcase code blocks must read like a code editor: lines preserved (no
 * mid-token wrapping), long lines scroll horizontally. (#199 / pre.js)
 * Checks EVERY code block, fresh load (no cache).
 */
import { test, expect } from '../fixtures/offline';

const BASE = process.env.WB_BASE || '';
const URL = `${BASE.replace(/\/$/, '')}/?page=behaviors`;

test('NO demo code block wraps/breaks tokens (editor style, horizontal scroll)', async ({ page }) => {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#mainPage-behaviors', { timeout: 25000 });
  // The page builds its code panels only once the preselected example (#771)
  // has rendered. A fixed 3s sleep found "no code blocks" whenever the run was
  // under load; wait for the panel's own finished state instead, then for the
  // other panels to join it.
  await page.waitForSelector('#behaviors-live-code pre code.hljs', { timeout: 30000 });
  await expect.poll(
    () => page.locator('pre.x-pre, .x-pre-wrapper pre, pre.x-demo__code').count(),
    { timeout: 15000 },
  ).toBeGreaterThan(3);

  const blocks = await page.evaluate(() => {
    const pres = [...document.querySelectorAll('pre.x-pre, .x-pre-wrapper pre, pre.x-demo__code')];
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
