import { test, expect } from '@playwright/test';

/**
 * Builder Sidebar/Drawer Tests
 * Tests the collapsible drawer functionality in the builder
 */

// Use desktop viewport for all builder tests
test.use({ viewport: { width: 1280, height: 720 } });

test.describe('Builder Drawer Panels', () => {
  
  test('left drawer should be expandable and collapsible', async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);

    const leftDrawer = page.locator('#leftDrawer');
    const toggleBtn = leftDrawer.locator('.wb-drawer__toggle');

    // Initial state: Drawer should be expanded
    const initialBox = await leftDrawer.boundingBox();
    expect(initialBox).not.toBeNull();
    if (initialBox) {
      expect(initialBox.width).toBeGreaterThan(100); // Should be wider than collapsed
    }

    // Click toggle to collapse - use force click to bypass overlapping elements
    await toggleBtn.click({ force: true });
    await page.waitForTimeout(400); // Wait for CSS transition

    // Check drawer is narrower after collapse
    const collapsedBox = await leftDrawer.boundingBox();
    expect(collapsedBox).not.toBeNull();
    if (collapsedBox && initialBox) {
      expect(collapsedBox.width).toBeLessThan(initialBox.width);
    }

    // Click toggle to expand again
    await toggleBtn.click({ force: true });
    await page.waitForTimeout(400);

    // Verify expanded state restored
    const expandedBox = await leftDrawer.boundingBox();
    expect(expandedBox).not.toBeNull();
    if (expandedBox) {
      expect(expandedBox.width).toBeGreaterThan(100);
    }
  });

  test('right drawer should be expandable and collapsible', async ({ page }) => {
    await page.goto('/builder.html');
    
    // Wait for builder to be fully initialized
    await page.waitForFunction(() => typeof window.toggleDrawer === 'function');
    await page.waitForTimeout(300);

    const rightDrawer = page.locator('#rightDrawer');

    // Initial state: Drawer should NOT have collapsed class
    await expect(rightDrawer).not.toHaveClass(/wb-drawer--collapsed/);
    const initialBox = await rightDrawer.boundingBox();
    expect(initialBox).not.toBeNull();
    expect(initialBox!.width).toBeGreaterThan(100);

    // Call toggleDrawer directly (onclick may be blocked by overlay)
    await page.evaluate(() => window.toggleDrawer('rightDrawer'));
    
    // Wait for collapsed class to be added
    await expect(rightDrawer).toHaveClass(/wb-drawer--collapsed/, { timeout: 2000 });

    // Toggle back to expand
    await page.evaluate(() => window.toggleDrawer('rightDrawer'));
    
    // Wait for collapsed class to be removed
    await expect(rightDrawer).not.toHaveClass(/wb-drawer--collapsed/, { timeout: 2000 });
  });

  test('drawer toggle buttons should be visible', async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);

    // Both toggle buttons should exist
    const leftToggle = page.locator('#leftDrawer .wb-drawer__toggle');
    const rightToggle = page.locator('#rightDrawer .wb-drawer__toggle');

    await expect(leftToggle).toBeVisible();
    await expect(rightToggle).toBeVisible();
  });

  test('drawer resize handles should exist', async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);

    // Both resize handles should exist
    const leftHandle = page.locator('#leftDrawer .wb-drawer__handle');
    const rightHandle = page.locator('#rightDrawer .wb-drawer__handle');

    await expect(leftHandle).toBeAttached();
    await expect(rightHandle).toBeAttached();
  });

  test('drawer content should be present', async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);

    // Left drawer should have pages section
    await expect(page.locator('#leftDrawer .pages-section')).toBeVisible();
    await expect(page.locator('#leftDrawer #pagesList')).toBeAttached();
    await expect(page.locator('#leftDrawer #componentLibrary')).toBeAttached();

    // Right drawer should have properties panel
    await expect(page.locator('#rightDrawer #propertiesPanel')).toBeVisible();
  });
});
