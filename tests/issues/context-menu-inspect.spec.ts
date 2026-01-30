/**
 * Test: Context Menu Inspect
 * Issue: note-1769194562447-p0
 * Bug: Right-clicking on element in canvas and picking inspect does nothing
 * Expected: Inspect should open element inspector/details panel
 */
import { test, expect } from '@playwright/test';

test.describe('Context Menu Inspect', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/builder.html');
    await page.waitForLoadState('networkidle');
  });

  test('right-click inspect should show element details', async ({ page }) => {
    await test.step('Navigate to builder page', async () => {
      await expect(page).toHaveURL(/builder/);
    });

    await test.step('Find canvas element', async () => {
      const canvas = page.locator('#builder-canvas, .builder-canvas, [data-canvas], .canvas');
      if (await canvas.count() === 0) {
        test.skip();
        return;
      }
      await expect(canvas.first()).toBeVisible();
    });

    await test.step('Right-click to open context menu', async () => {
      const canvas = page.locator('#builder-canvas, .builder-canvas, [data-canvas], .canvas').first();
      await canvas.click({ button: 'right' });
      await page.waitForTimeout(300);
    });

    await test.step('Verify context menu appears', async () => {
      const contextMenu = page.locator('[role="menu"], .context-menu, .dropdown-menu, .wb-context-menu');
      // Menu should appear (even if inspect is broken, menu should show)
      const menuVisible = await contextMenu.count() > 0;
      expect(menuVisible).toBe(true);
    });

    await test.step('Find and click Inspect option', async () => {
      const contextMenu = page.locator('[role="menu"], .context-menu, .dropdown-menu, .wb-context-menu');
      
      if (await contextMenu.count() > 0) {
        const inspectOption = contextMenu.locator('[data-action=inspect]').or(contextMenu.getByText(/inspect/i));
        
        if (await inspectOption.count() > 0) {
          await inspectOption.click();
          await page.waitForTimeout(500);
        }
      }
    });

    await test.step('Verify inspector panel opens', async () => {
      const inspector = page.locator('.inspector, .element-inspector, [data-inspector], .properties-panel, #inspector');
      const inspectorVisible = await inspector.count() > 0 && await inspector.first().isVisible();
      // This step documents what SHOULD happen - currently may fail
      expect(inspectorVisible).toBe(true);
    });
  });

  test('context menu should appear on right-click', async ({ page }) => {
    await test.step('Find canvas element', async () => {
      const canvas = page.locator('#builder-canvas, .builder-canvas, .canvas').first();
      if (await canvas.count() === 0) {
        test.skip();
        return;
      }
    });

    await test.step('Right-click on canvas', async () => {
      const canvas = page.locator('#builder-canvas, .builder-canvas, .canvas').first();
      await canvas.click({ button: 'right' });
      await page.waitForTimeout(300);
    });

    await test.step('Verify context menu appeared', async () => {
      const menu = page.locator('[role="menu"], .context-menu, .dropdown-menu');
      const menuAppeared = await menu.count() > 0;
      expect(menuAppeared).toBe(true);
    });

    await test.step('Close menu with Escape', async () => {
      await page.keyboard.press('Escape');
    });
  });
});
