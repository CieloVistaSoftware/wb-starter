const fs = require('fs');
const content = fs.readFileSync('builder.html', 'utf8');
const lines = content.split('\n');

console.log('=== Page-related functions ===');
lines.forEach((line, i) => {
  if (line.includes('function') && (line.toLowerCase().includes('page') || line.includes('switchTo'))) {
    console.log(`${i + 1}: ${line.trim().substring(0, 100)}`);
  }
});

console.log('\n=== createPage calls ===');
lines.forEach((line, i) => {
  if (line.includes('createPage') || line.includes('addPage') || line.includes('new page')) {
    console.log(`${i + 1}: ${line.trim().substring(0, 100)}`);
  }
});
