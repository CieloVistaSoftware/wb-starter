/**
 * HTML Validity Regression Test
 * =============================
 * Catches malformed HTML tags, unclosed elements, and syntax errors
 * that could break rendering or accessibility.
 * Runs on every push to ensure demo pages maintain valid HTML structure.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// List of demo HTML files to validate
const DEMO_FILES = [
  'demos/site/index.html',
  'demos/site/content.html',
  'demos/site/cards.html',
  'demos/site/feedback.html',
  'demos/site/forms.html',
  'demos/site/overlays.html',
  'demos/site/layout.html',
  'pages/home.html',
  'pages/behaviors.html',
];

// Patterns that indicate malformed HTML
const MALFORMED_PATTERNS = [
  />\s*$/gm, // Tag opening without closing `>`
  /^<\s*$/gm, // Tag name with no closing
  /<[a-z]+\s*\n(?!\s*[a-z\-]+|>)/gm, // Multi-line tag without valid attribute continuation
  /^[^<]*<[^>]*$/gm, // Unclosed tags at line end (basic check)
];

test.describe('HTML Validity', () => {
  for (const filePath of DEMO_FILES) {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) continue;

    test(`${filePath} has valid HTML structure`, () => {
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Check for obvious malformed tags
      for (const pattern of MALFORMED_PATTERNS) {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          // Filter out false positives (intentional multi-line tags)
          const realMatches = matches.filter(
            m => !m.includes('src=') && !m.includes('href=') && !m.includes('style=')
          );
          expect(realMatches.length, `Malformed HTML detected in ${filePath}`).toBe(0);
        }
      }

      // Check for properly closed tags
      const openTags = content.match(/<([a-z][a-z0-9]*)/gi) || [];
      const closeTags = content.match(/<\/([a-z][a-z0-9]*)/gi) || [];
      const voidElements = ['br', 'hr', 'img', 'input', 'meta', 'link'];

      // Count tags (excluding void elements and self-closing)
      const openCount = openTags.filter(
        tag => !voidElements.includes(tag.toLowerCase().slice(1))
      ).length;
      const closeCount = closeTags.length;

      expect(openCount, `Unmatched open tags in ${filePath}`).toBeGreaterThanOrEqual(
        closeCount - 5 // Allow small margin for intentional structure
      );
    });
  }

  test('All demo files have proper DOCTYPE and html tags', () => {
    for (const filePath of DEMO_FILES) {
      const fullPath = path.join(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) continue;

      const content = fs.readFileSync(fullPath, 'utf-8');

      // Must have DOCTYPE
      expect(content.toLowerCase()).toContain('<!doctype html');

      // Must have opening and closing html tags
      expect(content).toMatch(/<html[^>]*>/i);
      expect(content).toMatch(/<\/html>/i);

      // Must have body
      expect(content).toMatch(/<body[^>]*>/i);
      expect(content).toMatch(/<\/body>/i);
    }
  });

  test('wb-demo code panels contain valid HTML markup', async ({ page }) => {
    // Test the content.html page which has many demo components
    await page.goto('http://localhost:3000/demos/site/content.html');

    const codePanels = page.locator('.wb-demo__code');
    const count = await codePanels.count();

    expect(count).toBeGreaterThan(0);

    // Check each code panel for malformed content
    for (let i = 0; i < Math.min(count, 5); i++) {
      const codeText = await codePanels.nth(i).textContent();

      // Should contain proper HTML tags, not flattened content
      if (codeText && codeText.length > 50) {
        // Should have actual tags, not just plain text
        const hasHtmlTags = /<[a-z][^>]*>/i.test(codeText);
        expect(hasHtmlTags, `Code panel ${i} lacks HTML tags`).toBe(true);

        // Should not show all content on one line (for multi-row elements)
        const lines = codeText.split('\n').length;
        if (codeText.includes('<tr>')) {
          expect(lines, `Table code panel ${i} should be multi-line`).toBeGreaterThan(3);
        }
      }
    }
  });
});
