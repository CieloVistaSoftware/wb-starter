/**
 * ScrollAlong Behavior Tests
 * Tests against the ACTUAL site layout to verify sticky nav works
 */
import { test, expect } from '../fixtures/offline';
import { wbIdle } from '../base';

test.describe('ScrollAlong Behavior - Standalone Test Page', () => {
  test.beforeEach(async ({ page }) => {
    // Load the standalone scrollalong test page
    await page.goto('/demos/scrollalong-test.html');
    await wbIdle(page);
  });

  test('nav element exists with scrollalong behavior', async ({ page }) => {
    const nav = page.locator('#testNav');
    await expect(nav).toHaveAttribute('x-scrollalong', '');
  });

  test('nav has [x-scrollalong] class applied', async ({ page }) => {
    const nav = page.locator('#testNav');
    await expect(nav).toHaveClass(/x-scrollalong/);
  });

  test('nav has sticky positioning applied', async ({ page }) => {
    const nav = page.locator('#testNav');
    // Wait for WB to apply the behavior
    await expect(nav).toHaveClass(/x-scrollalong/);
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
    // Nav should still be visible and near top of its container
    await expect(nav).toBeVisible();
    const scrolledBox = await nav.boundingBox();
    expect(scrolledBox).not.toBeNull();
    // Sticky pins the nav to the top of its SCROLL CONTAINER, not the
    // viewport. On this page #scrollContainer starts below a 200px spacer and
    // a 2rem margin (~233px down), so the old "y < 100" could only pass if
    // sticky were broken in some other way. Unstuck, 500px of scroll would
    // carry the nav ~500px above the container top.
    const containerBox = await scrollContainer.boundingBox();
    expect(scrolledBox!.y).toBeGreaterThanOrEqual(containerBox!.y);
    expect(scrolledBox!.y - containerBox!.y).toBeLessThan(10);
  });

  test('nav remains accessible after multiple scroll operations', async ({ page }) => {
    const nav = page.locator('#testNav');
    const scrollContainer = page.locator('#scrollContainer');
    // Scroll down
    await scrollContainer.evaluate(el => el.scrollTop = 800);
    await expect(nav).toBeVisible();
    // Scroll back up
    await scrollContainer.evaluate(el => el.scrollTop = 0);
    await expect(nav).toBeVisible();
    // Scroll down again
    await scrollContainer.evaluate(el => el.scrollTop = 1200);
    await expect(nav).toBeVisible();
  });

  test('nav items remain clickable after scrolling', async ({ page }) => {
    const nav = page.locator('#testNav');
    const scrollContainer = page.locator('#scrollContainer');
    // Scroll down
    await scrollContainer.evaluate(el => el.scrollTop = 600);
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
