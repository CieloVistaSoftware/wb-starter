// Search for data-wb artifacts
const fs = require('fs');
const path = require('path');

const results = [];

function scan(dir) {
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      if (item === 'node_modules' || item === '.git') continue;
      
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (/\.(html|js|md)$/.test(item)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');
          lines.forEach((line, i) => {
            // Look for x-legacy= patterns (old behavior syntax)
            if (line.includes('.');

console.log('Found', results.length, 'occurrences of x-legacy=\n');
results.forEach(r => {
  console.log(`${r.file}:${r.line}`);
  console.log(`  ${r.text}`);
  console.log('');
});

// Write to JSON for easier processing
fs.writeFileSync('data/data-wb-artifacts.json', JSON.stringify(results, null, 2));
console.log('\nResults saved to data/data-wb-artifacts.json');
