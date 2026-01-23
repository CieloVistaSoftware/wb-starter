/**
 * Builder Global Functions Tests
 * Tests the globally exposed functions in builder.html
 */
import { test, expect } from '@playwright/test';

// Use desktop viewport for all builder tests
test.use({ viewport: { width: 1280, height: 720 } });

test.describe('Builder Global Functions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(800);
  });

  test('builder page should load and display', async ({ page }) => {
    // Check that builder layout is visible (not mobile notice)
    await expect(page.locator('.builder-layout')).toBeVisible();
    await expect(page.locator('.builder-mobile-notice')).not.toBeVisible();
  });

  test('top bar should have action buttons', async ({ page }) => {
    // Check that top bar buttons exist (8 buttons in current UI)
    await expect(page.locator('.top-bar-actions button')).toHaveCount(8);
    
    // Check specific buttons by text
    await expect(page.locator('button:has-text("Settings")')).toBeVisible();
    await expect(page.locator('button:has-text("Preview")')).toBeVisible();
    await expect(page.locator('button:has-text("Save")')).toBeVisible();
  });

  test('pages section should exist', async ({ page }) => {
    await expect(page.locator('.pages-section')).toBeVisible();
    await expect(page.locator('.pages-section h3')).toContainText('Pages');
  });

  test('add page button should exist', async ({ page }) => {
    const addButton = page.locator('.pages-section button:has-text("Add Page")');
    await expect(addButton).toBeVisible();
  });

  test('canvas sections should be visible', async ({ page }) => {
    await expect(page.locator('.canvas-section.header')).toBeVisible();
    await expect(page.locator('.canvas-section.main')).toBeVisible();
    await expect(page.locator('.canvas-section.footer')).toBeVisible();
  });

  test('status bar should display page info', async ({ page }) => {
    const statusBar = page.locator('.status-bar');
    await expect(statusBar).toBeVisible();
    
    // Should show page info
    await expect(page.locator('#activeElement')).toContainText('Page');
    await expect(page.locator('#status')).toBeVisible();
  });

  test('component count should be displayed', async ({ page }) => {
    const countEl = page.locator('#componentCount');
    await expect(countEl).toBeVisible();
    
    const text = await countEl.textContent();
    expect(text).toMatch(/\d+ components?/);
  });

  test('properties panel should show empty state', async ({ page }) => {
    const panel = page.locator('#propertiesPanel');
    await expect(panel).toBeVisible();
    
    // Should have empty state message
    await expect(panel).toContainText('Click on a component');
  });

  test('settings button should open config panel', async ({ page }) => {
    // Initially no config panel
    await expect(page.locator('#configPanel')).toHaveCount(0);
    
    // Click settings button
    await page.locator('button:has-text("Settings")').click();
    await page.waitForTimeout(300);
    
    // Config panel should now exist
    await expect(page.locator('#configPanel')).toBeVisible();
    await expect(page.locator('#configPanel')).toContainText('Settings');
    
    // Close it
    await page.locator('#configPanel button:has-text("Close")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('#configPanel')).toHaveCount(0);
  });
});
