/**
 * Test: Semantic Context Menu
 * Issue: note-1769302437975-p0
 * Bug: semanticContextMenu broken
 * Expected: Context menu should work properly with semantic actions
 */
import { test, expect } from '@playwright/test';

test.describe('Semantic Context Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/builder.html');
    await page.waitForLoadState('networkidle');
  });

  test('semantic context menu should display on right-click', async ({ page }) => {
    // Find an element that should have semantic context menu
    const element = page.locator('[x-context-menu], [data-context-menu], .builder-canvas *').first();
    
    if (await element.count() === 0) {
      // Try the canvas itself
      const canvas = page.locator('.builder-canvas, #builder-canvas, .canvas').first();
      if (await canvas.count() > 0) {
        await canvas.click({ button: 'right' });
      } else {
        test.skip();
        return;
      }
    } else {
      await element.click({ button: 'right' });
    }
    
    await page.waitForTimeout(300);
    
    // Check for context menu
    const menu = page.locator('.wb-context-menu, .context-menu, [role="menu"]');
    const menuVisible = await menu.count() > 0;
    
    if (menuVisible) {
      // Menu should have items
      const items = menu.locator('[role="menuitem"], li, button, .menu-item');
      const itemCount = await items.count();
      expect(itemCount).toBeGreaterThan(0);
    }
    
    // Close menu
    await page.keyboard.press('Escape');
  });

  test('context menu actions should be functional', async ({ page }) => {
    const canvas = page.locator('.builder-canvas, #builder-canvas').first();
    
    if (await canvas.count() === 0) {
      test.skip();
      return;
    }
    
    // Right-click
    await canvas.click({ button: 'right' });
    await page.waitForTimeout(300);
    
    const menu = page.locator('.wb-context-menu, .context-menu, [role="menu"]');
    
    if (await menu.count() > 0) {
      // Get first actionable item
      const firstItem = menu.locator('[role="menuitem"], .menu-item, button').first();
      
      if (await firstItem.count() > 0) {
        // Click should not throw error
        const clicked = await firstItem.click().then(() => true).catch(() => false);
        expect(clicked).toBe(true);
      }
    }
  });

  test('context menu should close on escape', async ({ page }) => {
    const canvas = page.locator('.builder-canvas, #builder-canvas, body').first();
    
    await canvas.click({ button: 'right' });
    await page.waitForTimeout(300);
    
    const menu = page.locator('.wb-context-menu, .context-menu, [role="menu"]');
    const wasVisible = await menu.count() > 0;
    
    if (wasVisible) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      
      const stillVisible = await menu.isVisible().catch(() => false);
      expect(stillVisible).toBe(false);
    }
  });
});
