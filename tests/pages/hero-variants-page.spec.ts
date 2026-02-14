import { test, expect } from '@playwright/test';

test.describe('Hero Variants Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/?page=hero-variants');
    // Wait for WB to initialize
    await page.waitForTimeout(500);
  });

  test('page loads successfully', async ({ page }) => {
    const hero = page.locator('.page__hero, #herovariants-section-1');
    await expect(hero).toBeVisible();
    await expect(page.locator('h1').first()).toContainText('Hero Variants');
  });

  test('renders all 12 hero variants', async ({ page }) => {
    // Check for specific variant classes or IDs
    const variants = [
      '.wb-hero:not([class*="--"])', // Default
      '.wb-hero--minimal',
      '.wb-hero--split',
      '.wb-hero--particles',
      '.wb-hero--diagonal',
      '.wb-hero--waves',
      '.wb-hero--grid',
      '.wb-hero--spotlight',
      '.wb-hero--aurora',
      '.wb-hero--mesh',
      '.wb-hero--card',
      '.wb-hero--cosmic'
    ];

    for (const selector of variants) {
      const variant = page.locator(selector);
      await expect(variant).toBeVisible();
    }
  });

  test('aurora variant has video', async ({ page }) => {
    const aurora = page.locator('.wb-hero--aurora');
    await expect(aurora).toBeVisible();
    const video = aurora.locator('video');
    await expect(video).toBeVisible();
    // Check for the animation style we added
    const style = await video.getAttribute('style');
    expect(style).toContain('animation: aurora-expand');
  });

  test('quick reference table exists', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible();
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(12);
  });
});
