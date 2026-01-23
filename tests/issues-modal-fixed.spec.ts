/**
 * ISSUES MODAL TEST
 * =================
 * Tests for the Issues modal:
 * 1. Modal always opens centered on screen
 * 2. No toast appears when clicking issue count
 * 3. Modal closes properly
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Issues Modal', () => {
  test.use({ viewport: null }); // Use responsive viewport

  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure clean state
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    // Wait for the issues component to be ready
    await page.waitForSelector('[data-wb-ready="issues"]', { timeout: 10000 });
  });

  test('Issues modal opens centered on screen', async ({ page }) => {
    // First open the issues drawer
    await page.click('.wb-issues__trigger');
    await page.waitForSelector('.wb-issues--open', { timeout: 5000 });

    // Click the issue count to open the Issue Tracker modal
    await page.waitForSelector('.wb-issues__issue-count', { timeout: 5000 });
    const issueCounts = await page.$$('.wb-issues__issue-count');
    console.log('Found .wb-issues__issue-count elements:', issueCounts.length);
    for (let i = 0; i < issueCounts.length; i++) {
      const html = await issueCounts[i].evaluate(el => el.outerHTML);
      console.log(`Element ${i}:`, html);
    }
    if (issueCounts.length === 0) throw new Error('No .wb-issues__issue-count found');
    await issueCounts[issueCounts.length - 1].click();

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
    // First open the issues drawer
    await page.click('.wb-issues__trigger');
    await page.waitForSelector('.wb-issues--open', { timeout: 5000 });

    // Wait for initialization
    await page.waitForSelector('.wb-issues__issue-count', { timeout: 5000 });
    const issueCounts = await page.$$('.wb-issues__issue-count');
    console.log('Found .wb-issues__issue-count elements:', issueCounts.length);
    for (let i = 0; i < issueCounts.length; i++) {
      const html = await issueCounts[i].evaluate(el => el.outerHTML);
      console.log(`Element ${i}:`, html);
    }
    if (issueCounts.length === 0) throw new Error('No .wb-issues__issue-count found');
    // Count existing toasts before click
    const toastsBefore = await page.$$('#claude-toast-container > div');
    const countBefore = toastsBefore.length;
    // Click the last .wb-issues__issue-count
    await issueCounts[issueCounts.length - 1].click();
    // Wait a moment for any potential toast to appear
    await page.waitForTimeout(500);
    // Count toasts after click
    const toastsAfter = await page.$$('#claude-toast-container > div');
    const countAfter = toastsAfter.length;
    // No new toasts should have appeared
    expect(countAfter).toBe(countBefore);
    console.log(`✅ No toast appeared: before=${countBefore}, after=${countAfter}`);
  });

  test('Notes panel opens centered (not docked)', async ({ page }) => {
    // First open the issues drawer
    await page.click('.wb-issues__trigger');
    await page.waitForSelector('.wb-issues--open', { timeout: 5000 });

    // Wait for the issues count button in footer
    await page.waitForSelector('.wb-issues__issue-count', { timeout: 5000 });
    const issueCounts = await page.$$('.wb-issues__issue-count');
    console.log('Found .wb-issues__issue-count elements:', issueCounts.length);
    for (let i = 0; i < issueCounts.length; i++) {
      const html = await issueCounts[i].evaluate(el => el.outerHTML);
      console.log(`Element ${i}:`, html);
    }
    if (issueCounts.length === 0) {
      console.log('Issues button not found, skipping');
      return;
    }
    await issueCounts[issueCounts.length - 1].click();
    // Wait for the issues drawer to appear
    await page.waitForSelector('.wb-issues--open .wb-issues__drawer', { timeout: 5000 });
    // Get the drawer
    const drawer = await page.$('.wb-issues__drawer');
    if (!drawer) throw new Error('Drawer not found');
    const box = await drawer.boundingBox();
    if (!box) throw new Error('Could not get drawer bounding box');
    const viewport = page.viewportSize();
    if (!viewport) throw new Error('No viewport');
    const leftEdgeDistance = box.x;
    const rightEdgeDistance = viewport.width - (box.x + box.width);
    expect(leftEdgeDistance).toBeGreaterThan(50);
    expect(rightEdgeDistance).toBeGreaterThan(50);
    console.log(`✅ Issues panel centered: left=${leftEdgeDistance}px, right=${rightEdgeDistance}px`);
  });

  test('Issue tracker modal closes on X click', async ({ page }) => {
    // First open the issues drawer
    await page.click('.wb-issues__trigger');
    await page.waitForSelector('.wb-issues--open', { timeout: 5000 });

    await page.waitForSelector('.wb-issues__issue-count', { timeout: 5000 });
    const issueCounts = await page.$$('.wb-issues__issue-count');
    console.log('Found .wb-issues__issue-count elements:', issueCounts.length);
    for (let i = 0; i < issueCounts.length; i++) {
      const html = await issueCounts[i].evaluate(el => el.outerHTML);
      console.log(`Element ${i}:`, html);
    }
    if (issueCounts.length === 0) throw new Error('No .wb-issues__issue-count found');
    // Open the modal
    await issueCounts[issueCounts.length - 1].click();
    await page.waitForSelector('#issue-tracker-modal', { timeout: 5000 });
    // Click the close button
    await page.click('#issue-tracker-close');
    // Modal should be gone
    await page.waitForSelector('#issue-tracker-modal', { state: 'detached', timeout: 3000 });
    console.log('✅ Modal closed on X click');
  });

  test('Issue tracker modal closes on backdrop click', async ({ page }) => {
    // First open the issues drawer
    await page.click('.wb-issues__trigger');
    await page.waitForSelector('.wb-issues--open', { timeout: 5000 });

    await page.waitForSelector('.wb-issues__issue-count', { timeout: 5000 });
    const issueCounts = await page.$$('.wb-issues__issue-count');
    console.log('Found .wb-issues__issue-count elements:', issueCounts.length);
    for (let i = 0; i < issueCounts.length; i++) {
      const html = await issueCounts[i].evaluate(el => el.outerHTML);
      console.log(`Element ${i}:`, html);
    }
    if (issueCounts.length === 0) throw new Error('No .wb-issues__issue-count found');
    // Open the modal
    await issueCounts[issueCounts.length - 1].click();
    const modal = await page.waitForSelector('#issue-tracker-modal', { timeout: 5000 });
    // Click the backdrop (the outer modal div, not the inner content)
    await page.click('#issue-tracker-modal', { position: { x: 10, y: 10 } });
    // Modal should be gone
    await page.waitForSelector('#issue-tracker-modal', { state: 'detached', timeout: 3000 });
    console.log('✅ Modal closed on backdrop click');
  });

  test('Issues modal persists centered after multiple opens', async ({ page }) => {
    // First open the issues drawer
    await page.click('.wb-issues__trigger');
    await page.waitForSelector('.wb-issues--open', { timeout: 5000 });

    await page.waitForSelector('.wb-issues__issue-count', { timeout: 5000 });
    const issueCounts = await page.$$('.wb-issues__issue-count');
    console.log('Found .wb-issues__issue-count elements:', issueCounts.length);
    for (let i = 0; i < issueCounts.length; i++) {
      const html = await issueCounts[i].evaluate(el => el.outerHTML);
      console.log(`Element ${i}:`, html);
    }
    if (issueCounts.length === 0) throw new Error('No .wb-issues__issue-count found');
    const viewport = page.viewportSize();
    if (!viewport) throw new Error('No viewport');
    // Open and close 3 times
    for (let i = 0; i < 3; i++) {
      await page.click('.wb-issues__issue-count');
      const modal = await page.waitForSelector('#issue-tracker-modal', { timeout: 5000 });
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