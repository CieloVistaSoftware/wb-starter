/**
 * ISSUES MODAL TEST
 * =================
 * Tests for the Issues modal in builder.html:
 * 1. Modal always opens centered on screen
 * 2. No toast appears when clicking issue count
 * 3. Modal closes properly
 */

import { test, expect } from '@playwright/test';

const BUILDER_URL = 'http://localhost:3000/builder.html';

test.describe('Issues Modal', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to builder where wb-issues lives
    await page.goto(BUILDER_URL);
    await page.evaluate(() => localStorage.clear());
    await page.waitForLoadState('networkidle');
    // Wait for wb-issues to initialize
    await page.waitForSelector('wb-issues[data-wb-ready="issues"]', { timeout: 10000 });
  });

  test('Issues modal opens centered on screen', async ({ page }) => {
    // Click the issue count to open the Issue Tracker modal
    await page.click('.wb-issues__issue-count');
    
    // Wait for the modal to appear
    const modal = await page.waitForSelector('#issue-tracker-modal', { timeout: 5000 });
    expect(modal).toBeTruthy();
    
    // Get viewport dimensions
    const viewport = page.viewportSize();
    if (!viewport) throw new Error('No viewport');
    
    // Get the inner modal dialog box position
    const modalDialog = await page.$('#issue-tracker-modal > div');
    if (!modalDialog) throw new Error('Modal dialog not found');
    
    const box = await modalDialog.boundingBox();
    if (!box) throw new Error('Could not get modal bounding box');
    
    // Calculate expected center
    const expectedCenterX = viewport.width / 2;
    const expectedCenterY = viewport.height / 2;
    
    // Calculate actual center of modal
    const actualCenterX = box.x + box.width / 2;
    const actualCenterY = box.y + box.height / 2;
    
    // Allow 50px tolerance for centering
    expect(Math.abs(actualCenterX - expectedCenterX)).toBeLessThan(50);
    expect(Math.abs(actualCenterY - expectedCenterY)).toBeLessThan(50);
    
    console.log(`✅ Modal centered: expected (${expectedCenterX}, ${expectedCenterY}), actual (${actualCenterX}, ${actualCenterY})`);
  });

  test('No toast appears when clicking issue count', async ({ page }) => {
    // Count existing toasts before click
    const toastsBefore = await page.$$('#claude-toast-container > div');
    const countBefore = toastsBefore.length;
    
    // Click the issue count
    await page.click('.wb-issues__issue-count');
    
    // Wait for modal to appear
    await page.waitForSelector('#issue-tracker-modal', { timeout: 5000 });
    
    // Wait a moment for any potential toast to appear
    await page.waitForTimeout(500);
    
    // Count toasts after click
    const toastsAfter = await page.$$('#claude-toast-container > div');
    const countAfter = toastsAfter.length;
    
    // No new toasts should have appeared
    expect(countAfter).toBe(countBefore);
    console.log(`✅ No toast appeared: before=${countBefore}, after=${countAfter}`);
  });

  test('Issues drawer opens centered (not docked)', async ({ page }) => {
    // Click the trigger button to open the drawer
    await page.click('.wb-issues__trigger');
    
    // Wait for the issues drawer to appear
    await page.waitForSelector('.wb-issues--open .wb-issues__drawer', { timeout: 5000 });
    
    // Get the drawer
    const drawer = await page.$('.wb-issues__drawer');
    if (!drawer) throw new Error('Drawer not found');
    
    const box = await drawer.boundingBox();
    if (!box) throw new Error('Could not get drawer bounding box');
    
    const viewport = page.viewportSize();
    if (!viewport) throw new Error('No viewport');
    
    // Check drawer is centered (not docked to left or right)
    const leftEdgeDistance = box.x;
    const rightEdgeDistance = viewport.width - (box.x + box.width);
    
    expect(leftEdgeDistance).toBeGreaterThan(50);
    expect(rightEdgeDistance).toBeGreaterThan(50);
    
    console.log(`✅ Issues drawer centered: left=${leftEdgeDistance}px, right=${rightEdgeDistance}px`);
  });

  test('Issue tracker modal closes on X click', async ({ page }) => {
    // Open the modal
    await page.click('.wb-issues__issue-count');
    await page.waitForSelector('#issue-tracker-modal', { timeout: 5000 });
    
    // Click the close button
    await page.click('#issue-tracker-close');
    
    // Modal should be gone
    await page.waitForSelector('#issue-tracker-modal', { state: 'detached', timeout: 3000 });
    console.log('✅ Modal closed on X click');
  });

  test('Issue tracker modal closes on backdrop click', async ({ page }) => {
    // Open the modal
    await page.click('.wb-issues__issue-count');
    await page.waitForSelector('#issue-tracker-modal', { timeout: 5000 });
    
    // Click the backdrop (the outer modal div, not the inner content)
    await page.click('#issue-tracker-modal', { position: { x: 10, y: 10 } });
    
    // Modal should be gone
    await page.waitForSelector('#issue-tracker-modal', { state: 'detached', timeout: 3000 });
    console.log('✅ Modal closed on backdrop click');
  });

  test('Issues modal persists centered after multiple opens', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport) throw new Error('No viewport');
    
    // Open and close 3 times
    for (let i = 0; i < 3; i++) {
      await page.click('.wb-issues__issue-count');
      await page.waitForSelector('#issue-tracker-modal', { timeout: 5000 });
      
      const modalDialog = await page.$('#issue-tracker-modal > div');
      if (!modalDialog) throw new Error('Modal dialog not found');
      
      const box = await modalDialog.boundingBox();
      if (!box) throw new Error('Could not get modal bounding box');
      
      const actualCenterX = box.x + box.width / 2;
      const actualCenterY = box.y + box.height / 2;
      const expectedCenterX = viewport.width / 2;
      const expectedCenterY = viewport.height / 2;
      
      expect(Math.abs(actualCenterX - expectedCenterX)).toBeLessThan(50);
      expect(Math.abs(actualCenterY - expectedCenterY)).toBeLessThan(50);
      
      // Close
      await page.click('#issue-tracker-close');
      await page.waitForSelector('#issue-tracker-modal', { state: 'detached', timeout: 3000 });
    }
    console.log('✅ Modal stayed centered after 3 open/close cycles');
  });
});
