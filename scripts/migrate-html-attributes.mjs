/**
 * Phase 4: Migrate Legacy Attributes in HTML Files
 * 
 * Conversions:
 * - wb-cardhero title="..." → heading="..."
 * - wb-card title="..." → heading="..."
 * - wb-tab title="..." → label="..."
 * - notification-card type="..." → variant="..."
 * - x-toast type="..." → variant="..."
 * 
 * Run: node scripts/migrate-html-attributes.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const DRY_RUN = process.argv.includes('--dry-run');

// Directories to skip
const SKIP_DIRS = ['node_modules', '.git', 'dist', 'data/test-results', 'tmp_trace', '.playwright-artifacts'];

// Patterns to migrate
const MIGRATIONS = [
  // wb-cardhero title → heading
  {
    pattern: /(<wb-cardhero[^>]*)\stitle=/gi,
    replacement: '$1 heading=',
    description: 'wb-cardhero title → heading'
  },
  // wb-card title → heading (but NOT when it's inside a slot or attribute value)
  {
    pattern: /(<wb-card[^>]*)\stitle="([^"]*)"/gi,
    replacement: '$1 heading="$2"',
    description: 'wb-card title → heading'
  },
  // wb-tab title → label
  {
    pattern: /(<wb-tab[^>]*)\stitle="([^"]*)"/gi,
    replacement: '$1 label="$2"',
    description: 'wb-tab title → label'
  },
  // notification-card type → variant
  {
    pattern: /(<notification-card[^>]*)\stype="([^"]*)"/gi,
    replacement: '$1 variant="$2"',
    description: 'notification-card type → variant'
  },
  // x-toast type → variant (on any element with x-toast)
  {
    pattern: /(<[^>]*x-toast[^>]*)\stype="([^"]*)"/gi,
    replacement: '$1 variant="$2"',
    description: 'x-toast type → variant'
  }
];

function shouldSkip(path) {
  return SKIP_DIRS.some(skip => path.includes(skip));
}

function migrateFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let originalContent = content;
  let changes = [];
  
  for (const { pattern, replacement, description } of MIGRATIONS) {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      changes.push({ description, count: matches.length });
    }
  }
  
  if (content !== originalContent) {
    if (!DRY_RUN) {
      writeFileSync(filePath, content, 'utf-8');
    }
    return changes;
  }
  
  return null;
}

function scanDirectory(dir, results = {}) {
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    
    if (shouldSkip(fullPath)) continue;
    
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      scanDirectory(fullPath, results);
    } else if (item.endsWith('.html')) {
      const changes = migrateFile(fullPath);
      if (changes) {
        results[relative(ROOT, fullPath)] = changes;
      }
    }
  }
  
  return results;
}

console.log(DRY_RUN ? '🔍 DRY RUN - No files will be modified\n' : '🔧 MIGRATING HTML FILES\n');

const results = scanDirectory(ROOT);
const totalFiles = Object.keys(results).length;
const totalChanges = Object.values(results).reduce((sum, arr) => 
  sum + arr.reduce((s, c) => s + c.count, 0), 0
);

if (totalFiles === 0) {
  console.log('✅ No files need migration!');
} else {
  console.log(`Found ${totalChanges} changes in ${totalFiles} files:\n`);
  
  for (const [file, changes] of Object.entries(results)) {
    console.log(`📄 ${file}`);
    for (const c of changes) {
      console.log(`   ${c.description} (${c.count}x)`);
    }
  }
  
  if (DRY_RUN) {
    console.log('\n⚠️  Run without --dry-run to apply changes');
  } else {
    console.log('\n✅ Migration complete!');
  }
}

// Save results
const outputPath = 'data/migration-phase4-results.json';
writeFileSync(outputPath, JSON.stringify({ 
  timestamp: new Date().toISOString(),
  dryRun: DRY_RUN,
  totalFiles,
  totalChanges,
  files: results 
}, null, 2));
console.log(`\nResults saved to ${outputPath}`);
