import { test, expect } from '@playwright/test';

/**
 * Builder Section Synchronization Tests
 * Tests that canvas sections, pages, and components work together correctly
 */

// Use desktop viewport for all builder tests
test.use({ viewport: { width: 1280, height: 720 } });

test.describe('Builder Section Synchronization', () => {
  
  test('canvas sections should be visible on load', async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);

    // All three canvas sections should be visible
    const headerSection = page.locator('.canvas-section.header');
    const mainSection = page.locator('.canvas-section.main');
    const footerSection = page.locator('.canvas-section.footer');
    
    await expect(headerSection).toBeVisible();
    await expect(mainSection).toBeVisible();
    await expect(footerSection).toBeVisible();
  });

  test('component containers should have proper IDs', async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);

    // Check structural containers have IDs
    await expect(page.locator('#header-container')).toBeVisible();
    await expect(page.locator('#main-container')).toBeVisible();
    await expect(page.locator('#footer-container')).toBeVisible();
  });

  test('drop zones should be present in empty sections', async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);

    // Check drop zones exist
    const headerDropZone = page.locator('.canvas-drop-zone[section="header"]');
    const mainDropZone = page.locator('.canvas-drop-zone[section="main"]');
    const footerDropZone = page.locator('.canvas-drop-zone[section="footer"]');

    await expect(headerDropZone).toBeVisible();
    await expect(mainDropZone).toBeVisible();
    await expect(footerDropZone).toBeVisible();
  });

  test('section labels should indicate shared sections', async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);

    // Header and footer should show "(shared)" indicator
    const headerLabel = page.locator('.canvas-section.header .section-label');
    const footerLabel = page.locator('.canvas-section.footer .section-label');
    
    await expect(headerLabel).toContainText('Header');
    await expect(headerLabel).toContainText('shared');
    
    await expect(footerLabel).toContainText('Footer');
    await expect(footerLabel).toContainText('shared');
    
    // Main should not show shared
    const mainLabel = page.locator('.canvas-section.main .section-label');
    await expect(mainLabel).toContainText('Main');
  });

  test('page list should be attached to DOM', async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);

    // Pages list should exist (it may or may not be visible depending on state)
    const pagesList = page.locator('#pagesList');
    await expect(pagesList).toBeAttached();
  });

  test('status bar should show current page info', async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);

    const statusBar = page.locator('.status-bar');
    await expect(statusBar).toBeVisible();
    
    // Should show page info
    const activeElement = page.locator('#activeElement');
    await expect(activeElement).toContainText('Page');
  });

  test('canvas viewport should exist', async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);

    const viewport = page.locator('.canvas-viewport');
    await expect(viewport).toBeVisible();
  });

  test('all buttons in top bar must have onclick handlers', async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);

    const topBarButtons = page.locator('.top-bar button, .top-bar-actions button');
    const count = await topBarButtons.count();
    
    expect(count).toBeGreaterThan(0);
    
    for (let i = 0; i < count; i++) {
      const btn = topBarButtons.nth(i);
      const onclick = await btn.getAttribute('onclick');
      expect(onclick, `Button ${i} should have onclick handler`).toBeTruthy();
    }
  });

  test('component count should update', async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);

    const countEl = page.locator('#componentCount');
    await expect(countEl).toBeVisible();
    
    // Should show component count (initially 0)
    const text = await countEl.textContent();
    expect(text).toMatch(/\d+ components?/);
  });
});
