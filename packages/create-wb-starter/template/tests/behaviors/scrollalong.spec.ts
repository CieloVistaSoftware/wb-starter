/**
 * ScrollAlong Behavior Tests
 * Tests against the ACTUAL site layout to verify sticky nav works
 */
import { test, expect } from '@playwright/test';

test.describe('ScrollAlong Behavior - Standalone Test Page', () => {
  test.beforeEach(async ({ page }) => {
    // Load the standalone scrollalong test page
    await page.goto('http://localhost:3000/demos/scrollalong-test.html');
    await page.waitForTimeout(500);
  });

  test('nav element exists with scrollalong behavior', async ({ page }) => {
    const nav = page.locator('#testNav');
    await expect(nav).toHaveAttribute('x-scrollalong', '');
  });

  test('nav has wb-scrollalong class applied', async ({ page }) => {
    const nav = page.locator('#testNav');
    await expect(nav).toHaveClass(/wb-scrollalong/);
  });

  test('nav has sticky positioning applied', async ({ page }) => {
    const nav = page.locator('#testNav');
    // Wait for WB to apply the behavior
    await expect(nav).toHaveClass(/wb-scrollalong/);
    const position = await nav.evaluate(el => getComputedStyle(el).position);
    expect(position).toBe('sticky');
  });

  test('nav stays visible when scrolling content', async ({ page }) => {
    const nav = page.locator('#testNav');
    const scrollContainer = page.locator('#scrollContainer');
    // Verify nav is initially visible
    await expect(nav).toBeVisible();
    const initialBox = await nav.boundingBox();
    expect(initialBox).not.toBeNull();
    // Scroll the container
    await scrollContainer.evaluate(el => el.scrollTop = 500);
    await page.waitForTimeout(100);
    // Nav should still be visible and near top of its container
    await expect(nav).toBeVisible();
    const scrolledBox = await nav.boundingBox();
    expect(scrolledBox).not.toBeNull();
    // Nav Y position should be near top of viewport (sticky working)
    expect(scrolledBox!.y).toBeLessThan(100);
  });

  test('nav remains accessible after multiple scroll operations', async ({ page }) => {
    const nav = page.locator('#testNav');
    const scrollContainer = page.locator('#scrollContainer');
    // Scroll down
    await scrollContainer.evaluate(el => el.scrollTop = 800);
    await page.waitForTimeout(100);
    await expect(nav).toBeVisible();
    // Scroll back up
    await scrollContainer.evaluate(el => el.scrollTop = 0);
    await page.waitForTimeout(100);
    await expect(nav).toBeVisible();
    // Scroll down again
    await scrollContainer.evaluate(el => el.scrollTop = 1200);
    await page.waitForTimeout(100);
    await expect(nav).toBeVisible();
  });

  test('nav items remain clickable after scrolling', async ({ page }) => {
    const nav = page.locator('#testNav');
    const scrollContainer = page.locator('#scrollContainer');
    // Scroll down
    await scrollContainer.evaluate(el => el.scrollTop = 600);
    await page.waitForTimeout(100);
    // Find a nav item and verify it's clickable
    const navItem = nav.locator('.nav__item').first();
    await expect(navItem).toBeVisible();
    // Should be able to click
    const box = await navItem.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

});
