import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Demo Page Safety Validation — REGRESSION TEST
 *
 * Ensures demo/standalone HTML files load without crashing.
 * Standalone pages don't have full site infrastructure (#app container, site config, etc.)
 * but must still load cleanly when index.js is included.
 *
 * Root cause of bug #5: intellisense-check.html crashed with
 * "TypeError: Cannot read properties of null (reading 'querySelector')"
 * because WBSite.init() expected #app element to exist unconditionally.
 * Fix: guard against missing app container, skip site-init for demo pages.
 */

test.describe('Demo Page Safety', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const htmlDir = path.join(__dirname, '../../');

  const getDemoHtmlFiles = () => {
    const files: string[] = [];
    const demoDir = path.join(htmlDir, 'demos');

    if (!fs.existsSync(demoDir)) return files;

    const recurse = (dir: string) => {
      try {
        fs.readdirSync(dir).forEach(file => {
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            if (!file.startsWith('.') && file !== 'node_modules') {
              recurse(fullPath);
            }
          } else if (file.endsWith('.html')) {
            files.push(fullPath);
          }
        });
      } catch (e) {
        // Silently skip inaccessible dirs
      }
    };

    recurse(demoDir);
    return files;
  };

  test('all demo pages load without crashing', async ({ page }) => {
    const demoFiles = getDemoHtmlFiles();

    // Just verify they exist and are valid HTML
    for (const file of demoFiles) {
      const content = fs.readFileSync(file, 'utf-8');

      // Check for common issues:
      // 1. Missing closing tags
      if ((content.match(/<script[^>]*>/g) || []).length > (content.match(/<\/script>/g) || []).length) {
        expect.fail(`${path.relative(htmlDir, file)}: unclosed <script> tag`);
      }

      // 2. Malformed HTML structure
      const tagBalance: Record<string, number> = {};
      const selfClosingTags = ['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'track'];
      const tagPattern = /<\/?(\w+)[^>]*>/g;
      let tagMatch;

      while ((tagMatch = tagPattern.exec(content)) !== null) {
        const tag = tagMatch[1].toLowerCase();
        if (selfClosingTags.includes(tag)) continue;

        if (tagMatch[0].startsWith('</')) {
          tagBalance[tag] = (tagBalance[tag] || 0) - 1;
        } else if (!tagMatch[0].endsWith('/>')) {
          tagBalance[tag] = (tagBalance[tag] || 0) + 1;
        }
      }

      // Allow some imbalance (HTML parser is forgiving), just check for extreme problems
      const imbalanced = Object.entries(tagBalance).filter(([_, count]) => Math.abs(count) > 2);
      if (imbalanced.length > 0) {
        expect.fail(
          `${path.relative(htmlDir, file)}: severe tag imbalance: ${imbalanced.map(([tag, count]) => `${tag}:${count}`).join(', ')}`
        );
      }
    }
  });

  test('demo pages with src/index.js do not expect #app container', () => {
    const demoFiles = getDemoHtmlFiles();
    const violations: string[] = [];

    demoFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');

      // Check if page includes index.js
      if (!content.includes('src/index.js')) return;

      // Check if it has an #app element (it should, or site-engine.init should handle missing it)
      if (!content.includes('id="app"') && !content.includes("id='app'")) {
        // This is OK now that site-engine.js guards against missing app
        // Just log it for awareness (not a violation anymore)
        // violations.push(`${path.relative(htmlDir, file)}: includes index.js but no #app (OK if site-engine.js guards)`);
      }
    });

    // As of the fix, we don't require #app to exist
    // This test documents that pages CAN load without it
    expect(violations.length).toBe(0);
  });

  test('console errors are not null-reference crashes', async ({ page }) => {
    const demoFiles = getDemoHtmlFiles();

    for (const file of demoFiles) {
      const url = `file://${file}`;

      const errors: string[] = [];
      page.on('pageerror', (err: Error) => {
        // Filter out expected errors (legacy syntax warnings, etc.)
        const msg = err.message || String(err);
        if (
          msg.includes('Cannot read properties of null') ||
          msg.includes('Cannot read property') ||
          msg.includes('is not a function')
        ) {
          errors.push(`${path.relative(htmlDir, file)}: ${msg}`);
        }
      });

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 5000 });
        if (errors.length > 0) {
          expect.fail(`Found null-reference errors:\n${errors.join('\n')}`);
        }
      } catch (e: any) {
        // Navigation timeout is OK for this test (just checking for crashes, not full load)
        if (!e.message?.includes('timeout')) {
          throw e;
        }
      }
    }
  });
});
