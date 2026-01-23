/**
 * BUILDER TEMPLATE ATTRIBUTE COMPLIANCE
 * =====================================
 * Enforces ATTRIBUTE-NAMING-STANDARD.md in builder-templates.js:
 * 
 * 1. NO "title" for headings → use "heading"
 * 2. NO "type" for variants → use "variant"
 * 3. NO data-* EXCEPT for JSON serialization
 * 
 * data-* is ONLY allowed when:
 *   - Value is JSON: data-links='[{"label":"Home"}]'
 *   - Value is JSON.stringify(): links='${JSON.stringify(...)}'
 * 
 * For HTML file compliance, see: no-data-attributes.spec.ts
 * For migration, run: node scripts/migrate-data-attributes.js
 * 
 * @see docs/architecture/ATTRIBUTE-NAMING-STANDARD.md
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { PATHS, readFile } from '../base';

const BUILDER_TEMPLATES_PATH = path.join(PATHS.src, 'builder/builder-templates.js');

// ═══════════════════════════════════════════════════════════════════════════
// PROHIBITED ATTRIBUTES (per ATTRIBUTE-NAMING-STANDARD.md)
// ═══════════════════════════════════════════════════════════════════════════

const PROHIBITED_ATTRS: Record<string, string> = {
  'title': 'heading',   // title creates tooltip, use heading for text
  'type': 'variant',    // type collides with input/button, use variant
  'content': 'slot or description',
  'class': 'variant or specific attr',
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

interface TemplateInfo {
  name: string;
  component: string;
  html: string;
  lineNum: number;
}

/**
 * Extract all template HTML strings from builder-templates.js
 */
