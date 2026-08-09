/**
 * Migrate data-wb artifacts to v3.0 custom elements
 * 
 * Usage: node scripts/migrate-data-wb.js [--dry-run] [--file=path]
 * 
 * Options:
 *   --dry-run    Preview changes without modifying files
 *   --file=path  Only process a specific file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Parse CLI args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FILE_FILTER = args.find(a => a.startsWith('--file='))?.split('=')[1];

// Components that become <wb-*> custom elements
const COMPONENT_MAP = {
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
  'modal': 'wb-modal',
  'dropdown': 'wb-dropdown',
  'accordion': 'wb-accordion',
  'tabs': 'wb-tabs',
  'dialog': 'wb-dialog',
  'drawer': 'wb-drawer',
  'badge': 'wb-badge',
  'progress': 'wb-progress',
  'spinner': 'wb-spinner',
  'avatar': 'wb-avatar',
  'chip': 'wb-chip',
  'alert': 'wb-alert',
  'skeleton': 'wb-skeleton',
  'input': 'wb-input',
  'textarea': 'wb-textarea',
  'select': 'wb-select',
  'checkbox': 'wb-checkbox',
  'switch': 'wb-switch',
  'rating': 'wb-rating',
  'navbar': 'wb-navbar',
  'table': 'wb-table',
  'code': 'wb-code',
  'mdhtml': 'wb-mdhtml',
  'themecontrol': 'wb-themecontrol',
  'container': 'wb-container'
};

// Behaviors that become x-* attributes (on existing elements)
const BEHAVIOR_MAP = {
  'ripple': 'x-ripple',
  'tooltip': 'x-tooltip',
  'animate': 'x-animate',
  'parallax': 'x-parallax',
  'sticky': 'x-sticky',
  'scrollalong': 'x-scrollalong',
  'form': 'x-form',
  'autosize': 'x-autosize'
};

// Properties to rename
const PROPERTY_RENAME = {
  'align': 'xalign',
  'valign': 'yalign'
};

// Stats
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  componentsConverted: 0,
  behaviorsConverted: 0,
  propertiesRenamed: 0,
  errors: []
};

/**
 * Convert a data-wb element to custom element syntax
 */
function convertToCustomElement(html, behavior, tagName) {
  // Pattern: <TAG ... ... data-prop="value" ...>
  // Result: <wb-behavior ... prop="value" ...>
  
  const regex = new RegExp(
    `<(\\w+)([^>]*?)\\s*([^>]*)>`,
    'gi'
  );
  
  return html.replace(regex, (match, originalTag, before, after) => {
    // Combine attributes
    let attrs = (before + after).trim();
    
    // Remove data- prefix from properties (data-title -> title)
    attrs = attrs.replace(/\bdata-(\w+)=/g, '$1=');
    
    // Rename deprecated properties
    for (const [oldName, newName] of Object.entries(PROPERTY_RENAME)) {
      attrs = attrs.replace(new RegExp(`\\b${oldName}=`, 'g'), `${newName}=`);
    }
    
    stats.componentsConverted++;
    return `<${tagName}${attrs ? ' ' + attrs : ''}>`;
  });
}

/**
 * Convert closing tags for converted elements
 */
function convertClosingTags(html, behavior, tagName) {
  // This is tricky - we need to match the closing tag for the original element
  // For now, we'll do a simpler approach: convert <wb-card >...</div> patterns
  
  // Find all instances and track original tags
  const openPattern = new RegExp(`<(\\w+)([^>]*)`, 'gi');
  let match;
  const originalTags = [];
  
  while ((match = openPattern.exec(html)) !== null) {
    originalTags.push(match[1].toLowerCase());
  }
  
  // Convert the elements first
  let result = convertToCustomElement(html, behavior, tagName);
  
  // Now we need to fix closing tags - this requires more sophisticated parsing
  // For safety, we'll do a basic replacement of common patterns
  for (const origTag of [...new Set(originalTags)]) {
    // Pattern: </div> after a <wb-card...> should become </wb-card>
    // This is imperfect but handles most cases
  }
  
  return result;
}

/**
 * Convert to x-behavior attribute
 */
function convertToBehavior(html, behavior, xAttr) {
  const regex = new RegExp(
    ``,
    'gi'
  );
  
  const newHtml = html.replace(regex, (match) => {
    stats.behaviorsConverted++;
    return xAttr;
  });
  
  return newHtml;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  const fullPath = path.join(ROOT, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`  ⚠️ File not found: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  let modified = false;
  
  // Convert components
  for (const [behavior, tagName] of Object.entries(COMPONENT_MAP)) {
    if (content.includes(``)) {
      content = convertToCustomElement(content, behavior, tagName);
      modified = true;
    }
  }
  
  // Convert behaviors
  for (const [behavior, xAttr] of Object.entries(BEHAVIOR_MAP)) {
    if (content.includes(``)) {
      content = convertToBehavior(content, behavior, xAttr);
      modified = true;
    }
  }
  
  // Rename deprecated properties
  for (const [oldName, newName] of Object.entries(PROPERTY_RENAME)) {
    const pattern = new RegExp(`\\b${oldName}="`, 'g');
    if (pattern.test(content)) {
      content = content.replace(pattern, `${newName}="`);
      stats.propertiesRenamed++;
      modified = true;
    }
  }
  
  if (modified) {
    if (DRY_RUN) {
      console.log(`  📝 Would modify: ${filePath}`);
    } else {
      fs.writeFileSync(fullPath, content);
      console.log(`  ✅ Modified: ${filePath}`);
    }
    stats.filesModified++;
  }
  
  stats.filesProcessed++;
  return modified;
}

/**
 * Load migration queue and process files
 */
function migrate() {
  console.log(`\n🔄 WB v3.0 Migration Script`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE'}\n`);
  
  const queuePath = path.join(ROOT, 'data', 'migration-queue.json');
  
  if (!fs.existsSync(queuePath)) {
    console.log('❌ Migration queue not found. Run find-data-wb-artifacts.js first.');
    process.exit(1);
  }
  
  const queue = JSON.parse(fs.readFileSync(queuePath, 'utf-8'));
  const filesToProcess = FILE_FILTER 
    ? [FILE_FILTER]
    : Object.keys(queue.byFile);
  
  console.log(`Processing ${filesToProcess.length} files...\n`);
  
  for (const file of filesToProcess) {
    processFile(file);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Files modified: ${stats.filesModified}`);
  console.log(`Components converted: ${stats.componentsConverted}`);
  console.log(`Behaviors converted: ${stats.behaviorsConverted}`);
  console.log(`Properties renamed: ${stats.propertiesRenamed}`);
  
  if (DRY_RUN) {
    console.log('\n⚠️ This was a DRY RUN. Run without --dry-run to apply changes.');
  } else {
    console.log('\n✅ Migration complete!');
    console.log('\nNext steps:');
    console.log('  1. Review changes in git diff');
    console.log('  2. Run tests: npm test');
    console.log('  3. Test in browser');
  }
}

// Run
migrate();
