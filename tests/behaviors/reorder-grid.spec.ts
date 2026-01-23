/**
 * Reorder Grid Test
 * Tests the x-reorder behavior for drag-to-reorder functionality
 */

declare global {
  interface Window {
    WB: any;
  }
}

import { test, expect } from '@playwright/test';

test('Preview grid items can be reordered by drag', async ({ page }) => {
  await page.goto('/?page=home');
  
  // Wait for page content to load (site-engine renders dynamically)
  await page.waitForSelector('.preview-grid', { timeout: 10000 });
  
  // Scroll the grid into view first (critical for pointer events to work)
  await page.evaluate(() => {
    document.querySelector('.preview-grid')?.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(500);
  
  // Ensure WB is up and inject reorder behavior
  await page.waitForFunction(() => !!window.WB && !!window.WB.inject, null, { timeout: 5000 });
  await page.evaluate(async () => {
    await window.WB.inject('.preview-grid', 'reorder');
  });

  const grid = page.locator('.preview-grid');
  await expect(grid).toBeVisible();

  // Verify behavior attached
  await page.waitForFunction(() => {
    const el = document.querySelector('.preview-grid');
    return (el && (el as HTMLElement).dataset?.wbReady?.includes('reorder'));
  }, null, { timeout: 5000 });

  // Get grid items
  const items = grid.locator('.grid-item');
  const count = await items.count();
  expect(count).toBeGreaterThanOrEqual(2);
  
  // Drag the LAST item toward the FIRST position
  const lastItem = items.nth(count - 1);
  const firstItem = items.nth(0);
  
  await lastItem.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  
  const lastBox = await lastItem.boundingBox();
  const firstBox = await firstItem.boundingBox();
  
  expect(lastBox).not.toBeNull();
  expect(firstBox).not.toBeNull();
  
  // Perform drag operation with step-by-step mouse movement
  const startX = lastBox!.x + lastBox!.width / 2;
  const startY = lastBox!.y + lastBox!.height / 2;
  const endX = firstBox!.x + firstBox!.width / 2;
  const endY = firstBox!.y + firstBox!.height / 2;
  
  await page.mouse.move(startX, startY);
  await page.waitForTimeout(50);
  await page.mouse.down();
  await page.waitForTimeout(50);
  
  // Move in steps to properly trigger pointer events
  const steps = 15;
  for (let i = 1; i <= steps; i++) {
    const x = startX + (endX - startX) * (i / steps);
    const y = startY + (endY - startY) * (i / steps);
    await page.mouse.move(x, y);
    await page.waitForTimeout(20);
  }
  
  await page.waitForTimeout(100);
  await page.mouse.up();
  await page.waitForTimeout(300);

  // Wait for the reorder behavior to set the data-last-order attribute
  await page.waitForFunction(
    () => !!document.querySelector('.preview-grid')?.getAttribute('data-last-order'), 
    null, 
    { timeout: 5000 }
  );
  
  const lastOrder = await page.evaluate(() => 
    JSON.parse(document.querySelector('.preview-grid')?.getAttribute('data-last-order') || '[]')
  );
  
  // Verify reorder completed (order array should have items)
  expect(lastOrder.length).toBeGreaterThan(0);
});
