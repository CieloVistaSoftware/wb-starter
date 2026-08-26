/**
 * Strip all x-ready class additions from behavior JS files.
 * Removes:
 *   element.classList.add('x-ready')
 *   element.classList.add("x-ready")
 *   btnEl.classList.add("x-ready")
 *   and variations with x-ready in a multi-class add
 */
import fs from 'fs';
import path from 'path';

const SRC_DIR = 'src/wb-viewmodels';
let totalRemoved = 0;
let filesChanged = 0;

function processDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(full);
    } else if (entry.name.endsWith('.js')) {
      processFile(full);
    }
  }
}

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  let content = original;
  let removed = 0;

  // Pattern 1: standalone x-ready add — entire line
  // e.g. element.classList.add('x-ready');
  //      btnEl.classList.add("x-ready");
  //      if (isCustom) element.classList.add("x-ready");
  content = content.replace(/^[ \t]*(?:if\s*\([^)]*\)\s*)?[\w.]+\.classList\.add\(\s*['"]x-ready['"]\s*\);?\s*\n/gm, (match) => {
    removed++;
    return '';
  });

  // Pattern 2: x-ready as part of multi-class add
  // e.g. element.classList.add('x-spinner', 'x-ready')
  //      element.classList.add("x-button", "x-ready")
  content = content.replace(/(\.classList\.add\([^)]*),\s*['"]x-ready['"]/g, (match, before) => {
    removed++;
    return before;
  });
  content = content.replace(/(\.classList\.add\(\s*)['"]x-ready['"]\s*,\s*/g, (match, before) => {
    removed++;
    return before;
  });

  // Pattern 3: x-ready in classList.remove cleanup
  content = content.replace(/,\s*['"]x-ready['"]/g, (match, offset) => {
    const context = content.substring(Math.max(0, offset - 50), offset + match.length);
    if (context.includes('classList.remove')) {
      removed++;
      return '';
    }
    return match;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    filesChanged++;
    totalRemoved += removed;
    console.log(`  ${removed} removed: ${path.relative(SRC_DIR, filePath)}`);
  }
}

console.log('Stripping x-ready from all behavior JS files...\n');
processDir(SRC_DIR);
console.log(`\nDone: ${totalRemoved} removals across ${filesChanged} files`);
