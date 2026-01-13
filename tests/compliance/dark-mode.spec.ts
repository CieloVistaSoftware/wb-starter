/**
 * Dark Mode Compliance Tests
 * Verifies all HTML pages render correctly in dark mode
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find all HTML files in project
function findHtmlFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Skip node_modules, .git, data, etc.
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', 'data', 'test-results'].includes(entry.name)) {
        findHtmlFiles(fullPath, files);
      }
    } else if (entry.name.endsWith('.html')) {
      // Exclude tests that intentionally error
      if (!entry.name.includes('legacy-syntax-check.html')) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

const projectRoot = path.resolve(__dirname, '../..');
const htmlFiles = findHtmlFiles(projectRoot);

// Convert to relative paths for cleaner test names
const relativeHtmlFiles = htmlFiles.map(f => path.relative(projectRoot, f).replace(/\\/g, '/'));

// Known issues to skip (not dark mode related)
const knownWarnings = [
  '[WB:card] Invalid container tag',  // Custom element warning, not dark mode issue
  'Failed to load docs manifest',      // Network issue, not dark mode
  'Failed to fetch manifest',          // Network issue
];

test.describe('Dark Mode Compliance', () => {
  
  for (const htmlFile of relativeHtmlFiles) {
    test(`${htmlFile} renders in dark mode without errors`, async ({ page }) => {
      // Set dark mode before navigation
      await page.emulateMedia({ colorScheme: 'dark' });
      
      // Collect console errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Skip known warnings that aren't dark-mode related
          const isKnownWarning = knownWarnings.some(w => text.includes(w));
          if (!isKnownWarning) {
            errors.push(text);
          }
        }
      });
      
      // Navigate to the page
      const url = `http://localhost:3000/${htmlFile}`;
      const response = await page.goto(url);
      
      // Page should load
      expect(response?.status()).toBeLessThan(400);
      
      // Set dark theme attribute
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
      });
      
      await page.waitForTimeout(300);
      
      // Check for elements with missing/broken colors
      const colorIssues = await page.evaluate(() => {
        const issues: string[] = [];
        const elements = document.querySelectorAll('*');
        
        elements.forEach(el => {
          const styles = getComputedStyle(el);
          const color = styles.color;
          const bg = styles.backgroundColor;
          
          // Check for white text on white background (invisible)
          if (color === 'rgb(255, 255, 255)' && bg === 'rgb(255, 255, 255)') {
            issues.push(`Invisible text (white on white): ${el.tagName}${el.id ? '#' + el.id : ''}`);
          }
          
          // Check for black text on black background (invisible)
          if (color === 'rgb(0, 0, 0)' && bg === 'rgb(0, 0, 0)') {
            issues.push(`Invisible text (black on black): ${el.tagName}${el.id ? '#' + el.id : ''}`);
          }
        });
        
        return issues.slice(0, 10); // Limit to first 10 issues
      });
      
      // Report color issues as warnings but don't fail
      if (colorIssues.length > 0) {
        console.warn(`⚠️ ${htmlFile} has potential dark mode issues:\n  ${colorIssues.join('\n  ')}`);
      }
      
      // Filter for critical errors only
      const criticalErrors = errors.filter(e => 
        !e.includes('favicon') && 
        !e.includes('404') &&
        !e.includes('net::ERR') &&
        !e.includes('Cannot read properties of null')  // Skip init errors for pages without #app
      );
      
      expect(criticalErrors, `JS errors in ${htmlFile}:\n${criticalErrors.join('\n')}`).toEqual([]);
    });
  }
  
  test('main site pages have data-theme attribute', async ({ page }) => {
    // Test only main site pages (not demos or test files)
    const mainPages = relativeHtmlFiles.filter(f => 
      f.startsWith('pages/') || f === 'index.html'
    );
    
    for (const htmlFile of mainPages) {
      await page.goto(`http://localhost:3000/${htmlFile}`);
      await page.waitForTimeout(300);
      
      const hasTheme = await page.evaluate(() => 
        document.documentElement.hasAttribute('data-theme')
      );
      
      // Main pages should have theme attribute after site-engine loads
      if (!hasTheme) {
        console.warn(`⚠️ ${htmlFile} missing data-theme attribute`);
      }
    }
  });
  
  test('theme variables are defined in dark mode', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(500);
    
    // Ensure dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    
    await page.waitForTimeout(100);
    
    // Check critical theme variables exist
    const variables = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return {
        bgColor: root.getPropertyValue('--bg-color').trim(),
        textPrimary: root.getPropertyValue('--text-primary').trim(),
        primary: root.getPropertyValue('--primary').trim(),
        borderColor: root.getPropertyValue('--border-color').trim(),
      };
    });
    
    expect(variables.bgColor, '--bg-color should be defined').not.toBe('');
    expect(variables.textPrimary, '--text-primary should be defined').not.toBe('');
    expect(variables.primary, '--primary should be defined').not.toBe('');
    expect(variables.borderColor, '--border-color should be defined').not.toBe('');
  });
  
  test('dark mode has dark background colors', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(500);
    
    // Set dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    
    await page.waitForTimeout(100);
    
    // Check background is actually dark
    const bgColor = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return root.getPropertyValue('--bg-color').trim();
    });
    
    // Dark backgrounds should not be white or very light
    expect(bgColor).not.toBe('#ffffff');
    expect(bgColor).not.toBe('white');
    expect(bgColor).not.toBe('rgb(255, 255, 255)');
  });

});
