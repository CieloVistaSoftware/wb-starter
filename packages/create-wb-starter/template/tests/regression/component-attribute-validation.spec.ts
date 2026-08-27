import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Behavior Attribute Validation — REGRESSION TEST
 *
 * Ensures wb-* behavior attributes conform to expected ranges and standards.
 * Suspicious values (e.g., 360px for cardhero height when 400-600px is norm)
 * are flagged for manual review.
 *
 * Root cause of bug #4: demos/site/cards.html had cardhero with height="360px"
 * which is suspiciously small (other cardheros use 400-500px).
 * Prevention: validate behavior attributes against known ranges.
 */

test.describe('Behavior Attribute Validation', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const htmlDir = path.join(__dirname, '../../');

  const getHtmlFiles = () => {
    const files: string[] = [];

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

    recurse(htmlDir);
    return files;
  };

  test('cardhero height must be in standard range (400px-600px)', () => {
    const htmlFiles = getHtmlFiles();
    const violations: string[] = [];

    htmlFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');

      // Match <div x-cardhero ...height="XXXpx"...>
      const heroPattern = /<div x-cardhero[^>]*height="(\d+)px"[^>]*>/g;
      let match;

      while ((match = heroPattern.exec(content)) !== null) {
        const heightValue = parseInt(match[1]);

        // Standard range: 400px - 600px (other cardheros use ~500px)
        if (heightValue < 400 || heightValue > 600) {
          const lineNum = content.substring(0, match.index).split('\n').length;
          violations.push(
            `${path.relative(htmlDir, file)}:${lineNum}: cardhero height="${heightValue}px" out of range [400-600]`
          );
        }
      }
    });

    expect(
      violations.length,
      `Found ${violations.length} cardhero height values outside standard range:\n${violations.join('\n')}`
    ).toBe(0);
  });

  test('x-progress value must be 0-100', () => {
    const htmlFiles = getHtmlFiles();
    const violations: string[] = [];

    htmlFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');

      // Match <progress value="XXX">
      const progressPattern = /<progress[^>]*value="(\d+(?:\.\d+)?)"[^>]*>/g;
      let match;

      while ((match = progressPattern.exec(content)) !== null) {
        const value = parseFloat(match[1]);

        if (value < 0 || value > 100) {
          const lineNum = content.substring(0, match.index).split('\n').length;
          violations.push(
            `${path.relative(htmlDir, file)}:${lineNum}: x-progress value="${value}" out of range [0-100]`
          );
        }
      }
    });

    expect(
      violations.length,
      `Found ${violations.length} x-progress values outside range:\n${violations.join('\n')}`
    ).toBe(0);
  });

  test('x-rating value must not exceed max', () => {
    const htmlFiles = getHtmlFiles();
    const violations: string[] = [];

    htmlFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');

      // Match <span x-rating value="X" max="Y">
      const ratingPattern = /<span x-rating[^>]*value="(\d+(?:\.\d+)?)"[^>]*max="(\d+(?:\.\d+)?)"[^>]*>/g;
      let match;

      while ((match = ratingPattern.exec(content)) !== null) {
        const value = parseFloat(match[1]);
        const max = parseFloat(match[2]);

        if (value > max) {
          const lineNum = content.substring(0, match.index).split('\n').length;
          violations.push(
            `${path.relative(htmlDir, file)}:${lineNum}: x-rating value="${value}" exceeds max="${max}"`
          );
        }
      }
    });

    expect(
      violations.length,
      `Found ${violations.length} x-rating values exceeding max:\n${violations.join('\n')}`
    ).toBe(0);
  });

  test('x-avatar size must be valid (xs, sm, md, lg, xl)', () => {
    const htmlFiles = getHtmlFiles();
    const violations: string[] = [];
    const validSizes = ['xs', 'sm', 'md', 'lg', 'xl'];

    htmlFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');

      // Match <span x-avatar ...size="XXX"...>
      const avatarPattern = /<span x-avatar[^>]*size="([^"]+)"[^>]*>/g;
      let match;

      while ((match = avatarPattern.exec(content)) !== null) {
        const size = match[1];

        if (!validSizes.includes(size)) {
          const lineNum = content.substring(0, match.index).split('\n').length;
          violations.push(
            `${path.relative(htmlDir, file)}:${lineNum}: x-avatar size="${size}" invalid (must be: ${validSizes.join(', ')})`
          );
        }
      }
    });

    expect(
      violations.length,
      `Found ${violations.length} x-avatar size values invalid:\n${violations.join('\n')}`
    ).toBe(0);
  });
});
