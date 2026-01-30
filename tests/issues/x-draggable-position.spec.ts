/**
 * Test: x-draggable Position Stability
 * Issue: note-1769212201021-p0
 * Bug: Adding x-draggable changes element location even when not clicked
 * Expected: Element should stay in original position until user drags it
 */
import { test, expect } from '@playwright/test';

test.describe('x-draggable Position Stability', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
  });

  test('x-draggable should not move element on initialization', async ({ page }) => {
    await test.step('Create test element at known position (100, 100)', async () => {
      await page.evaluate(() => {
        const el = document.createElement('div');
        el.id = 'drag-test';
        el.style.cssText = 'position: absolute; left: 100px; top: 100px; width: 50px; height: 50px; background: blue;';
        el.textContent = 'Drag me';
        document.body.appendChild(el);
      });
    });

    await test.step('Record initial position', async () => {
      const initialPos = await page.evaluate(() => {
        const el = document.getElementById('drag-test');
        const rect = el.getBoundingClientRect();
        return { left: rect.left, top: rect.top };
      });
      expect(initialPos.left).toBe(100);
      expect(initialPos.top).toBe(100);
    });

    await test.step('Add x-draggable attribute and inject behavior', async () => {
      await page.evaluate(async () => {
        const el = document.getElementById('drag-test');
        if (el) {
          el.setAttribute('x-draggable', '');
          // Use inject for direct initialization (scan uses lazy IntersectionObserver)
          if (window.WB && window.WB.inject) {
            await window.WB.inject(el, 'draggable');
          }
        }
      });
      await page.waitForTimeout(500);
    });

    await test.step('Verify position unchanged after adding attribute', async () => {
      const newPos = await page.evaluate(() => {
        const el = document.getElementById('drag-test');
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { left: rect.left, top: rect.top };
      });
      
      expect(newPos).not.toBeNull();
      expect(Math.abs(newPos.left - 100)).toBeLessThan(2);
      expect(Math.abs(newPos.top - 100)).toBeLessThan(2);
    });
  });

  test('x-draggable element should only move when dragged', async ({ page }) => {
    await test.step('Create draggable element at (200, 200)', async () => {
      await page.evaluate(async () => {
        const el = document.createElement('div');
        el.id = 'drag-test-2';
        el.setAttribute('x-draggable', '');
        el.style.cssText = 'position: absolute; left: 200px; top: 200px; width: 80px; height: 80px; background: green; cursor: move;';
        el.textContent = 'Draggable';
        document.body.appendChild(el);
        // Use inject for direct initialization
        if (window.WB && window.WB.inject) {
          await window.WB.inject(el, 'draggable');
        }
      });
      await page.waitForTimeout(500);
    });

    await test.step('Verify element is visible and WB initialized', async () => {
      const el = page.locator('#drag-test-2');
      await expect(el).toBeVisible();
      // Check that WB added the draggable class
      await expect(el).toHaveClass(/wb-draggable/);
    });

    await test.step('Record initial position', async () => {
      const el = page.locator('#drag-test-2');
      const before = await el.boundingBox();
      expect(before).not.toBeNull();
    });

    await test.step('Perform drag operation with mouse events', async () => {
      const el = page.locator('#drag-test-2');
      const box = await el.boundingBox();
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;
      
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      // Move 100px total in increments (exceeds 36px threshold)
      for (let i = 1; i <= 10; i++) {
        await page.mouse.move(startX + i * 10, startY + i * 10);
      }
      await page.mouse.up();
      await page.waitForTimeout(100);
    });

    await test.step('Verify element moved after drag', async () => {
      const el = page.locator('#drag-test-2');
      const after = await el.boundingBox();
      expect(after).not.toBeNull();
      // Position should have changed (100px drag minus ~36px threshold = ~64px)
      expect(after.x).toBeGreaterThan(250);
    });
  });
});
