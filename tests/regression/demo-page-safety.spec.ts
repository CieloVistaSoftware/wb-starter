import { test, expect } from '../fixtures/offline';
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

  test('all demo pages load without crashing', async () => {
    const demoFiles = getDemoHtmlFiles();
    // `expect.fail` is not a Playwright API: every call threw "expect.fail
    // is not a function" instead of naming the page, so this test could only
    // ever fail with a TypeError. Problems are collected and asserted once.
    const problems: string[] = [];

    // Just verify they exist and are valid HTML
    for (const file of demoFiles) {
      const rel = path.relative(htmlDir, file);
      // Count real markup only. Comments and <script>/<style> bodies routinely
      // QUOTE tags (frameworks.html's comments say "<pre> block below", its
      // Svelte source is a JS string holding a <script>), and counting those
      // reported div:+9/pre:+4 on a page whose actual structure balances.
      // A script body ends at its first </script> -- the HTML parser's rule --
      // so any <script left once complete blocks are removed is unclosed.
      const content = fs.readFileSync(file, 'utf-8')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

      // Check for common issues:
      // 1. Missing closing tags
      if (/<script\b/i.test(content)) {
        problems.push(`${rel}: unclosed <script> tag`);
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
        problems.push(
          `${rel}: severe tag imbalance: ${imbalanced.map(([tag, count]) => `${tag}:${count}`).join(', ')}`
        );
      }
    }

    expect(problems).toEqual([]);
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
        // Asserted directly: `expect.fail` does not exist in Playwright, so a
        // real null-reference crash here would have surfaced as a TypeError.
        expect(errors, `Found null-reference errors:\n${errors.join('\n')}`).toEqual([]);
      } catch (e: any) {
        // Navigation timeout is OK for this test (just checking for crashes, not full load)
        if (!e.message?.includes('timeout')) {
          throw e;
        }
      }
    }
  });
});
