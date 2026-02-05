import { test, expect } from '@playwright/test';

test.describe('Schema Viewer', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to schema viewer
    await page.goto('/schema-viewer.html');
  });

  test('should load page without errors', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Schema Viewer/);
    
    // Check header is visible
    const header = page.locator('.sv-header h1');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Schema Viewer');
  });

  test('should have schema selector populated', async ({ page }) => {
    const selector = page.locator('#schemaSelector');
    await expect(selector).toBeVisible();
    
    // Should have more than just the placeholder option
    const options = selector.locator('option');
    const count = await options.count();
    expect(count).toBeGreaterThan(1);
    
    // Check some expected schemas are present
    await expect(selector).toContainText('Button');
    await expect(selector).toContainText('Card');
    await expect(selector).toContainText('Alert');
  });

  test('should load schema when selected', async ({ page }) => {
    const selector = page.locator('#schemaSelector');
    
    // Select 'button' schema
    await selector.selectOption({ label: 'Button' });
    
    // Wait for schema to load
    await page.waitForTimeout(500);
    
    // JSON editor should have content
    const jsonEditor = page.locator('#jsonEditor');
    const jsonContent = await jsonEditor.inputValue();
    expect(jsonContent.length).toBeGreaterThan(0);
    
    // Should be valid JSON
    expect(() => JSON.parse(jsonContent)).not.toThrow();
    
    // Preview panel should show component info
    const infoSection = page.locator('.sv-info');
    await expect(infoSection).toBeVisible();
  });

  test('should display properties for loaded schema', async ({ page }) => {
    const selector = page.locator('#schemaSelector');
    await selector.selectOption({ label: 'Button' });
    
    await page.waitForTimeout(500);
    
    // Should show properties section
    const propsTitle = page.locator('.sv-props-title');
    await expect(propsTitle.first()).toBeVisible();
    
    // Should show property cards
    const propCards = page.locator('.sv-prop');
    const count = await propCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should format JSON when Format button clicked', async ({ page }) => {
    const selector = page.locator('#schemaSelector');
    await selector.selectOption({ label: 'Alert' });
    
    await page.waitForTimeout(500);
    
    // Get original JSON
    const jsonEditor = page.locator('#jsonEditor');
    const originalJson = await jsonEditor.inputValue();
    
    // Minify the JSON in the editor
    await jsonEditor.fill(JSON.stringify(JSON.parse(originalJson)));
    
    // Click format button
    await page.click('#formatBtn');
    
    // JSON should be formatted (have newlines)
    const formattedJson = await jsonEditor.inputValue();
    expect(formattedJson).toContain('\n');
  });

  test('should not have console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/schema-viewer.html');
    await page.waitForTimeout(1000);
    
    // Filter out known acceptable errors
    const criticalErrors = errors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('404') &&
      !err.includes('net::ERR')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('styles should load correctly', async ({ page }) => {
    // Check that CSS variables are working (dark theme)
    const body = page.locator('body');
    const bgColor = await body.evaluate(el => 
      getComputedStyle(el).backgroundColor
    );
    
    // Should have a dark background (not white/default)
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(bgColor).not.toBe('rgb(255, 255, 255)');
  });
});
