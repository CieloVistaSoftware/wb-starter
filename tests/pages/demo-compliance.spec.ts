/**
 * demo-compliance.spec.ts
 * 
 * Enforces page.schema.json contracts on ALL demos in demos/
 * Every demo MUST:
 *   1. Have <!DOCTYPE html>
 *   2. Have <html> with data-theme
 *   3. Have <meta charset> and <meta viewport>
 *   4. Have <title>
 *   5. If uses wb-* components, must import WB
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const demosDir = path.join(process.cwd(), 'demos');
const demoFiles = fs.readdirSync(demosDir).filter(f => f.endsWith('.html'));

for (const file of demoFiles) {
  test.describe(`Demo: ${file}`, () => {
    let html: string;

    test.beforeAll(() => {
      html = fs.readFileSync(path.join(demosDir, file), 'utf8');
    });

    test('must have <!DOCTYPE html>', () => {
      expect(html.toLowerCase()).toContain('<!doctype');
    });

    test('must have <html> tag', () => {
      expect(html).toMatch(/<html[\s>]/i);
    });

    test('must have data-theme attribute', () => {
      expect(html).toContain('data-theme');
    });

    test('must have <meta charset>', () => {
      expect(html.toLowerCase()).toContain('charset');
    });

    test('must have <meta viewport>', () => {
      expect(html.toLowerCase()).toContain('viewport');
    });

    test('must have <title> tag', () => {
      expect(html).toMatch(/<title>/i);
    });

    test('if uses wb-* components, must import WB', () => {
      const usesWB = /<wb-[a-z]/i.test(html);
      if (usesWB) {
        const hasImport = /wb-lazy\.js|wb\.js/i.test(html);
        expect(hasImport).toBeTruthy();
      }
    });
  });
}
