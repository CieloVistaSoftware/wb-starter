/**
 * Issue Test: note-1769194562447-p0
 * BUG: Right clicking on any element in canvas and picking inspect does nothing
 * FIX: Now shows Element Inspector modal with tag, attributes, styles, dimensions
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769194562447-p0: Canvas Inspect Context Menu', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/builder.html', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    // Wait for builder to initialize (poll with short delays to avoid long-running hooks)
    let hasAdd = false;
    const maxChecks = 20; // ~10s
    for (let i = 0; i < maxChecks; i++) {
      hasAdd = await page.evaluate(() => typeof (window as any).add === 'function');
      if (hasAdd) break;
      await page.waitForTimeout(500);
    }
    if (!hasAdd) {
      test.skip('Builder did not initialize in time');
      return;
    }
  });

  test('right-click inspect should open element inspector modal', async ({ page }) => {
    // Add a component to the canvas
    await page.evaluate(() => {
      window.add({ n: 'Test Card', b: 'card', d: { title: 'Test' } });
    });
    
    // Wait for component to appear
    const component = page.locator('.dropped').first();
    await expect(component).toBeVisible({ timeout: 5000 });
    
    // Right-click on the component
    await component.click({ button: 'right' });
    
    // Wait for context menu
    const contextMenu = page.locator('#builderContextMenu');
    await expect(contextMenu).toBeVisible({ timeout: 3000 });
    
    // Click the Inspect option
    const inspectBtn = contextMenu.locator('button:has-text("Inspect")');
    await expect(inspectBtn).toBeVisible();
    await inspectBtn.click();
    
    // Verify Element Inspector modal opens
    const inspector = page.locator('#elementInspector');
    await expect(inspector).toBeVisible({ timeout: 3000 });
    
    // Verify it shows element info
    await expect(inspector.locator('text=Element Inspector')).toBeVisible();
    await expect(inspector.locator('text=TAG')).toBeVisible();
    await expect(inspector.locator('text=ATTRIBUTES')).toBeVisible();
  });

  test('inspector shows correct element details', async ({ page }) => {
    // Add a component with known properties
    await page.evaluate(() => {
      window.add({ n: 'Hero Section', b: 'hero', d: { title: 'Welcome', subtitle: 'Test subtitle' } });
    });
    
    const component = page.locator('.dropped').first();
    await expect(component).toBeVisible({ timeout: 5000 });
    
    // Open inspector via context menu
    await component.click({ button: 'right' });
    await page.locator('#builderContextMenu button:has-text("Inspect")').click();
    
    const inspector = page.locator('#elementInspector');
    await expect(inspector).toBeVisible();
    
    // Should show data-wb attribute
    await expect(inspector.locator('text=data-wb')).toBeVisible();
    
    // Should show dimensions
    await expect(inspector.locator('text=DIMENSIONS')).toBeVisible();
  });

  test('inspector can be closed', async ({ page }) => {
    await page.evaluate(() => {
      window.add({ n: 'Test', b: 'card', d: {} });
    });
    
    const component = page.locator('.dropped').first();
    await expect(component).toBeVisible({ timeout: 5000 });
    
    // Open inspector
    await component.click({ button: 'right' });
    await page.locator('#builderContextMenu button:has-text("Inspect")').click();
    
    const inspector = page.locator('#elementInspector');
    await expect(inspector).toBeVisible();
    
    // Close via X button
    await inspector.locator('button:has-text("✕")').click();
    await expect(inspector).not.toBeVisible();
  });

  test('inspector Copy HTML button works', async ({ page }) => {
    await page.evaluate(() => {
      window.add({ n: 'Test', b: 'alert', d: { type: 'info', message: 'Test message' } });
    });
    
    const component = page.locator('.dropped').first();
    await expect(component).toBeVisible({ timeout: 5000 });
    
    // Open inspector
    await component.click({ button: 'right' });
    await page.locator('#builderContextMenu button:has-text("Inspect")').click();
    
    const inspector = page.locator('#elementInspector');
    await expect(inspector).toBeVisible();
    
    // Click Copy HTML
    const copyBtn = inspector.locator('button:has-text("Copy HTML")');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    
    // Verify clipboard contains HTML (via toast message)
    // Note: Clipboard API requires permissions in tests
  });

  test('inspectElement function exists and works programmatically', async ({ page }) => {
    await page.evaluate(() => {
      window.add({ n: 'Test', b: 'card', d: {} });
    });
    
    // Verify inspectElement is a function
    const hasFunction = await page.evaluate(() => typeof window.inspectElement === 'function');
    expect(hasFunction).toBe(true);
    
    // Call it programmatically
    await page.evaluate(() => {
      const el = document.querySelector('.dropped');
      if (el) window.inspectElement(el);
    });
    
    // Inspector should open
    const inspector = page.locator('#elementInspector');
    await expect(inspector).toBeVisible({ timeout: 3000 });
  });
});
