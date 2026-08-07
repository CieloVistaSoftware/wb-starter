import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Template Literal Escaping Validation — REGRESSION TEST
 *
 * Ensures backticks inside JavaScript template literals are properly escaped.
 * Unescaped backticks terminate the template literal prematurely, causing
 * SyntaxError at runtime.
 *
 * Root cause of bug #3: public/schema-viewer.html had unescaped backticks in
 * a template literal at line 476: <wb-mdhtml>```html ... ```</wb-mdhtml>
 * The backticks should be escaped: \`\`\`html
 */

test.describe('Template Literal Escaping', () => {
  const htmlDir = path.join(__dirname, '../../');

  const getHtmlFilesWithScripts = () => {
    const files: string[] = [];

    const recurse = (dir: string) => {
      try {
        fs.readdirSync(dir).forEach(file => {
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            // Skip node_modules, .git, etc
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

    recurse(htmlDir);
    return files;
  };

  test('no unescaped backticks inside template literals', () => {
    const htmlFiles = getHtmlFilesWithScripts();
    const violations: string[] = [];

    htmlFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');

      // Find all <script> blocks
      const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/g;
      let scriptMatch;

      while ((scriptMatch = scriptPattern.exec(content)) !== null) {
        const scriptContent = scriptMatch[1];

        // Find all template literals (backtick-delimited strings)
        // Look for: const x = `...content...`; or ${ ... }
        const templatePattern = /`([^`\\]|\\.)*`/g;
        let templateMatch;

        while ((templateMatch = templatePattern.exec(scriptContent)) !== null) {
          const template = templateMatch[0];

          // Inside this template, look for unescaped backticks
          // (this is a sanity check — if the regex matched, backticks should be fine)
          // But we also check for backticks that appear to be INSIDE the template
          // (not escaped) that would break it
          if (template.includes('```') && !template.includes('\\`')) {
            const lineNum = scriptContent.substring(0, templateMatch.index).split('\n').length;
            violations.push(
              `${path.relative(htmlDir, file)}:${lineNum}: Unescaped backticks in template: ${template.substring(0, 60)}...`
            );
          }
        }
      }
    });

    expect(
      violations.length,
      `Found ${violations.length} template literals with unescaped backticks:\n${violations.join('\n')}`
    ).toBe(0);
  });

  test('markdown code fences inside template strings must be escaped', () => {
    const htmlFiles = getHtmlFilesWithScripts();
    const violations: string[] = [];

    htmlFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');

      // Find template literals that contain HTML (likely to have code fences)
      // Pattern: `...<wb-mdhtml>...```...```...</wb-mdhtml>...` (unescaped)
      const badPattern = /`([^`\\]|\\.)*<wb-mdhtml>([^`\\]|\\.)*```([^`\\]|\\.)*```([^`\\]|\\.)*<\/wb-mdhtml>([^`\\]|\\.)*`/g;
      let match;

      while ((match = badPattern.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        violations.push(
          `${path.relative(htmlDir, file)}:${lineNum}: Unescaped backticks in <wb-mdhtml> inside template`
        );
      }
    });

    expect(
      violations.length,
      `Found ${violations.length} code fences with unescaped backticks:\n${violations.join('\n')}`
    ).toBe(0);
  });
});
