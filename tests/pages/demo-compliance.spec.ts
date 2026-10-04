/**
 * demo-compliance.spec.ts
 * 
 * Enforces page.schema.json contracts on ALL demos in demos/
 * Every demo MUST:
 *   1. Have <!DOCTYPE html>
 *   2. Have <html> with data-theme
 *   3. Have <meta charset> and <meta viewport>
 *   4. Have <title>
 *   5. If it uses x-* behaviors, must import WB
 */
import { test, expect } from '../fixtures/offline';
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

    // #1144: was "if uses wb-* components" -- <wb-*> tags are retired (4.0.0),
    // no demo has one, so the check had silently become a no-op. Behaviors are
    // x-* attributes now, and a demo using them without loading WB shows dead
    // markup.
    test('if it uses x-* behaviors, it must import WB', () => {
      const usesWB = /<[a-z][\w-]*\s[^>]*\bx-[a-z][\w-]*(?=[\s=>/])/i.test(html);
      // #1092: a demo with no x-* behaviors has nothing to check; report SKIPPED, not PASSED
      test.skip(!usesWB, `${file} uses no x-* behaviors, so it need not import WB`);
      const hasImport = /wb-lazy\.js|wb\.js/i.test(html);
      expect(hasImport, `${file} uses x-* behaviors but imports neither wb-lazy.js nor wb.js`).toBeTruthy();
    });
  });
}
