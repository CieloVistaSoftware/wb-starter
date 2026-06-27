/**
 * doc-viewer: code blocks must not exceed the element/page width, and the
 * text-size control must change the doc text size (issue #147).
 */
import { test, expect } from '@playwright/test';

const URL = '/public/doc-viewer.html?file=%2Fdocs%2Fstandards%2FV3-STANDARDS.md';

test('code blocks do not overflow the page width', async ({ page }) => {
  await page.goto(URL);
  await page.waitForFunction(() => {
    const t = (document.getElementById('content')?.innerText || '');
    return t.length > 200 && !t.includes('Loading documentation');
  }, { timeout: 15000 });
  await page.waitForSelector('pre', { timeout: 10000 });

  // no horizontal page overflow
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'page should not scroll horizontally').toBeLessThanOrEqual(2);

  // every <pre> stays within its container
  const exceed = await page.evaluate(() => {
    const body = document.body.clientWidth;
    return Array.from(document.querySelectorAll('pre')).filter(p => p.getBoundingClientRect().width > body + 2).length;
  });
  expect(exceed, 'no <pre> wider than the body').toBe(0);
});

test('text-size control changes the doc text size', async ({ page }) => {
  await page.goto(URL);
  await page.waitForSelector('#text-larger', { timeout: 10000 });
  const base = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  await page.locator('#text-larger').click();
  await page.locator('#text-larger').click();
  const bigger = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  expect(bigger).toBeGreaterThan(base);
  await page.locator('#text-smaller').click();
  const smaller = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  expect(smaller).toBeLessThan(bigger);
  await page.locator('#text-reset').click();
  const reset = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  expect(Math.round(reset)).toBe(Math.round(base));
});
