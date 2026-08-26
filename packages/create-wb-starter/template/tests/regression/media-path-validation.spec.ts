import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Media Path Validation — REGRESSION TEST
 *
 * Ensures all media asset references (src, href) use absolute paths (/path/to/file)
 * not relative paths (path/to/file). Relative paths fail to resolve correctly when
 * served from different base URLs.
 *
 * Root cause of bug #1, #2: pages/components.html and pages/home.html referenced
 * audio files with relative paths ('demos/sample.wav') which didn't resolve.
 * Fix: all paths must start with / (absolute from domain root).
 */

test.describe('Media Path Validation', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const htmlDir = path.join(__dirname, '../../');
  const patterns = [
    'demos/**/*.html',
    'pages/**/*.html',
    'public/**/*.html',
    'index.html',
    'project-index.html'
  ];

  const getHtmlFiles = () => {
    const files: string[] = [];
    patterns.forEach(pattern => {
      const globPattern = path.join(htmlDir, pattern);
      const dir = path.dirname(globPattern).replace(/\/\*\*/, '');
      if (!fs.existsSync(dir)) return;

      const recurse = (dir: string) => {
        fs.readdirSync(dir).forEach(file => {
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            recurse(fullPath);
          } else if (file.endsWith('.html')) {
            files.push(fullPath);
          }
        });
      };
      recurse(dir);
    });
    return files;
  };

  test('all src attributes must use absolute paths (start with /)', () => {
    const htmlFiles = getHtmlFiles();
    const violations: string[] = [];

    htmlFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      // Match: src="...anything but /"... or src='...anything but /'...
      // Negative lookbehind for http/https to allow external URLs
      const relativePathPattern = /src=["'](?!\/|https?:|data:)[^"']+["']/g;
      let match;

      while ((match = relativePathPattern.exec(content)) !== null) {
        // Skip data: URIs and external URLs
        if (!match[0].includes('http') && !match[0].includes('data:')) {
          violations.push(`${path.relative(htmlDir, file)}: ${match[0]}`);
        }
      }
    });

    expect(
      violations.length,
      `Found ${violations.length} relative src paths (must be absolute /path):\n${violations.join('\n')}`
    ).toBe(0);
  });

  test('all href attributes in asset contexts must use absolute paths', () => {
    const htmlFiles = getHtmlFiles();
    const violations: string[] = [];

    htmlFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      // Match href on <link>, <script>, <img>, <video>, <audio>, <source>
      const linkPattern = /<(?:link|script|img|video|audio|source)[^>]+href=["'](?!\/|https?:|data:|#)[^"']+["'][^>]*>/g;
      let match;

      while ((match = linkPattern.exec(content)) !== null) {
        if (!match[0].includes('http') && !match[0].includes('data:')) {
          violations.push(`${path.relative(htmlDir, file)}: ${match[0].substring(0, 80)}...`);
        }
      }
    });

    expect(
      violations.length,
      `Found ${violations.length} relative href paths (must be absolute /path):\n${violations.join('\n')}`
    ).toBe(0);
  });

  test('audio/video src paths specifically validated', () => {
    const htmlFiles = getHtmlFiles();
    const violations: string[] = [];

    htmlFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      // Match <audio>, <video>, <audio>, <video> with src
      const mediaPattern = /<(?:wb-)?(?:audio|video)[^>]+src=["']([^"']+)["'][^>]*>/g;
      let match;

      while ((match = mediaPattern.exec(content)) !== null) {
        const srcValue = match[1];
        if (!srcValue.startsWith('/') && !srcValue.startsWith('http') && !srcValue.startsWith('data:')) {
          violations.push(`${path.relative(htmlDir, file)}: <audio/video> src="${srcValue}"`);
        }
      }
    });

    expect(
      violations.length,
      `Found ${violations.length} audio/video src paths with relative paths:\n${violations.join('\n')}`
    ).toBe(0);
  });
});
