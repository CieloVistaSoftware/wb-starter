import { test, expect } from '@playwright/test';

/**
 * Builder Layout Constraints Tests
 * Ensures builder content respects container boundaries
 */

// Use desktop viewport for all builder tests
test.use({ viewport: { width: 1280, height: 720 } });

test.describe('Builder Layout Constraints', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);
  });

  test('canvas sections should fit within canvas area', async ({ page }) => {
    const canvasArea = page.locator('.canvas-area');
    const canvasAreaBox = await canvasArea.boundingBox();
    expect(canvasAreaBox).toBeTruthy();

    if (!canvasAreaBox) return;

    // Check each canvas section fits within canvas area
    const sections = ['.canvas-section.header', '.canvas-section.main', '.canvas-section.footer'];
    
    for (const selector of sections) {
      const section = page.locator(selector);
      const sectionBox = await section.boundingBox();
      
      if (sectionBox) {
        // Section should be within canvas area horizontally
        expect(sectionBox.x).toBeGreaterThanOrEqual(canvasAreaBox.x - 1);
        expect(sectionBox.x + sectionBox.width).toBeLessThanOrEqual(canvasAreaBox.x + canvasAreaBox.width + 1);
      }
    }
  });

  test('component containers should not overflow', async ({ page }) => {
    const containers = ['#header-container', '#main-container', '#footer-container'];
    
    for (const selector of containers) {
      const container = page.locator(selector);
      
      const overflowState = await container.evaluate((el) => {
        return {
          isScrollable: el.scrollWidth > el.clientWidth,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth
        };
      });
      
      // Container should not have horizontal overflow
      expect(overflowState.scrollWidth).toBeLessThanOrEqual(overflowState.clientWidth + 1);
    }
  });

  test('left drawer should not overlap canvas', async ({ page }) => {
    const leftDrawer = page.locator('#leftDrawer');
    const canvasArea = page.locator('.canvas-area');
    
    const drawerBox = await leftDrawer.boundingBox();
    const canvasBox = await canvasArea.boundingBox();
    
    expect(drawerBox).toBeTruthy();
    expect(canvasBox).toBeTruthy();
    
    if (drawerBox && canvasBox) {
      // Left drawer should be to the left of canvas
      expect(drawerBox.x + drawerBox.width).toBeLessThanOrEqual(canvasBox.x + 5);
    }
  });

  test('right drawer should not overlap canvas', async ({ page }) => {
    const rightDrawer = page.locator('#rightDrawer');
    const canvasArea = page.locator('.canvas-area');
    
    const drawerBox = await rightDrawer.boundingBox();
    const canvasBox = await canvasArea.boundingBox();
    
    expect(drawerBox).toBeTruthy();
    expect(canvasBox).toBeTruthy();
    
    if (drawerBox && canvasBox) {
      // Right drawer should be to the right of canvas
      expect(canvasBox.x + canvasBox.width).toBeLessThanOrEqual(drawerBox.x + 5);
    }
  });

  test('builder layout should use flexbox', async ({ page }) => {
    const builderLayout = page.locator('.builder-layout');
    
    const display = await builderLayout.evaluate(el => getComputedStyle(el).display);
    expect(display).toBe('flex');
  });

  test('top bar should span full width', async ({ page }) => {
    const topBar = page.locator('.top-bar');
    const body = page.locator('body');
    
    const topBarBox = await topBar.boundingBox();
    const bodyBox = await body.boundingBox();
    
    expect(topBarBox).toBeTruthy();
    expect(bodyBox).toBeTruthy();
    
    if (topBarBox && bodyBox) {
      // Top bar should be nearly full width (accounting for scrollbar)
      expect(topBarBox.width).toBeGreaterThan(bodyBox.width * 0.95);
    }
  });

  test('status bar should exist and be visible', async ({ page }) => {
    const statusBar = page.locator('.status-bar');
    await expect(statusBar).toBeVisible();
    
    const statusBarBox = await statusBar.boundingBox();
    expect(statusBarBox).toBeTruthy();
    
    if (statusBarBox) {
      // Status bar should have reasonable dimensions
      expect(statusBarBox.height).toBeGreaterThan(20);
      expect(statusBarBox.width).toBeGreaterThan(100);
    }
  });
});
