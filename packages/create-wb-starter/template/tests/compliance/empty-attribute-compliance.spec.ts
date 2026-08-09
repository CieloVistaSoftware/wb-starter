/**
 * EMPTY ATTRIBUTE ASSIGNMENT COMPLIANCE
 * ======================================
 * Validates that no HTML files use empty string assignments on attributes.
 * 
 * RULE: Boolean/behavior attributes use presence only.
 *   ✅ x-clock, x-toast, dismissible
 *   ❌ x-clock="", x-toast="", dismissible=""
 * 
 * This is Law: attributes with empty strings are prohibited.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface EmptyAttrViolation {
  file: string;
  line: number;
  attribute: string;
  content: string;
}

function scanForEmptyAttributes(filePath: string): EmptyAttrViolation[] {
  const violations: EmptyAttrViolation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Skip inside <script>, <style>, code blocks, and comments
  let inScript = false;
  let inStyle = false;
  let inCode = false;
  let inComment = false;

  lines.forEach((line, index) => {
    if (line.includes('<script')) inScript = true;
    if (line.includes('</script>')) { inScript = false; return; }
    if (line.includes('<style')) inStyle = true;
    if (line.includes('</style>')) { inStyle = false; return; }
    if (line.includes('<pre') || line.includes('<code')) inCode = true;
    if (line.includes('</pre>') || line.includes('</code>')) { inCode = false; return; }
    if (line.includes('<!--')) inComment = true;
    if (line.includes('-->')) { inComment = false; return; }

    if (inScript || inStyle || inCode || inComment) return;

    // Match attributes with ="" pattern
    // Captures: x-clock="", dismissible="", expanded=""
    const emptyAttrRegex = /\b(x-[\w-]+|dismissible|expanded|checked|disabled|autosize|pill|dot|outline|sortable|filterable|editable|hoverable|clickable|elevated|rounded|filled|compact|striped|animated|featured|active|selected|loading|resizable|draggable|collapsible|closable)=""/g;
    
    let match;
    while ((match = emptyAttrRegex.exec(line)) !== null) {
      violations.push({
        file: filePath,
        line: index + 1,
        attribute: match[1],
        content: line.trim().substring(0, 100)
      });
    }
  });

  return violations;
}

function scanDirectory(dir: string): EmptyAttrViolation[] {
  const violations: EmptyAttrViolation[] = [];
  if (!fs.existsSync(dir)) return violations;

  const files = fs.readdirSync(dir, { recursive: true }) as string[];
  for (const file of files) {
    if (typeof file !== 'string') continue;
    if (!file.endsWith('.html')) continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isFile()) {
      violations.push(...scanForEmptyAttributes(filePath));
    }
  }
  return violations;
}

test.describe('Empty Attribute Assignment Compliance', () => {

  test('behaviors-showcase.html has no empty attribute assignments', () => {
    const file = 'demos/behaviors-showcase.html';
    if (!fs.existsSync(file)) {
      test.skip();
      return;
    }
    const violations = scanForEmptyAttributes(file);

    if (violations.length > 0) {
      console.log('\n❌ Empty attribute assignments in behaviors-showcase.html:');
      violations.forEach(v => {
        console.log(`  Line ${v.line}: ${v.attribute}="" → should be just ${v.attribute}`);
        console.log(`    ${v.content}`);
      });
    }

    expect(violations.length, `Found ${violations.length} empty attribute assignments`).toBe(0);
  });

  test('pages/ have no empty attribute assignments', () => {
    const violations = scanDirectory('pages');

    if (violations.length > 0) {
      console.log('\n❌ Empty attribute assignments in pages/:');
      violations.slice(0, 20).forEach(v => {
        console.log(`  ${v.file}:${v.line} ${v.attribute}=""`);
      });
      if (violations.length > 20) console.log(`  ... and ${violations.length - 20} more`);
    }

    expect(violations.length, `Found ${violations.length} empty attribute assignments`).toBe(0);
  });

  test('demos/ have no empty attribute assignments', () => {
    const violations = scanDirectory('demos');

    if (violations.length > 0) {
      console.log('\n❌ Empty attribute assignments in demos/:');
      violations.slice(0, 20).forEach(v => {
        console.log(`  ${v.file}:${v.line} ${v.attribute}=""`);
      });
      if (violations.length > 20) console.log(`  ... and ${violations.length - 20} more`);
    }

    expect(violations.length, `Found ${violations.length} empty attribute assignments`).toBe(0);
  });
});
