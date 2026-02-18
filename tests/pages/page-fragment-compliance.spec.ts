/**
 * page-fragment-compliance.spec.ts
 * 
 * Enforces fragment rules on ALL page fragments in pages/
 * 
 * Rules are defined in schema.schema.json (page schemaType) and
 * individual page schemas (e.g. home-page.schema.json).
 * 
 * RETIRED: page.schema.json — old requiredZones (.page__hero, .page__section)
 * are no longer required. Pages use $layout rows with headings instead.
 * 
 * Every page MUST:
 *   1. Be a fragment (no <!DOCTYPE>, <html>, <head>, <body>)
 *   2. Have no <style> blocks
 *   3. Not link to site.css or themes.css
 *   4. Not contain WB.init()
 *   5. Have an <h1> tag (page title — from hero or first row)
 *   6. Have at least one <h2> tag (section heading — from $layout rows)
 *   7. Have no more than 3 significant inline styles
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'pages');
const pageFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

for (const file of pageFiles) {
  test.describe(`Page Fragment: ${file}`, () => {
    let html: string;

    test.beforeAll(() => {
      html = fs.readFileSync(path.join(pagesDir, file), 'utf8');
    });

    test('must not contain <!DOCTYPE>', () => {
      expect(html.toLowerCase()).not.toContain('<!doctype');
    });

    test('must not contain <html> tag', () => {
      expect(html).not.toMatch(/<html[\s>]/i);
    });

    test('must not contain <head> tag', () => {
      // Exclude <thead> false positives
      const headMatches = html.match(/<head[\s>]/gi) || [];
      const realHeadTags = headMatches.filter(m => !html.substring(Math.max(0, html.indexOf(m) - 1), html.indexOf(m)).includes('t'));
      expect(realHeadTags.length).toBe(0);
    });

    test('must not contain <body> tag', () => {
      expect(html).not.toMatch(/<body[\s>]/i);
    });

    test('must not contain <style> blocks', () => {
      const styleBlocks = html.match(/<style[\s>]/gi) || [];
      expect(styleBlocks.length).toBe(0);
    });

    test('must not link to site.css', () => {
      expect(html).not.toMatch(/href=["'][^"']*site\.css/i);
    });

    test('must not link to themes.css', () => {
      expect(html).not.toMatch(/href=["'][^"']*themes\.css/i);
    });

    test('must not contain WB.init()', () => {
      expect(html).not.toMatch(/WB\.init\s*\(/i);
    });

    test('must have <h1> tag', () => {
      expect(html).toMatch(/<h1[\s>]/i);
    });

    test('must have at least one <h2> tag', () => {
      expect(html).toMatch(/<h2[\s>]/i);
    });

    test('must have no more than 3 significant inline styles', () => {
      // Strip <script> blocks — JS template literals contain style= strings
      // that aren't real HTML inline styles
      const htmlWithoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, '');

      // "Significant" = style attribute with 20+ chars of CSS
      // Exclude color-swatch patterns: style="background: hsl(...)" and
      // style="--hue: N;" and style="--angle: ..." (theme/harmony demos)
      const allInline = htmlWithoutScripts.match(/style\s*=\s*["'][^"']{20,}["']/gi) || [];
      const significantInline = allInline.filter(s => {
        const value = s.replace(/^style\s*=\s*["']/i, '').replace(/["']$/, '');
        // Allow single-property color swatches (background: hsl/rgb/hex)
        if (/^background:\s*(hsl|rgb|#)[^;]*;?$/.test(value.trim())) return false;
        // Allow CSS custom property single-setters (--hue, --angle)
        if (/^--[a-z-]+:\s*[^;]+;?$/.test(value.trim())) return false;
        return true;
      });

      // Visual showcase pages get a higher budget
      // hero-variants.html is a catalog of 12 hero styles — inline styles ARE the content
      const showcaseLimits: Record<string, number> = {
        'hero-variants.html': 120,
        'themes.html': 50,
        'components.html': 50
      };
      const limit = showcaseLimits[file] || 3;
      expect(significantInline.length).toBeLessThanOrEqual(limit);
    });
  });
}
