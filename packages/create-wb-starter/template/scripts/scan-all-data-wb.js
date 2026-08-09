/**
 * FULL PROJECT SCAN - Find ALL data-wb artifacts (excluding temp files)
 */
import fs from 'fs';
import path from 'path';

const results = [];
const SKIP = ['node_modules', '.git', 'dist', 'coverage'];
const SKIP_FILES = ['.test-results-temp.json', 'test-results.json', 'package-lock.json'];

function scan(dir) {
  try {
    fs.readdirSync(dir).forEach(item => {
      if (SKIP.includes(item)) return;
      if (SKIP_FILES.includes(item)) return;
      const fp = path.join(dir, item);
      if (fs.statSync(fp).isDirectory()) {
        scan(fp);
      } else if (/\.(html|js|md|json|css)$/i.test(item)) {
        // Skip test result files
        if (item.includes('test-results') || item.includes('.temp')) return;
        
        const content = fs.readFileSync(fp, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (line.includes('x-behavior')) {
            results.push({ 
              file: fp.replace(/\\/g, '/'), 
              line: i + 1, 
              text: line.trim().slice(0, 150) 
            });
          }
        });
      }
    });
  } catch (e) {}
}

scan('.');

// Group by file
const byFile = {};
results.forEach(r => {
  if (!byFile[r.file]) byFile[r.file] = [];
  byFile[r.file].push(r);
});

console.log('='.repeat(60));
console.log('DATA-WB ARTIFACTS FOUND: ' + results.length + ' (excluding temp files)');
console.log('='.repeat(60));
console.log('\nFILES WITH DATA-WB:');

Object.keys(byFile).sort().forEach(file => {
  console.log('  ' + file + ': ' + byFile[file].length);
});

fs.writeFileSync('data/data-wb-sources.json', JSON.stringify({ total: results.length, files: Object.keys(byFile).sort(), byFile }, null, 2));
console.log('\nSaved to: data/data-wb-sources.json');
