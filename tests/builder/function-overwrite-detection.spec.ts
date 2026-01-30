/**
 * Function Overwrite Detection Tests
 * 
 * Root cause: showSemanticProperties was defined in both builder-components.js
 * and builder-properties.js. The second one silently overwrote the first,
 * breaking tooltip functionality.
 * 
 * These tests verify the overwrite detection system catches duplicates.
 */

import { test, expect } from '@playwright/test';

test.describe('Function Overwrite Detection', () => {
  
  test('warns when tracked function is overwritten', async ({ page }) => {
    const warnings: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });
    
    await page.goto('/src/builder/builder.html');
    await page.waitForLoadState('domcontentloaded');
    
    // Try to overwrite a tracked function
    await page.evaluate(() => {
      // @ts-ignore
      window.showSemanticProperties = function() { return 'overwritten'; };
    });
    
    // Should have logged a warning
    const overwriteWarning = warnings.find(w => w.includes('FUNCTION OVERWRITE DETECTED'));
    expect(overwriteWarning).toBeTruthy();
    expect(overwriteWarning).toContain('showSemanticProperties');
  });

  test('tracks which file originally defined the function', async ({ page }) => {
    const warnings: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });
    
    await page.goto('/src/builder/builder.html');
    await page.waitForLoadState('domcontentloaded');
    
    // Overwrite to trigger warning
    await page.evaluate(() => {
      // @ts-ignore
      window.showSemanticProperties = function() { return 'new version'; };
    });
    
    const overwriteWarning = warnings.find(w => w.includes('FUNCTION OVERWRITE DETECTED'));
    expect(overwriteWarning).toContain('Previously defined in:');
    expect(overwriteWarning).toContain('Being overwritten by:');
  });

  test('allows first definition without warning', async ({ page }) => {
    const warnings: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });
    
    await page.goto('/src/builder/builder.html');
    await page.waitForLoadState('domcontentloaded');
    
    // Check that initial load didn't produce overwrite warnings
    // (only duplicates should warn)
    const overwriteWarnings = warnings.filter(w => w.includes('FUNCTION OVERWRITE DETECTED'));
    expect(overwriteWarnings.length).toBe(0);
  });

  test('detection is enabled on page load', async ({ page }) => {
    const logs: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
      }
    });
    
    await page.goto('/src/builder/builder.html');
    await page.waitForLoadState('domcontentloaded');
    
    // Should see the initialization message
    const initLog = logs.find(l => l.includes('Function overwrite detection enabled'));
    expect(initLog).toBeTruthy();
  });

  test('critical functions are in the tracked list', async ({ page }) => {
    const logs: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
      }
    });
    
    await page.goto('/src/builder/builder.html');
    await page.waitForLoadState('domcontentloaded');
    
    const initLog = logs.find(l => l.includes('Function overwrite detection enabled'));
    
    // These functions caused bugs when duplicated - must be tracked
    const criticalFunctions = [
      'showSemanticProperties',
      'showProperties',
      'toggleXBehavior',
      'updateBehaviorValue',
      'addComponentToCanvas',
      'deleteComponent',
      'selectComponent',
      'updateElementTheme',
      'BuilderState'
    ];
    
    for (const fn of criticalFunctions) {
      expect(initLog).toContain(fn);
    }
  });

  test('overwritten function still works (setter completes)', async ({ page }) => {
    await page.goto('/src/builder/builder.html');
    await page.waitForLoadState('domcontentloaded');
    
    // Overwrite with a known return value
    const result = await page.evaluate(() => {
      // @ts-ignore
      window.showSemanticProperties = function() { return 'test-value'; };
      // @ts-ignore
      return window.showSemanticProperties();
    });
    
    // The overwrite should still work (we warn, not block)
    expect(result).toBe('test-value');
  });

  test('no duplicate definitions in production code', async ({ page }) => {
    const warnings: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });
    
    // Load the full builder
    await page.goto('/src/builder/builder.html');
    
    // Wait for all scripts to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Extra time for any async definitions
    
    // There should be ZERO overwrite warnings in production code
    const overwriteWarnings = warnings.filter(w => w.includes('FUNCTION OVERWRITE DETECTED'));
    
    if (overwriteWarnings.length > 0) {
      console.error('DUPLICATE FUNCTION DEFINITIONS FOUND:');
      overwriteWarnings.forEach(w => console.error(w));
    }
    
    expect(overwriteWarnings.length).toBe(0);
  });
});
