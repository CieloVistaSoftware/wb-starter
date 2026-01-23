/**
 * Builder Component Library Tests
 * Tests the component library rendering and page management
 */
import { test, expect, Page } from '@playwright/test';

// Use desktop viewport for all builder tests
test.use({ viewport: { width: 1280, height: 720 } });

test.describe('Builder Component Library', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);
  });

  test('component library container should exist', async ({ page }) => {
    const library = page.locator('#componentLibrary');
    await expect(library).toBeAttached();
  });

  test('pages list should render correctly', async ({ page }) => {
    const pagesList = page.locator('#pagesList');
    await expect(pagesList).toBeAttached();
  });

  test('add new page button should exist', async ({ page }) => {
    const addButton = page.locator('.pages-section button').filter({ hasText: 'Add Page' });
    await expect(addButton).toBeVisible();
  });
});

test.describe('Builder Canvas Sections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);
  });

  test('header section should have correct structure', async ({ page }) => {
    const headerSection = page.locator('.canvas-section.header');
    await expect(headerSection).toBeVisible();
    
    const label = headerSection.locator('.section-label');
    await expect(label).toContainText('Header');
    
    const container = headerSection.locator('#header-container');
    await expect(container).toBeVisible();
  });

  test('main section should have correct structure', async ({ page }) => {
    const mainSection = page.locator('.canvas-section.main');
    await expect(mainSection).toBeVisible();
    
    const label = mainSection.locator('.section-label');
    await expect(label).toContainText('Main');
    
    const container = mainSection.locator('#main-container');
    await expect(container).toBeVisible();
  });

  test('footer section should have correct structure', async ({ page }) => {
    const footerSection = page.locator('.canvas-section.footer');
    await expect(footerSection).toBeVisible();
    
    const label = footerSection.locator('.section-label');
    await expect(label).toContainText('Footer');
    
    const container = footerSection.locator('#footer-container');
    await expect(container).toBeVisible();
  });

  test('drop zones should have section attributes', async ({ page }) => {
    const dropZones = page.locator('.canvas-drop-zone');
    const count = await dropZones.count();
    
    expect(count).toBeGreaterThanOrEqual(3);
    
    // Each drop zone should have section attribute
    for (let i = 0; i < count; i++) {
      const zone = dropZones.nth(i);
      const section = await zone.getAttribute('data-section');
      expect(['header', 'main', 'footer']).toContain(section);
    }
  });
});

test.describe('Builder Properties Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);
  });

  test('properties panel should exist', async ({ page }) => {
    const panel = page.locator('#propertiesPanel');
    await expect(panel).toBeVisible();
  });

  test('properties panel should show empty state initially', async ({ page }) => {
    const panel = page.locator('#propertiesPanel');
    
    // Should have empty state message
    await expect(panel).toContainText('Click a component');
  });
});

test.describe('Builder Theme Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);
  });

  test('page should have theme attribute', async ({ page }) => {
    const html = page.locator('html');
    const theme = await html.getAttribute('data-theme');
    
    expect(['dark', 'light']).toContain(theme);
  });

  test('theme can be changed via settings', async ({ page }) => {
    // Open config panel
    await page.locator('button:has-text("Settings")').click();
    await page.waitForTimeout(300);
    
    // Find theme selector
    const themeSelect = page.locator('#cfgTheme');
    await expect(themeSelect).toBeVisible();
    
    // Change theme
    const currentTheme = await page.locator('html').getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    await themeSelect.selectOption(newTheme);
    
    // Verify theme changed
    const updatedTheme = await page.locator('html').getAttribute('data-theme');
    expect(updatedTheme).toBe(newTheme);
    
    // Close settings
    await page.locator('#configPanel button:has-text("Close")').click();
  });
});
