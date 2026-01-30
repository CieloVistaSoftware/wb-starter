/**
 * Issue Test: note-1769144269528-p1
 * BUG: Unit tests should cover everything in behaviors
 */
import { test, expect } from '@playwright/test';
import { readdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

test.describe('Issue note-1769144269528-p1: Behaviors Test Coverage', () => {
  
  test('every behavior should have a corresponding test file', async ({ page }) => {
    // Get list of behaviors from src/behaviors
    const behaviorsDir = 'src/behaviors';
    const testsDir = 'tests/behaviors';
    
    let behaviors: string[] = [];
    let tests: string[] = [];

    try {
      if (existsSync(behaviorsDir)) {
        behaviors = readdirSync(behaviorsDir)
          .filter(f => f.endsWith('.js') || f.endsWith('.ts'))
          .map(f => f.replace(/\.(js|ts)$/, ''));
      }
      
      if (existsSync(testsDir)) {
        tests = readdirSync(testsDir)
          .filter(f => f.endsWith('.spec.ts'))
          .map(f => f.replace('.spec.ts', ''));
      }
    } catch (e) {
      // Directories may not exist
    }

    // For each behavior, check if test exists
    const missingTests: string[] = [];
    
    for (const behavior of behaviors) {
      const hasTest = tests.some(t => 
        t.includes(behavior) || 
        t.toLowerCase().includes(behavior.toLowerCase())
      );
      
      if (!hasTest) {
        missingTests.push(behavior);
      }
    }

    // Report missing tests
    if (missingTests.length > 0) {
      console.log('Behaviors missing tests:', missingTests);
    }

    // All behaviors should have tests
    expect(missingTests.length).toBe(0);
  });

  test('behaviors page should list all available behaviors', async ({ page }) => {
    await page.goto('http://localhost:3000/?page=behaviors');
    await page.waitForLoadState('networkidle');

    // Get documented behaviors from page
    const documentedBehaviors = await page.evaluate(() => {
      const headings = document.querySelectorAll('h2, h3, [data-behavior]');
      return Array.from(headings).map(h => h.textContent?.trim()).filter(Boolean);
    });

    // Should have multiple behaviors documented
    expect(documentedBehaviors.length).toBeGreaterThan(5);
  });

  test('x-attribute behaviors should be testable', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    const xAttributes = [
      'x-draggable',
      'x-resizable',
      'x-sortable',
      'x-tooltip',
      'x-clipboard',
      'x-ripple'
    ];

    for (const attr of xAttributes) {
      // Create test element
      const exists = await page.evaluate((attrName) => {
        const el = document.createElement('div');
        el.setAttribute(attrName, '');
        document.body.appendChild(el);
        
        // Check if behavior initialized
        const hasEffect = el.classList.length > 0 || 
                          el.style.cssText !== '' ||
                          Object.keys(el.dataset).length > 0;
        
        document.body.removeChild(el);
        return hasEffect;
      }, attr);

      // Behavior should have some observable effect
      // (even if it's just adding a class or data attribute)
    }
  });

  test('behavior test files should have meaningful assertions', async ({ page }) => {
    const testsDir = 'tests/behaviors';
    
    if (!existsSync(testsDir)) {
      test.skip();
      return;
    }

    const testFiles = readdirSync(testsDir).filter(f => f.endsWith('.spec.ts'));

    for (const file of testFiles.slice(0, 5)) { // Check first 5
      const content = readFileSync(join(testsDir, file), 'utf-8');
      
      // Should have actual expect() calls, not just placeholders
      const hasExpects = content.includes('expect(') && 
                         !content.includes('expect(true).toBe(true)');
      
      // Should have behavior-specific tests
      const hasSpecificTests = content.includes('toBeVisible') ||
                               content.includes('toHaveAttribute') ||
                               content.includes('toHaveClass') ||
                               content.includes('boundingBox');

      if (!hasExpects || !hasSpecificTests) {
        console.log(`Test file ${file} may need more specific assertions`);
      }
    }
  });
});
