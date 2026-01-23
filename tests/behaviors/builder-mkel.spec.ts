/**
 * Builder Element/Component Tests
 * Tests the builder canvas, sections, and component areas
 */

import { test, expect, Page } from '@playwright/test';

// Use desktop viewport for all builder tests
test.use({ viewport: { width: 1280, height: 720 } });

test.describe('Builder Canvas Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);
  });

  test('canvas should have three sections', async ({ page }) => {
    const sections = page.locator('.canvas-section');
    await expect(sections).toHaveCount(3);
  });

  test('header section should be labeled correctly', async ({ page }) => {
    const headerSection = page.locator('.canvas-section.header');
    await expect(headerSection).toBeVisible();
    
    const label = headerSection.locator('.section-label');
    await expect(label).toContainText('Header');
    await expect(label).toContainText('shared');
  });

  test('main section should be labeled correctly', async ({ page }) => {
    const mainSection = page.locator('.canvas-section.main');
    await expect(mainSection).toBeVisible();
    
    const label = mainSection.locator('.section-label');
    await expect(label).toContainText('Main');
  });

  test('footer section should be labeled correctly', async ({ page }) => {
    const footerSection = page.locator('.canvas-section.footer');
    await expect(footerSection).toBeVisible();
    
    const label = footerSection.locator('.section-label');
    await expect(label).toContainText('Footer');
    await expect(label).toContainText('shared');
  });

  test('each section should have a components container', async ({ page }) => {
    await expect(page.locator('#header-container')).toBeVisible();
    await expect(page.locator('#main-container')).toBeVisible();
    await expect(page.locator('#footer-container')).toBeVisible();
  });
});

test.describe('Builder Drop Zones', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);
  });

  test('drop zones should exist in empty sections', async ({ page }) => {
    const headerDropZone = page.locator('.canvas-drop-zone[section="header"]');
    const mainDropZone = page.locator('.canvas-drop-zone[section="main"]');
    const footerDropZone = page.locator('.canvas-drop-zone[section="footer"]');

    await expect(headerDropZone).toBeVisible();
    await expect(mainDropZone).toBeVisible();
    await expect(footerDropZone).toBeVisible();
  });

  test('drop zones should have hint text', async ({ page }) => {
    const dropZones = page.locator('.canvas-drop-zone');
    
    for (let i = 0; i < 3; i++) {
      const zone = dropZones.nth(i);
      const text = await zone.textContent();
      expect(text).toContain('Drop');
    }
  });
});

test.describe('Builder Drawers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);
  });

  test('left drawer should contain pages section', async ({ page }) => {
    const leftDrawer = page.locator('#leftDrawer');
    await expect(leftDrawer).toBeVisible();
    
    const pagesSection = leftDrawer.locator('.pages-section');
    await expect(pagesSection).toBeVisible();
  });

  test('left drawer should have component library container', async ({ page }) => {
    const library = page.locator('#leftDrawer #componentLibrary');
    await expect(library).toBeAttached();
  });

  test('right drawer should contain properties panel', async ({ page }) => {
    const rightDrawer = page.locator('#rightDrawer');
    await expect(rightDrawer).toBeVisible();
    
    const propsPanel = rightDrawer.locator('#propertiesPanel');
    await expect(propsPanel).toBeVisible();
  });
});

test.describe('Builder Toolbar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);
  });

  test('canvas toolbar should show component count', async ({ page }) => {
    const toolbar = page.locator('.canvas-toolbar');
    await expect(toolbar).toBeVisible();
    
    const count = page.locator('#componentCount');
    await expect(count).toBeVisible();
  });

  test('canvas toolbar should show Canvas label', async ({ page }) => {
    const toolbar = page.locator('.canvas-toolbar');
    await expect(toolbar).toContainText('Canvas');
  });
});

test.describe('Builder Mobile Notice', () => {
  // Use mobile viewport for this test
  test.use({ viewport: { width: 375, height: 667 } });

  test('mobile notice should show on small screens', async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);
    
    const mobileNotice = page.locator('.builder-mobile-notice');
    await expect(mobileNotice).toBeVisible();
    
    await expect(mobileNotice).toContainText('Desktop Recommended');
  });
});
