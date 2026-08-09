/**
 * Migration script: Convert element.dataset.xxx to element.getAttribute('xxx')
 * in behavior JS files. Handles camelCase to kebab-case conversion.
 */
import fs from 'fs';

const files = [
  'src/wb-viewmodels/enhancements.js',
  'src/wb-viewmodels/navigation.js',
  'src/wb-viewmodels/feedback.js',
  'src/wb-viewmodels/media.js',
  'src/wb-viewmodels/effects.js',
  'src/wb-viewmodels/helpers.js',
  'src/wb-viewmodels/overlay.js',
  'src/wb-viewmodels/tabs.js',
  'src/wb-viewmodels/toggle.js',
  'src/wb-viewmodels/dropdown.js',
  'src/wb-viewmodels/tooltip.js',
  'src/wb-viewmodels/copy.js',
  'src/wb-viewmodels/darkmode.js',
  'src/wb-viewmodels/ripple.js',
  'src/wb-viewmodels/sticky.js',
];

// camelCase to kebab-case
function toKebab(str) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

let totalReplacements = 0;

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP (not found): ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let count = 0;
  
  // Pattern 1: element.dataset.camelCase (read)
  // e.g., element.dataset.tabTitle → element.getAttribute('tab-title')
  // e.g., element.dataset.items → element.getAttribute('items')
  content = content.replace(
    /(\w+)\.dataset\.(\w+)/g,
    (match, varName, prop) => {
      // Skip if it's an assignment (dataset.xxx = yyy) - handle separately
      const kebab = toKebab(prop);
      count++;
      return `${varName}.getAttribute('${kebab}')`;
    }
  );
  
  // Pattern 2: element.dataset.xxx = yyy (write) → element.setAttribute('xxx', yyy)
  // This was already converted above to element.getAttribute('xxx') = yyy which is wrong
  // Need to fix assignments
  content = content.replace(
    /(\w+)\.getAttribute\('([^']+)'\)\s*=/g,
    (match, varName, attr) => {
      // This is actually a SET, not a GET
      return `${varName}.setAttribute('${attr}',`;
    }
  );
  
  // Fix the setAttribute pattern - need closing paren
  // setAttribute('xxx', value) but we broke the = into setAttribute('xxx', 
  // The original was: element.dataset.xxx = value;
  // Now it's: element.setAttribute('xxx', value;  <- missing closing paren
  // We need: element.setAttribute('xxx', value);
  content = content.replace(
    /\.setAttribute\('([^']+)',\s*([^;]+);/g,
    (match, attr, value) => {
      return `.setAttribute('${attr}', ${value.trim()});`;
    }
  );
  
  if (count > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`${filePath}: ${count} replacements`);
    totalReplacements += count;
  } else {
    console.log(`${filePath}: no changes`);
  }
});

console.log(`\nTotal: ${totalReplacements} replacements across ${files.length} files`);
