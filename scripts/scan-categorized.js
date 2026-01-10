/**
 * CATEGORIZED SCAN - Separate legitimate code refs from actual legacy usage
 */
import fs from 'fs';
import path from 'path';

const categories = {
  codeHandlers: [],    // Code that HANDLES data-wb (legitimate)
  schemaRefs: [],      // Schema documentation (legitimate)  
  legacyUsage: [],     // Actual legacy HTML usage (MUST FIX)
  docRefs: [],         // Documentation examples (should update)
  dataFiles: []        // Data files (ignore)
};

const SKIP = ['node_modules', '.git', 'dist', 'coverage'];

function categorize(filePath, line, lineNum, text) {
  const file = filePath.replace(/\\/g, '/');
  const entry = { file, line: lineNum, text: text.slice(0, 120) };
  
  // Data files - ignore
  if (file.startsWith('data/') || file.includes('/data/')) {
    categories.dataFiles.push(entry);
    return;
  }
  
  // Schema files - legitimate references
  if (file.includes('.schema.json')) {
    categories.schemaRefs.push(entry);
    return;
  }
  
  // Documentation - should update but not critical
  if (file.endsWith('.md')) {
    categories.docRefs.push(entry);
    return;
  }
  
  // Core code that PROCESSES data-wb - legitimate
  if (file.includes('/core/') || file.includes('wb-viewmodels/') || 
      file.includes('builder/') || file.includes('behaviorMeta') ||
      file.includes('scripts/')) {
    // Check if it's code processing vs actual usage
    if (line.includes('querySelector') || line.includes('getAttribute') ||
        line.includes('dataset.wb') || line.includes(''") ||
        line.includes('[data-wb') || line.includes('hasAttribute')) {
      categories.codeHandlers.push(entry);
      return;
    }
  }
  
  // Actual legacy usage in HTML/views - MUST FIX
  if (file.endsWith('.html') && 
      (file.includes('pages/') || file.includes('demos/') || 
       file.includes('wb-views/') || file.includes('public/'))) {
    categories.legacyUsage.push(entry);
    return;
  }
  
  // Default to code handlers for JS files
  if (file.endsWith('.js')) {
    categories.codeHandlers.push(entry);
  } else {
    categories.legacyUsage.push(entry);
  }
}

function scan(dir) {
  try {
    fs.readdirSync(dir).forEach(item => {
      if (SKIP.includes(item)) return;
      const fp = path.join(dir, item);
      if (fs.statSync(fp).isDirectory()) {
        scan(fp);
      } else if (/\.(html|js|md|json|css)$/i.test(item)) {
        if (item.includes('test-results') || item.includes('.temp')) return;
        const content = fs.readFileSync(fp, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (line.includes('x-behavior')) {
            categorize(fp, line, i + 1, line.trim());
          }
        });
      }
    });
  } catch (e) {}
}

scan('.');

console.log('='.repeat(60));
console.log('CATEGORIZED DATA-WB SCAN');
console.log('='.repeat(60));

console.log(`\n🔴 LEGACY USAGE (MUST FIX): ${categories.legacyUsage.length}`);
console.log(`🟡 DOCUMENTATION (should update): ${categories.docRefs.length}`);
console.log(`🟢 CODE HANDLERS (legitimate): ${categories.codeHandlers.length}`);
console.log(`🟢 SCHEMA REFS (legitimate): ${categories.schemaRefs.length}`);
console.log(`⚫ DATA FILES (ignore): ${categories.dataFiles.length}`);

console.log('\n' + '='.repeat(60));
console.log('FILES WITH LEGACY USAGE (MUST FIX):');
console.log('='.repeat(60));

const byFile = {};
categories.legacyUsage.forEach(r => {
  if (!byFile[r.file]) byFile[r.file] = [];
  byFile[r.file].push(r);
});

Object.keys(byFile).sort().forEach(file => {
  console.log(`\n📁 ${file} (${byFile[file].length})`);
  byFile[file].slice(0, 5).forEach(r => {
    console.log(`   L${r.line}: ${r.text.slice(0, 80)}`);
  });
  if (byFile[file].length > 5) {
    console.log(`   ... and ${byFile[file].length - 5} more`);
  }
});

fs.writeFileSync('data/data-wb-categorized.json', JSON.stringify(categories, null, 2));
