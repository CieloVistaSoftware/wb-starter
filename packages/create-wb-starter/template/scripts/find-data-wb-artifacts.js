/**
 * Find all data-wb artifacts and generate migration queue
 * Scans HTML files for legacy syntax that should be migrated to <wb-*> custom elements
 * 
 * Usage: node scripts/find-data-wb-artifacts.js
 * Output: data/migration-queue.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Directories to scan
const SCAN_DIRS = [
  'pages',
  'demos',
  'public',
  'tests/views',
  'tests/parts'
];

// Files to exclude
const EXCLUDE_FILES = [
  'node_modules',
  '.git',
  'data'
];

// Regex to find data-wb attributes
const DATA_WB_REGEX = /]+)"/g;

// Mapping of data-wb values to custom element tags
const MIGRATION_MAP = {
  // Cards
  'card': 'wb-card',
  'cardimage': 'wb-cardimage',
  'cardvideo': 'wb-cardvideo',
  'cardhero': 'wb-cardhero',
  'cardprofile': 'wb-cardprofile',
  'cardpricing': 'wb-cardpricing',
  'cardstats': 'wb-cardstats',
  'cardtestimonial': 'wb-cardtestimonial',
  'cardproduct': 'wb-cardproduct',
  'cardnotification': 'wb-cardnotification',
  'cardfile': 'wb-cardfile',
  'cardlink': 'wb-cardlink',
  'cardhorizontal': 'wb-cardhorizontal',
  'cardoverlay': 'wb-cardoverlay',
  'carddraggable': 'wb-carddraggable',
  'cardexpandable': 'wb-cardexpandable',
  'cardminimizable': 'wb-cardminimizable',
  'cardbutton': 'wb-cardbutton',
  'cardportfolio': 'wb-cardportfolio',
  
  // UI Components
  'modal': 'wb-modal',
  'tooltip': 'wb-tooltip',
  'dropdown': 'wb-dropdown',
  'accordion': 'wb-accordion',
  'tabs': 'wb-tabs',
  'dialog': 'wb-dialog',
  'drawer': 'wb-drawer',
  
  // Feedback
  'toast': 'wb-toast',
  'badge': 'wb-badge',
  'progress': 'wb-progress',
  'spinner': 'wb-spinner',
  'avatar': 'wb-avatar',
  'chip': 'wb-chip',
  'alert': 'wb-alert',
  'skeleton': 'wb-skeleton',
  
  // Forms
  'input': 'wb-input',
  'textarea': 'wb-textarea',
  'select': 'wb-select',
  'checkbox': 'wb-checkbox',
  'switch': 'wb-switch',
  'rating': 'wb-rating',
  
  // Navigation
  'navbar': 'wb-navbar',
  
  // Data Display
  'table': 'wb-table',
  
  // Behaviors (these stay as x-prefix attributes, NOT custom elements)
  'ripple': 'x-ripple',
  'animate': 'x-animate',
  'parallax': 'x-parallax',
  'sticky': 'x-sticky',
  'scrollalong': 'x-scrollalong'
};

// Results storage
const results = {
  scanDate: new Date().toISOString(),
  totalFiles: 0,
  totalInstances: 0,
  byFile: {},
  byBehavior: {},
  migrationQueue: []
};

/**
 * Recursively get all HTML files in a directory
 */
function getHtmlFiles(dir, files = []) {
  const fullPath = path.join(ROOT, dir);
  
  if (!fs.existsSync(fullPath)) {
    return files;
  }
  
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    
    if (EXCLUDE_FILES.some(ex => entryPath.includes(ex))) {
      continue;
    }
    
    if (entry.isDirectory()) {
      getHtmlFiles(entryPath, files);
    } else if (entry.name.endsWith('.html')) {
      files.push(entryPath);
    }
  }
  
  return files;
}

/**
 * Scan a file for data-wb attributes
 */
function scanFile(filePath) {
  const fullPath = path.join(ROOT, filePath);
  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');
  
  const instances = [];
  
  lines.forEach((line, lineIndex) => {
    let match;
    DATA_WB_REGEX.lastIndex = 0; // Reset regex state
    
    while ((match = DATA_WB_REGEX.exec(line)) !== null) {
      const behavior = match[1];
      const migrateTo = MIGRATION_MAP[behavior] || `wb-${behavior}`;
      const isBehavior = migrateTo.startsWith('x-');
      
      instances.push({
        file: filePath,
        line: lineIndex + 1,
        column: match.index + 1,
        behavior,
        originalSnippet: line.trim().substring(0, 100),
        migrateTo,
        type: isBehavior ? 'behavior' : 'component',
        priority: getPriority(behavior)
      });
      
      // Track by behavior
      if (!results.byBehavior[behavior]) {
        results.byBehavior[behavior] = [];
      }
      results.byBehavior[behavior].push({
        file: filePath,
        line: lineIndex + 1
      });
    }
  });
  
  if (instances.length > 0) {
    results.byFile[filePath] = instances;
    results.totalInstances += instances.length;
    results.migrationQueue.push(...instances);
  }
  
  return instances.length;
}

/**
 * Get migration priority (1 = highest)
 */
function getPriority(behavior) {
  // High priority - most visible/common
  if (['card', 'modal', 'button', 'badge'].includes(behavior)) return 1;
  // Medium priority - frequently used
  if (['accordion', 'tabs', 'toast', 'tooltip'].includes(behavior)) return 2;
  // Lower priority - less common
  return 3;
}

/**
 * Main scan function
 */
function scan() {
  console.log('🔍 Scanning for data-wb artifacts...\n');
  
  const files = [];
  for (const dir of SCAN_DIRS) {
    getHtmlFiles(dir, files);
  }
  
  results.totalFiles = files.length;
  console.log(`Found ${files.length} HTML files to scan\n`);
  
  for (const file of files) {
    const count = scanFile(file);
    if (count > 0) {
      console.log(`  📄 ${file}: ${count} instances`);
    }
  }
  
  // Sort migration queue by priority, then by file
  results.migrationQueue.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.file.localeCompare(b.file);
  });
  
  // Generate summary
  results.summary = {
    totalFiles: results.totalFiles,
    filesWithDataWb: Object.keys(results.byFile).length,
    totalInstances: results.totalInstances,
    byBehaviorCount: Object.fromEntries(
      Object.entries(results.byBehavior)
        .map(([k, v]) => [k, v.length])
        .sort((a, b) => b[1] - a[1])
    )
  };
  
  // Write results
  const outputPath = path.join(ROOT, 'data', 'migration-queue.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION QUEUE SUMMARY');
  console.log('='.repeat(60));
  console.log(`\nTotal files scanned: ${results.totalFiles}`);
  console.log(`Files with data-wb: ${results.summary.filesWithDataWb}`);
  console.log(`Total instances: ${results.totalInstances}`);
  console.log(`\nBy behavior (top 10):`);
  
  const sorted = Object.entries(results.summary.byBehaviorCount).slice(0, 10);
  for (const [behavior, count] of sorted) {
    const target = MIGRATION_MAP[behavior] || `wb-${behavior}`;
    console.log(`  • ${behavior}: ${count} → ${target}`);
  }
  
  console.log(`\n✅ Results saved to: data/migration-queue.json`);
  console.log(`\nNext: Run 'node scripts/migrate-data-wb.js' to auto-migrate\n`);
}

// Run
scan();
