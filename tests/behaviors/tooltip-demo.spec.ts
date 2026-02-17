import { test, expect } from '@playwright/test';

test.describe('Tooltip Button Showcase', () => {
  test('shows tooltip on hover (top)', async ({ page }) => {
    await page.goto('http://localhost:3000/demos/tooltip-demo.html');
    const btn = page.locator('#btn-top');
    await btn.hover();
    const tooltip = page.locator('.wb-tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText('Tooltip text');
  });

  test('shows tooltip on hover (bottom)', async ({ page }) => {
    await page.goto('http://localhost:3000/demos/tooltip-demo.html');
    const btn = page.locator('#btn-bottom');
    await btn.hover();
    const tooltip = page.locator('.wb-tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText('Tooltip text');
  });

  test('shows tooltip on hover (left)', async ({ page }) => {
    await page.goto('http://localhost:3000/demos/tooltip-demo.html');
    const btn = page.locator('#btn-left');
    await btn.hover();
    const tooltip = page.locator('.wb-tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText('Tooltip text');
  });

  test('shows tooltip on hover (right)', async ({ page }) => {
    await page.goto('http://localhost:3000/demos/tooltip-demo.html');
    const btn = page.locator('#btn-right');
    await btn.hover();
    const tooltip = page.locator('.wb-tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText('Tooltip text');
  });
});
