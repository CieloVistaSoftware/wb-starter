/**
 * V3.0 SYNTAX COMPLIANCE
 * ======================
 * Validates that codebase uses v3.0 syntax standards.
 * 
 * RATIONALE: We moved away from `data-wb` because:
 * 1. The `data-` prefix is verbose and clutters HTML
 * 2. `<wb-card>` is cleaner and more semantic
 * 3. `x-ripple` for behaviors avoids the data- prefix entirely
 * 
 * ✅ PRIMARY (v3.0):
 *   - <wb-card> - Web component tags for components
 *   - x-ripple, x-draggable - Prefix for adding behaviors to elements
 * 
 * ⚠️ DEPRECATED:
 *   - data-wb="card" - Legacy fallback (still works, avoid in new code)
 * 
 * This test ensures we're migrating toward clean, semantic syntax.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const PAGES_DIR = 'pages';
const DEMOS_DIR = 'demos';
const PUBLIC_DIR = 'public';

// Files that are allowed to use data-wb (legacy demos, documentation)
const LEGACY_ALLOWED = [
  'data-wb-demo.html',
  'migration-guide.html',
  'legacy-syntax.html'
];

interface SyntaxViolation {
  file: string;
  line: number;
  content: string;
  suggestion: string;
}

function scanHtmlFile(filePath: string): SyntaxViolation[] {
  const violations: SyntaxViolation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const fileName = path.basename(filePath);
  
  // Skip allowed legacy files
  if (LEGACY_ALLOWED.includes(fileName)) {
    return violations;
  }
  
  // Skip code examples (inside <pre> or <code> tags)
  let inCodeBlock = false;
  
  lines.forEach((line, index) => {
    // Track code blocks
    if (line.includes('<pre') || line.includes('<code')) {
      inCodeBlock = true;
    }
    if (line.includes('</pre>') || line.includes('</code>')) {
      inCodeBlock = false;
      return;
    }
    
    // Skip if in code block
    if (inCodeBlock) return;
    
    // Check for data-wb="component" pattern (not data-wb="behavior behavior")
    // This catches: data-wb="card", data-wb="button", etc.
    const dataWbMatch = line.match(/data-wb="(\w+)"/);
    if (dataWbMatch) {
      const value = dataWbMatch[1];
      // Single word = likely a component that should be <wb-*>
      if (!value.includes(' ')) {
        violations.push({
          file: filePath,
          line: index + 1,
          content: line.trim().substring(0, 80),
          suggestion: `Use <wb-${value}> instead of data-wb="${value}"`
        });
      }
    }
  });
  
  return violations;
}

function scanDirectory(dir: string): SyntaxViolation[] {
  const violations: SyntaxViolation[] = [];
  
  if (!fs.existsSync(dir)) return violations;
  
  const files = fs.readdirSync(dir, { recursive: true }) as string[];
  
  for (const file of files) {
    if (typeof file !== 'string') continue;
    if (!file.endsWith('.html')) continue;
    
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isFile()) {
      violations.push(...scanHtmlFile(filePath));
    }
  }
  
  return violations;
}

test.describe('v3.0 Syntax Compliance', () => {
  
  test('pages/ uses <wb-*> tags instead of data-wb for components', () => {
    const violations = scanDirectory(PAGES_DIR);
    
    if (violations.length > 0) {
      console.log('\n⚠️  data-wb usage found (should migrate to <wb-*> tags):');
      violations.forEach(v => {
        console.log(`  ${v.file}:${v.line}`);
        console.log(`    ${v.content}`);
        console.log(`    → ${v.suggestion}\n`);
      });
    }
    
    // Warning only for now - will become error after migration complete
    // Current state: 167 violations, target: 0
    expect(violations.length, `Found ${violations.length} data-wb usages that should be <wb-*> tags`).toBeLessThanOrEqual(200);
  });
  
  test('demos/ uses <wb-*> tags instead of data-wb for components', () => {
    const violations = scanDirectory(DEMOS_DIR);
    
    if (violations.length > 0) {
      console.log('\n⚠️  data-wb usage found in demos:');
      violations.slice(0, 5).forEach(v => {
        console.log(`  ${v.file}:${v.line} → ${v.suggestion}`);
      });
      if (violations.length > 5) {
        console.log(`  ... and ${violations.length - 5} more`);
      }
    }
    
    // Demos may have more legacy code - higher threshold
    // Current state: 261 violations, target: 0
    expect(violations.length).toBeLessThanOrEqual(300);
  });
  
  test('public/ uses <wb-*> tags instead of data-wb for components', () => {
    const violations = scanDirectory(PUBLIC_DIR);
    
    if (violations.length > 0) {
      console.log('\n⚠️  data-wb usage found in public:');
      violations.forEach(v => {
        console.log(`  ${v.file}:${v.line} → ${v.suggestion}`);
      });
    }
    
    expect(violations.length).toBeLessThanOrEqual(10);
  });
});

test.describe('v3.0 Schema Format Compliance', () => {
  
  test('all component schemas have $view section', () => {
    const schemasDir = 'src/wb-models';
    const files = fs.readdirSync(schemasDir).filter(f => f.endsWith('.schema.json'));
    const missing: string[] = [];
    
    // Skip meta schemas
    const metaSchemas = ['behavior.schema.json', 'behaviors-showcase.schema.json', 'builder.schema.json', 'views.schema.json', 'card.base.schema.json', 'search-index.schema.json', 'demo.schema.json'];
    
    for (const file of files) {
      if (metaSchemas.includes(file)) continue;
      
      const schema = JSON.parse(fs.readFileSync(path.join(schemasDir, file), 'utf-8'));
      if (!schema.$view && !schema.demo) {
        missing.push(file);
      }
    }
    
    expect(missing, `Schemas missing $view: ${missing.join(', ')}`).toEqual([]);
  });
  
  test('all component schemas have $methods section', () => {
    const schemasDir = 'src/wb-models';
    const files = fs.readdirSync(schemasDir).filter(f => f.endsWith('.schema.json'));
    const missing: string[] = [];
    
    const metaSchemas = ['behavior.schema.json', 'behaviors-showcase.schema.json', 'builder.schema.json', 'views.schema.json', 'card.base.schema.json', 'search-index.schema.json', 'demo.schema.json'];
    
    for (const file of files) {
      if (metaSchemas.includes(file)) continue;
      
      const schema = JSON.parse(fs.readFileSync(path.join(schemasDir, file), 'utf-8'));
      if (!schema.$methods && !schema.demo) {
        missing.push(file);
      }
    }
    
    expect(missing, `Schemas missing $methods: ${missing.join(', ')}`).toEqual([]);
  });
  
  test('all component schemas have $cssAPI section', () => {
    const schemasDir = 'src/wb-models';
    const files = fs.readdirSync(schemasDir).filter(f => f.endsWith('.schema.json'));
    const missing: string[] = [];
    
    const metaSchemas = ['behavior.schema.json', 'behaviors-showcase.schema.json', 'builder.schema.json', 'views.schema.json', 'card.base.schema.json', 'search-index.schema.json'];
    
    for (const file of files) {
      if (metaSchemas.includes(file)) continue;
      
      const schema = JSON.parse(fs.readFileSync(path.join(schemasDir, file), 'utf-8'));
      if (!schema.$cssAPI && !schema.demo) {
        missing.push(file);
      }
    }
    
    expect(missing, `Schemas missing $cssAPI: ${missing.join(', ')}`).toEqual([]);
  });
  
  test('$view uses lowercase HTML tags', () => {
    const schemasDir = 'src/wb-models';
    const files = fs.readdirSync(schemasDir).filter(f => f.endsWith('.schema.json'));
    const violations: string[] = [];
    
    for (const file of files) {
      const schema = JSON.parse(fs.readFileSync(path.join(schemasDir, file), 'utf-8'));
      if (!schema.$view) continue;
      
      for (const part of schema.$view) {
        if (part.tag && part.tag !== part.tag.toLowerCase()) {
          violations.push(`${file}: "${part.tag}" should be "${part.tag.toLowerCase()}"`);
        }
      }
    }
    
    expect(violations, `Uppercase tags found: ${violations.join(', ')}`).toEqual([]);
  });
});

test.describe('x- Prefix Behavior Syntax', () => {
  
  test('behavior additions use x- prefix not data-wb', () => {
    // Check that adding behaviors to elements uses x- prefix
    // e.g., <button x-ripple> not <button data-wb="ripple">
    const violations: SyntaxViolation[] = [];
    
    const checkFile = (filePath: string) => {
      if (!fs.existsSync(filePath)) return;
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      // Behaviors that should use x- prefix
      const behaviors = ['ripple', 'tooltip', 'draggable', 'sortable', 'resizable'];
      
      lines.forEach((line, index) => {
        for (const behavior of behaviors) {
          // Check for data-wb="behavior" on native elements
          const pattern = new RegExp(`<(button|div|span|a|img)[^>]*data-wb="[^"]*${behavior}[^"]*"`);
          if (pattern.test(line)) {
            violations.push({
              file: filePath,
              line: index + 1,
              content: line.trim().substring(0, 60),
              suggestion: `Use x-${behavior} instead of data-wb="${behavior}"`
            });
          }
        }
      });
    };
    
    // Scan key directories
    if (fs.existsSync(PAGES_DIR)) {
      const files = fs.readdirSync(PAGES_DIR, { recursive: true }) as string[];
      files.filter(f => typeof f === 'string' && f.endsWith('.html'))
           .forEach(f => checkFile(path.join(PAGES_DIR, f)));
    }
    
    if (violations.length > 0) {
      console.log('\n⚠️  Behavior syntax should use x- prefix:');
      violations.slice(0, 5).forEach(v => {
        console.log(`  ${v.file}:${v.line} → ${v.suggestion}`);
      });
    }
    
    // Warning threshold
    expect(violations.length).toBeLessThanOrEqual(20);
  });
});
