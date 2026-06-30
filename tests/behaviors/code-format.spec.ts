/**
 * Showcase code blocks must read like a code editor: lines preserved (no
 * mid-token wrapping), long lines scroll horizontally. (#199 / pre.js)
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.WB_BASE || 'http://localhost:3000';
const URL = `${BASE.replace(/\/$/, '')}/?page=behaviors`;

test('demo code blocks do not wrap/break tokens (editor style, horizontal scroll)', async ({ page }) => {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#mainPage-behaviors', { timeout: 25000 });
  await page.waitForTimeout(2800);

  const r = await page.evaluate(() => {
    const pre = document.querySelector('pre.x-pre, .x-pre-wrapper pre, .wb-demo__code') as HTMLElement;
    if (!pre) return null;
    const cs = getComputedStyle(pre);
    return { whiteSpace: cs.whiteSpace, overflowX: cs.overflowX, wordBreak: cs.wordBreak };
  });

  expect(r, 'no demo code block found').not.toBeNull();
  expect(r!.whiteSpace, `code wraps (white-space=${r!.whiteSpace}); should be pre`).toBe('pre');
  expect(['auto', 'scroll'], `code does not scroll horizontally (overflow-x=${r!.overflowX})`).toContain(r!.overflowX);
  expect(r!.wordBreak, `code breaks tokens (word-break=${r!.wordBreak})`).not.toBe('break-word');
});
