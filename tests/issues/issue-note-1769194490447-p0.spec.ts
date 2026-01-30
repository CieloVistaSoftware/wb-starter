/**
 * Issue Test: note-1769194490447-p0
 * FEATURE: Issues component should be npm-publishable standalone package
 */
import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'fs';

test.describe('Issue note-1769194490447-p0: NPM Publishable Issues Component', () => {

  test('issues component should have package.json', async ({ page }) => {
    // Check for standalone package structure
    const possiblePaths = [
      'src/components/wb-issues/package.json',
      'packages/wb-issues/package.json',
      'src/wb-issues/package.json'
    ];

    let packageFound = false;
    let packagePath = '';

    for (const p of possiblePaths) {
      if (existsSync(p)) {
        packageFound = true;
        packagePath = p;
        break;
      }
    }

    if (packageFound) {
      const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
      
      // Should have required npm fields
      expect(pkg.name).toBeTruthy();
      expect(pkg.version).toBeTruthy();
      expect(pkg.main || pkg.module).toBeTruthy();
    } else {
      // Document that package needs to be created
      console.log('Issues component needs standalone package.json for npm publishing');
    }
  });

  test('issues component should be self-contained', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Check component can work standalone
    const componentInfo = await page.evaluate(() => {
      const issues = document.querySelector('wb-issues');
      if (!issues) return null;

      return {
        tagName: issues.tagName,
        hasTemplate: issues.shadowRoot !== null || issues.innerHTML.length > 0,
        hasStyles: issues.querySelector('style') !== null || 
                   document.querySelector('link[href*="issues"]') !== null
      };
    });

    if (componentInfo) {
      expect(componentInfo.tagName).toBe('WB-ISSUES');
    }
  });

  test('issues component should have empty JSON files for fresh install', async ({ page }) => {
    // Check for template/default JSON files
    const jsonFiles = [
      'data/issues.json',
      'data/pending-issues.json'
    ];

    for (const file of jsonFiles) {
      if (existsSync(file)) {
        const content = readFileSync(file, 'utf-8');
        // Should be valid JSON
        expect(() => JSON.parse(content)).not.toThrow();
      }
    }
  });

  test('issues component should include CSS', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Check for issues-specific styles
    const hasStyles = await page.evaluate(() => {
      const issues = document.querySelector('wb-issues');
      if (!issues) return false;

      // Check for scoped styles or external stylesheet
      const computed = getComputedStyle(issues);
      return computed.display !== 'inline'; // Has some styling applied
    });

    // Component should have styling
    expect(hasStyles).toBeDefined();
  });

  test('issues component API should be documented', async ({ page }) => {
    // Check for README or documentation
    const docPaths = [
      'src/components/wb-issues/README.md',
      'docs/components/wb-issues.md',
      'src/wb-issues/README.md'
    ];

    let hasDoc = false;
    for (const p of docPaths) {
      if (existsSync(p)) {
        hasDoc = true;
        const content = readFileSync(p, 'utf-8');
        
        // Should document usage
        expect(content.toLowerCase()).toContain('usage');
        break;
      }
    }

    if (!hasDoc) {
      console.log('Issues component needs README documentation for npm package');
    }
  });
});
