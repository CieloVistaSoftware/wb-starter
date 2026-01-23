import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Files / directories to ignore while scanning
const IGNORES = new Set(['node_modules', '.git', 'data', 'dist', 'build', '.cache', 'scripts']);
// File extensions to scan
const SCAN_EXTS: string[] = ['.html', '.htm'];

// Allowed data-* attributes (for JSON data, framework internals, testing)
const ALLOWED_DATA_ATTRS = new Set([
  // JSON data containers (per ATTRIBUTE-NAMING-STANDARD.md)
  'data-items',
  'data-rows', 
  'data-columns-config',
  'data-config',
  'data-options',
  'data-user',
  'data-users',
  'data-points',
  'data-chart',
  'data-images',
  'data-events',
  'data-timeline',
  'data-features',
  'data-pricing',
  'data-testimonials',
  'data-navigation',
  'data-menu',
  'data-tabs',
  'data-steps',
  'data-filters',
  'data-sort',
  'data-pagination',
  'data-meta',
  'data-schema',
  'data-json',
  'data-video',
  
  // Framework internal state
  'data-wb-ready',
  'data-wb-behavior',
  'data-wb-deltas',
  'data-wb-last-drag',
  'data-last-order',
  'data-section',
  'data-component',
  'data-page',
  'data-index',
  'data-col',
  'data-variant', // when used with JSON value
  
  // Testing attributes
  'data-testid',
  'data-test',
  'data-cy',
]);

// Attributes that exist in themes.html for demo purposes
const DEMO_ALLOWED = new Set([
  'data-preview-theme',
]);

function walkDir(dir: string, fileList: string[] = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORES.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, fileList);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SCAN_EXTS.includes(ext)) fileList.push(full);
    }
  }
  return fileList;
}

function isJsonValue(value: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  return (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
         (trimmed.startsWith('[') && trimmed.endsWith(']'));
}

test('HTML files use proper attribute naming (no data-* for simple values)', async () => {
  const root = path.resolve(process.cwd());
  const files = walkDir(root);

  const violations: { file: string; line: number; attr: string; text: string }[] = [];

  // Match attr="value" or attr (boolean)
  const attrRegex = /\b(data-[a-zA-Z0-9_-]+)(?:=["']([^"']*)["'])?/g;

  for (const file of files) {
    const rel = path.relative(root, file);
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let m;
      attrRegex.lastIndex = 0;
      
      while ((m = attrRegex.exec(line)) !== null) {
        const attr = m[1];
        const value = m[2] || '';
        
        // Skip allowed attributes
        if (ALLOWED_DATA_ATTRS.has(attr)) continue;
        if (DEMO_ALLOWED.has(attr)) continue;
        
        // Skip if value is JSON (legitimate use)
        if (isJsonValue(value)) continue;
        
        // This is a violation - simple value using data-* prefix
        violations.push({
          file: rel,
          line: i + 1,
          attr,
          text: line.trim().substring(0, 100),
        });
      }
    }
  }

  if (violations.length > 0) {
    // Group by attribute
    const byAttr = new Map<string, typeof violations>();
    for (const v of violations) {
      if (!byAttr.has(v.attr)) byAttr.set(v.attr, []);
      byAttr.get(v.attr)!.push(v);
    }

    let out = `Found ${violations.length} data-* attributes that should be migrated:\n\n`;
    for (const [attr, occs] of byAttr.entries()) {
      const suggested = attr.replace(/^data-/, '');
      out += `❌ ${attr} → ${suggested} (${occs.length} occurrences)\n`;
      for (const o of occs.slice(0, 3)) {
        out += `   ${o.file}:${o.line}\n`;
      }
      if (occs.length > 3) out += `   ...and ${occs.length - 3} more\n`;
      out += '\n';
    }
    out += '\nRun: node scripts/migrate-data-attributes.js --dry-run';
    
    expect(violations.length, out).toBe(0);
  }
});
