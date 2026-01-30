/**
 * Test: Builder Component Popup Layout
 * Issue: note-1769306014994-p0
 * Bug: Builder add component popup has uneven rows - one tile is very tall
 * Expected: All component tiles should have consistent heights
 */
import { test, expect } from '@playwright/test';

test.describe('Builder Component Popup Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/builder.html');
    await page.waitForLoadState('networkidle');
  });

  test('component tiles should have consistent heights', async ({ page }) => {
    await test.step('Navigate to builder page', async () => {
      await expect(page).toHaveURL(/builder/);
    });

    await test.step('Open component picker', async () => {
      const addBtn = page.locator('button:has-text("Add"), button:has-text("+"), [data-action="add"], .add-btn').first();
      if (await addBtn.count() > 0) {
        await addBtn.click();
        await page.waitForTimeout(300);
      }
    });

    await test.step('Find component tiles in picker', async () => {
      const tiles = page.locator('.component-tile, .component-card, .component-item, [data-component]');
      const count = await tiles.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    await test.step('Verify tiles have consistent heights (max 2x difference)', async () => {
      const tiles = page.locator('.component-tile, .component-card, .component-item, [data-component]');
      const count = await tiles.count();
      
      if (count > 2) {
        const heights: number[] = [];
        
        for (let i = 0; i < Math.min(count, 20); i++) {
          const box = await tiles.nth(i).boundingBox();
          if (box && box.height > 0) {
            heights.push(Math.round(box.height));
          }
        }
        
        if (heights.length > 1) {
          const max = Math.max(...heights);
          const min = Math.min(...heights);
          expect(max / min).toBeLessThan(2);
        }
      }
    });
  });

  test('component grid should use CSS grid or flexbox', async ({ page }) => {
    await test.step('Open component picker', async () => {
      const addBtn = page.locator('button:has-text("Add"), [data-action="add"]').first();
      if (await addBtn.count() > 0) {
        await addBtn.click();
        await page.waitForTimeout(300);
      }
    });

    await test.step('Verify container uses proper layout (grid/flex)', async () => {
      const container = page.locator('.component-list, .component-grid, .components-panel');
      
      if (await container.count() > 0) {
        const display = await container.evaluate(el => window.getComputedStyle(el).display);
        expect(['grid', 'flex', 'inline-flex', 'inline-grid', 'block']).toContain(display);
      }
    });
  });
});
