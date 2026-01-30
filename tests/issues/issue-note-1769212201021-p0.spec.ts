/**
 * Issue Test: note-1769212201021-p0
 * BUG: Adding x-draggable changes element location even when not clicked
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769212201021-p0: x-draggable Changes Position On Init', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
  });

  test('adding x-draggable should NOT change element position', async ({ page }) => {
    // Create a positioned element
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-draggable';
      el.style.cssText = 'position: absolute; top: 100px; left: 200px; width: 100px; height: 50px; background: blue;';
      el.textContent = 'Drag Me';
      document.body.appendChild(el);
    });
    
    const element = page.locator('#test-draggable');
    await expect(element).toBeVisible();
    
    // Get position BEFORE adding x-draggable
    const posBefore = await element.boundingBox();
    expect(posBefore).not.toBeNull();
    
    // Add x-draggable attribute
    await page.evaluate(() => {
      const el = document.getElementById('test-draggable');
      if (el) el.setAttribute('x-draggable', '');
    });
    
    // Wait for behavior to initialize
    await page.waitForTimeout(200);
    
    // Get position AFTER adding x-draggable
    const posAfter = await element.boundingBox();
    expect(posAfter).not.toBeNull();
    
    // Position should be UNCHANGED
    expect(posAfter!.x).toBeCloseTo(posBefore!.x, 0);
    expect(posAfter!.y).toBeCloseTo(posBefore!.y, 0);
  });

  test('x-draggable should not apply transform on init', async ({ page }) => {
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-no-transform';
      el.style.cssText = 'position: relative; margin: 50px; width: 100px; height: 50px; background: green;';
      document.body.appendChild(el);
    });
    
    const element = page.locator('#test-no-transform');
    
    // Check transform BEFORE
    const transformBefore = await element.evaluate((el) => {
      return getComputedStyle(el).transform;
    });
    
    // Add x-draggable
    await page.evaluate(() => {
      document.getElementById('test-no-transform')?.setAttribute('x-draggable', '');
    });
    
    await page.waitForTimeout(200);
    
    // Check transform AFTER
    const transformAfter = await element.evaluate((el) => {
      return getComputedStyle(el).transform;
    });
    
    // Transform should be same (none or matrix(1,0,0,1,0,0))
    const normalizedBefore = transformBefore === 'none' ? 'none' : transformBefore;
    const normalizedAfter = transformAfter === 'none' ? 'none' : transformAfter;
    
    expect(normalizedAfter).toBe(normalizedBefore);
  });

  test('element should only move when actually dragged', async ({ page }) => {
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-only-drag';
      el.setAttribute('x-draggable', '');
      el.style.cssText = 'position: absolute; top: 150px; left: 150px; width: 80px; height: 80px; background: red; cursor: move;';
      el.textContent = 'Drag';
      document.body.appendChild(el);
    });
    
    const element = page.locator('#test-only-drag');
    await expect(element).toBeVisible();
    
    const initialPos = await element.boundingBox();
    
    // Hover but don't click - position should NOT change
    await element.hover();
    await page.waitForTimeout(100);
    
    const afterHover = await element.boundingBox();
    expect(afterHover!.x).toBeCloseTo(initialPos!.x, 0);
    expect(afterHover!.y).toBeCloseTo(initialPos!.y, 0);
    
    // Now actually drag
    await element.dragTo(page.locator('body'), {
      targetPosition: { x: 300, y: 300 }
    });
    
    const afterDrag = await element.boundingBox();
    
    // NOW position should have changed
    const moved = afterDrag!.x !== initialPos!.x || afterDrag!.y !== initialPos!.y;
    expect(moved).toBe(true);
  });
});