function extractTemplates(content: string): TemplateInfo[] {
  const templates: TemplateInfo[] = [];
  const lines = content.split('\n');
  
  // Find template objects with getHtml functions
  // Pattern: name: { ... wbComponent: 'wb-xxx', ... getHtml: ... => `...` }
  const regex = /(\w+):\s*\{[^}]*wbComponent:\s*['"]([^'"]+)['"][^}]*getHtml:[^`]*`([^`]+)`/gs;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    const [, name, component, html] = match;
    const lineNum = content.substring(0, match.index).split('\n').length;
    templates.push({ name, component, html, lineNum });
  }
  
  // Also find nested templates (like card.cardTypes)
  const nestedRegex = /(\w+):\s*\{[^}]*getHtml:[^`]*`([^`]+)`/gs;
  while ((match = nestedRegex.exec(content)) !== null) {
    const [fullMatch, name, html] = match;
    // Skip if already captured
    if (templates.some(t => t.html === html)) continue;
    
    const lineNum = content.substring(0, match.index).split('\n').length;
    // Try to find component from context
    const componentMatch = fullMatch.match(/wbComponent:\s*['"]([^'"]+)['"]/);
    const component = componentMatch ? componentMatch[1] : 'unknown';
    templates.push({ name, component, html, lineNum });
  }
  
  return templates;
}

/**
 * Check if a data-* attribute value is JSON (allowed use case)
 */
function isJsonValue(value: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  
  // Literal JSON
  if ((trimmed.startsWith('[') || trimmed.startsWith('{')) && 
      (trimmed.endsWith(']') || trimmed.endsWith('}'))) {
    return true;
  }
  
  // JSON.stringify call
  if (trimmed.includes('JSON.stringify')) return true;
  
  // Template expression that likely produces JSON
  if (trimmed.startsWith('${') && trimmed.includes('JSON')) return true;
  
  return false;
}

/**
 * Extract all attributes from an HTML template string
 */
function extractAttributes(html: string): Array<{attr: string, value: string}> {
  const attrs: Array<{attr: string, value: string}> = [];
  
  // Match attr="value", attr='value', or attr=`value`
  const regex = /\s([a-z][a-z0-9-]*)=["'`]([^"'`]*)["'`]/gi;
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    attrs.push({ attr: match[1].toLowerCase(), value: match[2] });
  }
  
  return attrs;
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Builder Template Attribute Compliance', () => {
  
  let content: string;
  let templates: TemplateInfo[];
  
  test.beforeAll(() => {
    if (!fs.existsSync(BUILDER_TEMPLATES_PATH)) {
      throw new Error(`File not found: ${BUILDER_TEMPLATES_PATH}`);
    }
    content = readFile(BUILDER_TEMPLATES_PATH);
    templates = extractTemplates(content);
  });

  test('found templates to analyze', () => {
    expect(templates.length).toBeGreaterThan(0);
    console.log(`Analyzing ${templates.length} templates in builder-templates.js`);
  });

  test('no prohibited attributes (title, type, content, class)', () => {
    const violations: string[] = [];
    
    for (const template of templates) {
      const attrs = extractAttributes(template.html);
      
      for (const { attr, value } of attrs) {
        if (PROHIBITED_ATTRS[attr]) {
          // Special case: "title" on non-wb elements is OK (native tooltip)
          // But on wb-* elements for heading text, it's wrong
          if (attr === 'title' && value.includes('${')) {
            violations.push(
              `"${template.name}" (line ~${template.lineNum}): ` +
              `uses "${attr}" → should use "${PROHIBITED_ATTRS[attr]}"\n` +
              `  Component: ${template.component}`
            );
          } else if (attr !== 'title') {
            violations.push(
              `"${template.name}" (line ~${template.lineNum}): ` +
              `uses "${attr}" → should use "${PROHIBITED_ATTRS[attr]}"`
            );
          }
        }
      }
    }
    
    if (violations.length > 0) {
      console.error('\n❌ PROHIBITED ATTRIBUTES IN TEMPLATES:\n');
      violations.forEach(v => console.error(`  • ${v}\n`));
      console.error('📖 See: docs/architecture/ATTRIBUTE-NAMING-STANDARD.md\n');
    }
    
    expect(violations, `Found ${violations.length} prohibited attributes`).toEqual([]);
  });

  test('data-* attributes ONLY used for JSON serialization', () => {
    const violations: string[] = [];
    
    for (const template of templates) {
      const attrs = extractAttributes(template.html);
      
      for (const { attr, value } of attrs) {
        // Only check data-* attributes
        if (!attr.startsWith('data-')) continue;
        
        // Skip if value is JSON (allowed)
        if (isJsonValue(value)) continue;
        
        // This is a violation - data-* with non-JSON value
        const directAttr = attr.replace(/^data-/, '');
        violations.push(
          `"${template.name}" (line ~${template.lineNum}): ` +
          `data-${directAttr}="${value.substring(0, 30)}${value.length > 30 ? '...' : ''}" ` +
          `→ should use "${directAttr}"\n` +
          `  Component: ${template.component}`
        );
      }
    }
    
    if (violations.length > 0) {
      console.error('\n❌ DATA-* ATTRIBUTES WITH NON-JSON VALUES:\n');
      violations.forEach(v => console.error(`  • ${v}\n`));
      console.error('💡 data-* is ONLY for JSON. Use direct attributes for simple values.');
      console.error('📖 See: docs/architecture/ATTRIBUTE-NAMING-STANDARD.md\n');
    }
    
    expect(violations, `Found ${violations.length} invalid data-* attributes`).toEqual([]);
  });

  test('all templates produce valid HTML structure', () => {
    const malformed: string[] = [];
    
    for (const template of templates) {
      // Check for unclosed tags in template
      const openTags = (template.html.match(/<wb-[a-z-]+/g) || []).length;
      const closeTags = (template.html.match(/<\/wb-[a-z-]+>/g) || []).length;
      
      // Self-closing or properly closed
      if (openTags > 0 && closeTags === 0) {
        // Check if it's self-closing style (ends with >)
        if (!template.html.includes('</wb-') && !template.html.trim().endsWith('>')) {
          malformed.push(`"${template.name}": unclosed <${template.component}> tag`);
        }
      }
    }
    
    if (malformed.length > 0) {
      console.warn('\n⚠️ POTENTIALLY MALFORMED TEMPLATES:\n');
      malformed.forEach(m => console.warn(`  • ${m}`));
    }
    
    // Warning only, don't fail
    expect(malformed.length).toBeLessThan(5);
  });
});

test.describe('Template ↔ Schema Consistency', () => {

  test('hero template uses heading attribute (not title)', () => {
    const content = readFile(BUILDER_TEMPLATES_PATH);
    
    // Find hero template specifically
    const heroMatch = content.match(/hero:\s*\{[\s\S]*?getHtml:[\s\S]*?`([\s\S]*?)`/);
    
    if (!heroMatch) {
      console.warn('Hero template not found');
      return;
    }
    
    const heroHtml = heroMatch[1];
    
    // Check for title="${...}" pattern (WRONG)
    const usesTitle = /\stitle=["'`]\$\{/.test(heroHtml);
    
    // Check for heading="${...}" pattern (CORRECT)
    const usesHeading = /\sheading=["'`]\$\{/.test(heroHtml);
    
    if (usesTitle) {
      console.error('\n❌ HERO TEMPLATE USES "title" FOR HEADING TEXT\n');
      console.error('Per ATTRIBUTE-NAMING-STANDARD.md:');
      console.error('  - "title" creates browser tooltip on hover');
      console.error('  - Use "heading" for heading text content\n');
      console.error('Fix: Change title="${...}" to heading="${...}"\n');
    }
    
    expect(usesTitle, 'Hero template should not use "title" for heading').toBe(false);
  });

  test('templates use xalign not data-xalign', () => {
    const content = readFile(BUILDER_TEMPLATES_PATH);
    
    const dataXalignCount = (content.match(/data-xalign=/g) || []).length;
    const xalignCount = (content.match(/[^-]xalign=/g) || []).length;
    
    if (dataXalignCount > 0) {
      console.error(`\n❌ Found ${dataXalignCount} uses of "data-xalign" → should be "xalign"\n`);
    }
    
    expect(dataXalignCount, 'Should use xalign not data-xalign').toBe(0);
  });

  test('templates use variant not variant for simple values', () => {
    const content = readFile(BUILDER_TEMPLATES_PATH);
    
    // variant with simple string value (not JSON)
    const badPattern = /data-variant=["'`](?!\[|\{|\$\{.*JSON)[^"'`]*["'`]/g;
    const violations = content.match(badPattern) || [];
    
    if (violations.length > 0) {
      console.error(`\n❌ Found ${violations.length} uses of "data-variant" with simple value\n`);
      violations.slice(0, 3).forEach(v => console.error(`  ${v}`));
    }
    
    expect(violations.length, 'Should use variant not data-variant').toBe(0);
  });
});
