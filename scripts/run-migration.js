/**
 * Migrate legacy attributes on wb-* elements
 * title= → heading=
 * type= → variant=
 */
import fs from 'fs';
import path from 'path';

const stats = {
  filesProcessed: 0,
  titleMigrated: 0,
  typeMigrated: 0
};

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Migrate title= to heading= on wb-* elements
  // Match: <wb-something ... title="value"
  // Replace title= with heading= only within wb-* tags
  content = content.replace(/<wb-[a-z-]+[^>]*>/gi, (tag) => {
    if (/\stitle=/.test(tag)) {
      stats.titleMigrated++;
      return tag.replace(/\stitle=/, ' heading=');
    }
    return tag;
  });
  
  // Migrate type= to variant= on wb-* elements
  // Exclude type="module" which is for scripts
  content = content.replace(/<wb-[a-z-]+[^>]*>/gi, (tag) => {
    if (/\stype=/.test(tag) && !/type="module"/.test(tag)) {
      stats.typeMigrated++;
      return tag.replace(/\stype=/, ' variant=');
    }
    return tag;
  });
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    stats.filesProcessed++;
    console.log(`✓ ${filePath}`);
    return true;
  }
  return false;
}

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === 'node_modules' || item === '.git') continue;
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      processDir(full);
    } else if (item.endsWith('.html')) {
      migrateFile(full);
    }
  }
}

console.log('=== Attribute Migration ===\n');
console.log('title= → heading=');
console.log('type= → variant=\n');

// Process all HTML directories
['./pages', './demos', './src/wb-views'].forEach(dir => {
  processDir(dir);
});

console.log('\n=== Migration Complete ===');
console.log(`Files modified: ${stats.filesProcessed}`);
console.log(`title → heading: ${stats.titleMigrated}`);
console.log(`type → variant: ${stats.typeMigrated}`);
console.log(`Total changes: ${stats.titleMigrated + stats.typeMigrated}`);
