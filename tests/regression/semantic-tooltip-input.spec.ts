/**
 * Test: Semantic Element Tooltip Input Field
 * ---------------------------------------------------------------------------
 * ROOT CAUSE: showSemanticProperties was defined in both builder-components.js
 * and builder-properties.js. The second (simplified) definition overwrote the
 * first (full version), removing the tooltip input field.
 * 
 * This regression test ensures the tooltip input field appears when the
 * tooltip behavior is enabled on a semantic element.
 * ---------------------------------------------------------------------------
 */
import { test, expect } from '@playwright/test';

test.describe('Semantic Element Tooltip', () => {
  
  test('tooltip input field appears when tooltip behavior is enabled', async ({ page }) => {
    await page.goto('/src/builder/builder.html');
    await page.waitForLoadState('networkidle');
    
    // Wait for builder to initialize
    await page.waitForFunction(() => 
      typeof window.addSemanticElement === 'function' &&
      document.getElementById('main-container')
    );
    
    // Add a semantic section element
    await page.evaluate(() => {
      window.addSemanticElement('section', 'main', { 
        tag: 'section', 
        name: 'Section', 
        icon: '📑' 
      });
    });
    
    // Wait for component to appear and click it
    const component = page.locator('.canvas-component[data-type="semantic-section"]');
    await expect(component).toBeVisible({ timeout: 5000 });
    await component.click();
    
    // Wait for properties panel to populate
    await page.waitForSelector('#propertiesPanel .behavior-checkbox, #propertiesPanel label[title*="tooltip" i]', { timeout: 5000 });
    
    // Find and click the Tooltip checkbox
    const tooltipCheckbox = page.locator('label.behavior-checkbox').filter({ hasText: 'Tooltip' }).locator('input[type="checkbox"]');
    
    // If behavior-checkbox style (from builder-components.js full version)
    if (await tooltipCheckbox.count() > 0) {
      await tooltipCheckbox.check();
      
      // The tooltip input field should appear
      const tooltipInput = page.locator('input[placeholder*="tooltip" i]');
      await expect(tooltipInput).toBeVisible({ timeout: 2000 });
    } else {
      // Fallback: check xb-chip style (from builder-properties.js)
      const xbChip = page.locator('label.xb-chip').filter({ hasText: 'Tooltip' });
      if (await xbChip.count() > 0) {
        await xbChip.click();
        
        // For xb-chip style, look for the input
        const tooltipInput = page.locator('input[onchange*="x-tooltip"]');
        await expect(tooltipInput).toBeVisible({ timeout: 2000 });
      } else {
        throw new Error('No tooltip control found in properties panel');
      }
    }
  });

  test('showSemanticProperties has updateBehaviorValue for tooltip', async ({ page }) => {
    await page.goto('/src/builder/builder.html');
    await page.waitForLoadState('networkidle');
    
    // Wait for builder to initialize
    await page.waitForFunction(() => typeof window.showSemanticProperties === 'function');
    
    // Check that the function includes updateBehaviorValue (tooltip support)
    const hasTooltipSupport = await page.evaluate(() => {
      const fn = window.showSemanticProperties;
      if (!fn) return false;
      const fnStr = fn.toString();
      return fnStr.includes('updateBehaviorValue');
    });
    
    expect(hasTooltipSupport).toBe(true);
  });
});
