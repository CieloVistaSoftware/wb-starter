import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build', 'coverage', 'test-results'];

function getHtmlFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  
  const files: string[] = [];
  
  function scan(directory: string) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!EXCLUDE_DIRS.includes(entry.name)) {
          scan(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return files;
}

const htmlFiles = getHtmlFiles(ROOT);

test.describe('HTML Compliance: ID Attributes', () => {
  
  for (const filePath of htmlFiles) {
    const relativePath = path.relative(ROOT, filePath);
    
    test(`File ${relativePath} should have IDs on containers with >1 children`, async ({ page }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Determine if the file is a full document or a partial
      const hasHtmlTag = /<html/i.test(content);
      const hasBodyTag = /<body/i.test(content);

      // Load HTML content into the page
      await page.setContent(content);
      
      // Check for elements with >1 children but no ID
      const missingIds = await page.evaluate(({ hasHtmlTag, hasBodyTag }) => {
        const issues: string[] = [];
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(el => {
          const tagName = el.tagName.toLowerCase();

          // Skip implicit html/body if they weren't in the source
          if (tagName === 'html' && !hasHtmlTag) return;
          if (tagName === 'body' && !hasBodyTag) return;

          // Skip <head>, <script>, <style>, <link>, <meta>, <title> as they are metadata
          // But user said "all elements", so let's be strict but maybe exclude head children if they are not containers?
          // Actually, <head> usually has multiple children (meta, title, link). It should have an ID.
          // <html> has head and body. It should have an ID.
          // <body> has content. It should have an ID.
          
          // Check if it's a container (more than 1 child element)
          if (el.children.length > 1) {
            if (!el.hasAttribute('id') || el.getAttribute('id') === '') {
              // Generate a selector or description for the element
              let desc = tagName;
              if (el.className) desc += `.${el.className.split(' ').join('.')}`;
              
              // Add some context (parent)
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
      
      expect(missingIds, `Found ${missingIds.length} containers without IDs in ${relativePath}:\n${missingIds.join('\n')}`).toEqual([]);
    });
  }
});
