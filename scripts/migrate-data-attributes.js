/**
 * Data Attribute Migration Script
 * ================================
 * Migrates data-* attributes to the new WB standard:
 * - data-title → heading
 * - data-src → src (native)
 * - data-value → value (native)
 * - data-* (simple values) → * (no prefix)
 * - data-* (JSON) → KEEP as data-* (correct usage)
 * 
 * Usage:
 *   node scripts/migrate-data-attributes.js --dry-run   # Preview changes
 *   node scripts/migrate-data-attributes.js             # Apply changes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Directories to scan
const SCAN_DIRS = [
  'pages',
  'demos',
  'src',
  'public',
  'articles',
  'templates',
  'docs',
  'tests',
  'project-index.html',
  'index.html',
  'builder.html',
  'preview.html'
];

// File extensions to process
const EXTENSIONS = ['.html', '.js', '.ts'];

// Attributes that should use NATIVE names (no prefix)
const NATIVE_ATTRS = {
  'data-src': 'src',
  'data-href': 'href',
  'data-alt': 'alt',
  'data-value': 'value',
  'data-min': 'min',
  'data-max': 'max',
  'data-step': 'step',
  'data-placeholder': 'placeholder',
  'data-disabled': 'disabled',
  'data-checked': 'checked',
  'data-open': 'open',
  'data-hidden': 'hidden',
  'data-width': 'width',
  'data-height': 'height',
  'data-autoplay': 'autoplay',
  'data-loop': 'loop',
  'data-muted': 'muted',
  'data-controls': 'controls',
  'data-poster': 'poster',
  'data-loading': 'loading'
};

// Attributes that need RENAMED (per naming standard)
const RENAMED_ATTRS = {
  'data-title': 'heading',      // title causes browser tooltip
  'data-type': 'variant',       // type conflicts with input/button
  'data-content': 'description' // content is reserved
};

// Attributes to migrate (remove data- prefix, keep name)
const SIMPLE_ATTRS = [
  'data-subtitle',
  'data-subheading', 
  'data-label',
  'data-message',
  'data-icon',
  'data-variant',
  'data-size',
  'data-position',
  'data-align',
  'data-gap',
  'data-columns',
  'data-duration',
  'data-delay',
  'data-axis',
  'data-bounds',
  'data-grid',
  'data-handle',
  'data-trend',
  'data-trend-value',
  'data-badge',
  'data-plan',
  'data-price',
  'data-period',
  'data-cta',
  'data-cta-link',
  'data-cta-label',
  'data-show-eq',
  'data-volume',
  'data-pill',
  'data-elevated',
  'data-rounded',
  'data-outlined',
  'data-filled',
  'data-compact',
  'data-dismissible',
  'data-closable',
  'data-clickable',
  'data-hoverable',
  'data-expandable',
  'data-collapsible',
  'data-sortable',
  'data-filterable',
  'data-editable',
  'data-selectable',
  'data-resizable',
  'data-featured',
  'data-active',
  'data-selected',
  'data-error',
  'data-success',
  'data-color',
  'data-intensity',
  'data-speed'
];

// Attributes that should STAY as data-* (JSON/complex data)
const KEEP_DATA_PREFIX = [
  'data-items',
  'data-rows',
  'data-columns', // when it's JSON array, not a number
  'data-options',
  'data-config',
  'data-user',
  'data-points',
  'data-images',
  'data-tabs',
  'data-steps',
  'data-timeline',
  'data-chart',
  'data-series',
  'data-wb-ready',    // Internal state marker
  'data-wb-behavior', // Internal
  'data-last-order',  // Internal state
  'data-testid',      // Testing
  'data-cy'           // Cypress testing
];

// Stats
const stats = {
  filesScanned: 0,
  filesModified: 0,
  attributesMigrated: 0,
  attributesKept: 0,
  errors: []
};

// Build migration map
function buildMigrationMap() {
  const map = new Map();
  
  // Native attributes
  for (const [from, to] of Object.entries(NATIVE_ATTRS)) {
    map.set(from, { to, reason: 'native' });
  }
  
  // Renamed attributes
  for (const [from, to] of Object.entries(RENAMED_ATTRS)) {
    map.set(from, { to, reason: 'renamed' });
  }
  
  // Simple attributes (remove data- prefix)
  for (const attr of SIMPLE_ATTRS) {
    const to = attr.replace(/^data-/, '');
    map.set(attr, { to, reason: 'simple' });
  }
  
  return map;
}

const MIGRATION_MAP = buildMigrationMap();

// Check if a value looks like JSON
function isJsonValue(value) {
  if (!value) return false;
  const trimmed = value.trim();
  return (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
         (trimmed.startsWith('[') && trimmed.endsWith(']'));
}

// Process a single file
function processFile(filePath) {
  const ext = path.extname(filePath);
  if (!EXTENSIONS.includes(ext)) return;
  
  stats.filesScanned++;
  
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    stats.errors.push(`Failed to read ${filePath}: ${err.message}`);
    return;
  }
  
  const original = content;
  const changes = [];
  
  // Find all data-* attributes in HTML
  // Pattern: data-attr-name="value" or data-attr-name (boolean)
  const attrPattern = /\bdata-([a-z][a-z0-9-]*)(="[^"]*"|='[^']*'|(?=[\s>\/]))/gi;
  
  content = content.replace(attrPattern, (match, attrName, valuepart) => {
    const fullAttr = `data-${attrName}`;
    
    // Check if should keep data- prefix
    if (KEEP_DATA_PREFIX.includes(fullAttr)) {
      stats.attributesKept++;
      return match;
    }
    
    // Extract value to check if JSON
    let value = '';
    if (valuepart && valuepart.startsWith('=')) {
      value = valuepart.slice(2, -1); // Remove =" and "
    }
    
    // Keep data- prefix for JSON values
    if (isJsonValue(value)) {
      stats.attributesKept++;
      if (VERBOSE) {
        console.log(`  KEEP (JSON): ${fullAttr} in ${filePath}`);
      }
      return match;
    }
    
    // Check migration map
    const migration = MIGRATION_MAP.get(fullAttr);
    if (migration) {
      changes.push({ from: fullAttr, to: migration.to, reason: migration.reason });
      stats.attributesMigrated++;
      return `${migration.to}${valuepart || ''}`;
    }

    // Default behavior: convert any simple data-* attr to attr (remove data- prefix)
    // unless it's in KEEP_DATA_PREFIX or the value looks like JSON
    if (!KEEP_DATA_PREFIX.includes(fullAttr) && !isJsonValue(value)) {
      const to = attrName; // remove data- prefix
      changes.push({ from: fullAttr, to, reason: 'default-remove-prefix' });
      stats.attributesMigrated++;
      return `${to}${valuepart || ''}`;
    }

    // Unknown data-* attribute we preserve (JSON or explicitly kept)
    if (VERBOSE) console.log(`  KEEP (unknown/JSON): ${fullAttr} in ${filePath}`);
    stats.attributesKept++;
    return match;
  });
  
  // Also update JavaScript dataset access patterns
  // element.dataset.title → element.getAttribute('heading')
  // This is more complex, so we'll just report these
  
  if (content !== original) {
    stats.filesModified++;
    
    console.log(`\n📄 ${path.relative(ROOT, filePath)}`);
    for (const change of changes) {
      console.log(`   ${change.from} → ${change.to} (${change.reason})`);
    }
    
    if (!DRY_RUN) {
      try {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`   ✅ Saved`);
      } catch (err) {
        stats.errors.push(`Failed to write ${filePath}: ${err.message}`);
        console.log(`   ❌ Failed to save: ${err.message}`);
      }
    } else {
      console.log(`   (dry run - not saved)`);
    }
  }
}

// Walk directory recursively
function walkDir(dir) {
  const fullPath = path.join(ROOT, dir);
  
  if (!fs.existsSync(fullPath)) {
    return;
  }
  
  const stat = fs.statSync(fullPath);
  
  if (stat.isFile()) {
    processFile(fullPath);
    return;
  }
  
  if (stat.isDirectory()) {
    // Skip node_modules and hidden dirs
    const basename = path.basename(dir);
    if (basename === 'node_modules' || basename.startsWith('.')) {
      return;
    }
    
    const entries = fs.readdirSync(fullPath);
    for (const entry of entries) {
      walkDir(path.join(dir, entry));
    }
  }
}

// Main
console.log('═══════════════════════════════════════════════════════════');
console.log('  WB Data Attribute Migration');
console.log('═══════════════════════════════════════════════════════════');
console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (preview only)' : 'LIVE (applying changes)'}`);
console.log('');

for (const dir of SCAN_DIRS) {
  walkDir(dir);
}

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Summary');
console.log('═══════════════════════════════════════════════════════════');
console.log(`  Files scanned:      ${stats.filesScanned}`);
console.log(`  Files modified:     ${stats.filesModified}`);
console.log(`  Attributes migrated: ${stats.attributesMigrated}`);
console.log(`  Attributes kept:    ${stats.attributesKept}`);

if (stats.errors.length > 0) {
  console.log('');
  console.log('  Errors:');
  for (const err of stats.errors) {
    console.log(`    ❌ ${err}`);
  }
}

if (DRY_RUN && stats.filesModified > 0) {
  console.log('');
  console.log('  Run without --dry-run to apply changes.');
}

console.log('═══════════════════════════════════════════════════════════');
