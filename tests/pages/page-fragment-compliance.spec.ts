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

    let htmlWithoutCodeExamples: string;

    test.beforeAll(() => {
      html = fs.readFileSync(path.join(pagesDir, file), 'utf8');
      // Pages document their own usage (e.g. home.html's "One script does it
      // all" snippet) with escaped sample markup inside <pre><code>. That
      // sample legitimately shows a <link href="...site.css">/WB.init() call
      // as TEXT teaching how the shell page wires things up -- it isn't a
      // real tag/script this fragment is loading. Strip <pre> blocks before
      // scanning for real violations, same rationale as stripping <script>
      // blocks below for the inline-style check.
      // #820: also strip a standalone <code>. whats-new.html describes the
      // autoInject default in prose and names `WB.init({ autoInject: false })`
      // inside a bare <code> -- documentation text, not a call this fragment
      // makes. The rationale above already covers it; only the <pre> case was
      // implemented. Same shape as #555, where this same file was flagged by a
      // different gate for an illustrative code sample.
      htmlWithoutCodeExamples = html
        .replace(/<pre[\s\S]*?<\/pre>/gi, '')
        .replace(/<code[\s\S]*?<\/code>/gi, '');
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
      expect(htmlWithoutCodeExamples).not.toMatch(/href=["'][^"']*site\.css/i);
    });

    test('must not link to themes.css', () => {
      expect(htmlWithoutCodeExamples).not.toMatch(/href=["'][^"']*themes\.css/i);
    });

    test('must not contain WB.init()', () => {
      expect(htmlWithoutCodeExamples).not.toMatch(/WB\.init\s*\(/i);
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
        'behaviors.html': 50
      };
      const limit = showcaseLimits[file] || 3;
      expect(significantInline.length).toBeLessThanOrEqual(limit);
    });
  });
}
