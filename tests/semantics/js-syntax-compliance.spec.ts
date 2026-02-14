/**
 * JavaScript Syntax Compliance Tests
 * ===================================
 * These tests catch JS syntax errors that compliance tests miss
 * because compliance tests only perform static file analysis.
 * 
 * A runtime browser test is required to catch:
 * - Duplicate variable declarations (const/let)
 * - Import statement errors
 * - Module loading failures
 * - Other syntax errors that only manifest at runtime
 */

import { test, expect } from '@playwright/test';

test.describe('JS Syntax Compliance', () => {
  
  test('behaviors index module loads without syntax errors', async ({ page }) => {
    // Capture console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture page errors (uncaught exceptions)
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    // Navigate to a page that loads behaviors
    await page.goto('index.html', { timeout: 15000 });
    
    // Wait for behaviors to initialize
    await page.waitForTimeout(1000);

    // Check for syntax-related errors
    const syntaxErrors = [...consoleErrors, ...pageErrors].filter(error => 
      error.includes('SyntaxError') ||
      error.includes('has already been declared') ||
      error.includes('Identifier') ||
      error.includes('Unexpected token') ||
      error.includes('Cannot use import') ||
      error.includes('is not defined')
    );

    expect(syntaxErrors, `JS syntax errors detected:\n${syntaxErrors.join('\n')}`).toHaveLength(0);
  });

  test('WB initializes without errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('index.html', { timeout: 15000 });
    
    // Check that WB is available
    const wbLoaded = await page.evaluate(() => {
      return typeof (window as any).WB !== 'undefined';
    });

    expect(errors, `Page errors:\n${errors.join('\n')}`).toHaveLength(0);
    expect(wbLoaded).toBe(true);
  });

  test('all behavior modules can be imported', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('index.html', { timeout: 15000 });

    // Verify behaviors registry has entries
    // Check both WBServices.behaviors (legacy) and WB.behaviors (current)
    const behaviorCount = await page.evaluate(() => {
      const services = (window as any).WBServices || (window as any).WB;
      if (!services) return 0;
      const behaviors = services.behaviors;
      if (!behaviors) return 0;
      return Object.keys(behaviors).length;
    });

    expect(errors, `Page errors:\n${errors.join('\n')}`).toHaveLength(0);
    expect(behaviorCount).toBeGreaterThan(50); // We have 100+ behaviors
  });

  test('critical behavior files load correctly', async ({ page }) => {
    const moduleLoadErrors: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Failed to load') || text.includes('module')) {
        if (msg.type() === 'error') {
          moduleLoadErrors.push(text);
        }
      }
    });

    page.on('pageerror', error => {
      moduleLoadErrors.push(error.message);
    });

    await page.goto('index.html', { timeout: 15000 });
    await page.waitForTimeout(500);

    // Check specific behavior groups loaded
    // Check both WBServices.behaviors (legacy) and WB.behaviors (current)
    const loadedGroups = await page.evaluate(() => {
      const services = (window as any).WBServices || (window as any).WB;
      if (!services) return { error: 'No WB or WBServices' };
      
      const behaviors = services.behaviors;
      if (!behaviors) return { error: 'No behaviors object' };
      
      return {
        hasCard: !!behaviors.card,
        hasCardimage: !!behaviors.cardimage,
        hasBuilder: !!behaviors.builder,
        hasModal: !!behaviors.modal,
        hasTooltip: !!behaviors.tooltip,
        hasAccordion: !!behaviors.accordion,
        hasSpinner: !!behaviors.spinner,
        hasProgress: !!behaviors.progress
      };
    });

    expect(moduleLoadErrors, `Module load errors:\n${moduleLoadErrors.join('\n')}`).toHaveLength(0);
    expect(loadedGroups.hasCard).toBe(true);
    expect(loadedGroups.hasBuilder).toBe(true);
    expect(loadedGroups.hasModal).toBe(true);
  });
});
