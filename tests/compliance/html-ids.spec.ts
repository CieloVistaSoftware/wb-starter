import { test, expect } from '@playwright/test';
import { getHtmlFiles, ROOT, relativePath, readFile } from '../base';

// Files that are allowed to have missing IDs (test files, demos, etc.)
const SKIP_FILES = [
  'demos/behaviors.html',           // Large demo file with dynamic content
  'demos/semantics-structure.html', // Demo file
  'tests/',                         // All test HTML files
  'public/papers/',                 // Paper documents
];

// Files with stricter requirements (main pages)
const STRICT_FILES = [
  'index.html',
  'pages/home.html',
  'pages/docs.html',
];

const htmlFiles = getHtmlFiles(ROOT);

test.describe('HTML Compliance: ID Attributes', () => {
  
  for (const filePath of htmlFiles) {
    const relPath = relativePath(filePath);
    
    // Skip certain files
    if (SKIP_FILES.some(skip => relPath.includes(skip.replace(/\//g, '\\')) || relPath.includes(skip))) {
      continue;
    }
    
    // Determine threshold based on file importance
    const isStrict = STRICT_FILES.some(strict => relPath.includes(strict.replace(/\//g, '\\')) || relPath.includes(strict));
    const threshold = isStrict ? 20 : 50;
    
    test(`File ${relPath} should have IDs on containers with >1 children`, async ({ page }) => {
      const content = readFile(filePath);
      
      const hasHtmlTag = /<html/i.test(content);
      const hasBodyTag = /<body/i.test(content);

      await page.setContent(content);
      
      const missingIds = await page.evaluate(({ hasHtmlTag, hasBodyTag }) => {
        const issues: string[] = [];
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(el => {
          const tagName = el.tagName.toLowerCase();

          if (tagName === 'html' && !hasHtmlTag) return;
          if (tagName === 'body' && !hasBodyTag) return;
          
          // Skip script, style, svg, and template elements
          if (['script', 'style', 'svg', 'template', 'head', 'meta', 'link'].includes(tagName)) return;
          
          // Skip elements inside SVG
          if (el.closest('svg')) return;

          if (el.children.length > 1) {
            if (!el.hasAttribute('id') || el.getAttribute('id') === '') {
              let desc = tagName;
              if (el.className) desc += `.${el.className.split(' ').join('.')}`;
              
              if (el.parentElement) {
                let parentDesc = el.parentElement.tagName.toLowerCase();
                if (el.parentElement.id) parentDesc += `#${el.parentElement.id}`;
                desc += ` (in ${parentDesc})`;
              }
              
              issues.push(desc);
            }
          }
        });
        
        return issues;
      }, { hasHtmlTag, hasBodyTag });
      
      if (missingIds.length > threshold) {
        console.warn(`⚠️ ${relPath}: ${missingIds.length} containers without IDs (threshold: ${threshold})`);
      }
      
      expect(missingIds.length, `Found ${missingIds.length} containers without IDs in ${relPath} (max ${threshold}):\n${missingIds.slice(0, 10).join('\n')}${missingIds.length > 10 ? '\n...' : ''}`).toBeLessThanOrEqual(threshold);
    });
  }
});
