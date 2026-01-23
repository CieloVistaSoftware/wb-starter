const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dir = path.join(root, 'tests');
const out = path.join(__dirname, 'tests-data-wb-files.txt');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fp = path.join(dir, file);
    const stat = fs.statSync(fp);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fp));
    } else {
      results.push(fp);
    }
  });
  return results;
}

const files = walk(dir).filter(f => /\.(ts|js|tsx|jsx|html|md)$/.test(f));
const matches = new Set();
const re = /data-wb\b|x-legacy\b/;
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if (re.test(content)) matches.add(path.relative(root, f));
});

fs.writeFileSync(out, Array.from(matches).sort().join('\n'));
console.log('WROTE', out, matches.size);
