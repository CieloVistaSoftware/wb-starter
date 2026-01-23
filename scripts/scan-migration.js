/**
 * Scan for attribute migration issues
 * title= on wb-* should be heading=
 * type= on wb-* should be variant=
 */
import fs from 'fs';
import path from 'path';

const results = {
  titleOnWb: [],
  typeOnWb: [],
  titleOnOther: []
};

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, i) => {
    const lineNum = i + 1;
    
    // Check for title= on wb-* elements
    if (/<wb-[a-z-]+[^>]*\s+title=/.test(line)) {
      results.titleOnWb.push({
        file: filePath,
        line: lineNum,
        content: line.trim().substring(0, 100)
      });
    }
    
    // Check for type= on wb-* elements (not type="module")
    if (/<wb-[a-z-]+[^>]*\s+type=/.test(line) && !line.includes('type="module"')) {
      results.typeOnWb.push({
        file: filePath,
        line: lineNum,
        content: line.trim().substring(0, 100)
      });
    }
    
    // Check for title= on notification-card or other non-wb components
    if (/title=/.test(line) && !/<wb-/.test(line)) {
      // Check if it's a component that should use heading
      if (/<notification-card|<card-|<hero-/.test(line)) {
        results.titleOnOther.push({
          file: filePath,
          line: lineNum,
          content: line.trim().substring(0, 100)
        });
      }
    }
  });
}

function scanDir(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === 'node_modules' || item === '.git') continue;
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      scanDir(full);
    } else if (item.endsWith('.html')) {
      scanFile(full);
    }
  }
}

// Scan directories
['./pages', './demos', './src/wb-views'].forEach(dir => {
  if (fs.existsSync(dir)) {
    scanDir(dir);
  }
});

// Also check builder templates
const templateFiles = [
  './src/builder/builder-templates.js',
  './src/builder/builder-components.js'
];
templateFiles.forEach(f => {
  if (fs.existsSync(f)) {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (/title[:=]/.test(line) && /wb-|heading/.test(line)) {
        results.titleOnOther.push({
          file: f,
          line: i + 1,
          content: line.trim().substring(0, 100)
        });
      }
    });
  }
});

// Output results
fs.writeFileSync('./data/migration-scan.json', JSON.stringify(results, null, 2));

console.log('=== Attribute Migration Scan Results ===\n');
console.log('title= on wb-* elements:', results.titleOnWb.length);
console.log('type= on wb-* elements:', results.typeOnWb.length);
console.log('title= on other components:', results.titleOnOther.length);

if (results.titleOnWb.length > 0) {
  console.log('\n--- title= on wb-* (should be heading=) ---');
  results.titleOnWb.forEach(r => console.log(`${r.file}:${r.line}`));
}

if (results.typeOnWb.length > 0) {
  console.log('\n--- type= on wb-* (should be variant=) ---');
  results.typeOnWb.forEach(r => console.log(`${r.file}:${r.line}`));
}

const total = results.titleOnWb.length + results.typeOnWb.length;
console.log('\n' + (total === 0 ? '✅ No migration issues found!' : `⚠️ ${total} issues need fixing`));
console.log('\nFull results saved to data/migration-scan.json');
