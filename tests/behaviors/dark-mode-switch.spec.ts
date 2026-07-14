/**
 * The Dark Mode switch (<wb-switch theme-control>) must drive the page theme:
 * ON = dark, OFF = light. (#210)
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.WB_BASE || 'http://localhost:3000';
const URL = `${BASE.replace(/\/$/, '')}/?page=behaviors`;

test('Dark Mode switch toggles data-theme between dark and light', async ({ page }) => {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[x-switch][theme-control]', { timeout: 25000 });
  await page.waitForTimeout(2000);

  const r = await page.evaluate(async () => {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'dark');
    const sw = document.querySelector('[x-switch][theme-control]') as HTMLElement;
    const inp = sw.querySelector('input') as HTMLInputElement;
    // re-sync initial state to current theme
    inp.checked = true;

    const start = root.getAttribute('data-theme');
    sw.click(); // -> off -> light
    await new Promise((r) => setTimeout(r, 120));
    const afterOff = root.getAttribute('data-theme');
    sw.click(); // -> on -> dark
    await new Promise((r) => setTimeout(r, 120));
    const afterOn = root.getAttribute('data-theme');
    return { start, afterOff, afterOn };
  });

  expect(r.afterOff, `turning Dark Mode OFF did not switch to light (got ${r.afterOff})`).toBe('light');
  expect(r.afterOn, `turning Dark Mode ON did not switch to dark (got ${r.afterOn})`).toBe('dark');
});
