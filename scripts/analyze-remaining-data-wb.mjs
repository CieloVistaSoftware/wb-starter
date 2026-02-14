import fs from 'fs';
import path from 'path';

function findFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findFiles(full));
    else if (entry.name.endsWith('.spec.ts')) results.push(full);
  }
  return results;
}

const ROOT = process.cwd();
const files = findFiles(path.join(ROOT, 'tests'));
const cats = { html: [], selector: [], getAttr: [], dataset: [], legacy: [], comment: [], other: [] };

for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  const rel = path.relative(ROOT, f);
  lines.forEach((line, i) => {
    if (!line.includes('data-wb')) return;
    if (line.includes('data-wb-ready') || line.includes('data-wb-error')) return;
    
    const entry = `${rel}:${i + 1}: ${line.trim().substring(0, 120)}`;
    
    if (line.includes('Legacy') || line.includes('legacy')) cats.legacy.push(entry);
    else if (/data-wb="/.test(line)) cats.html.push(entry);
    else if (/\[data-wb/.test(line)) cats.selector.push(entry);
    else if (line.includes('getAttribute') && line.includes('data-wb')) cats.getAttr.push(entry);
    else if (line.includes('dataset.wb')) cats.dataset.push(entry);
    else if (line.trim().startsWith('//') || line.trim().startsWith('*')) cats.comment.push(entry);
    else cats.other.push(entry);
  });
}

console.log('=== CATEGORY COUNTS ===');
for (const [k, v] of Object.entries(cats)) {
  console.log(`${k}: ${v.length}`);
}

console.log('\n=== HTML (data-wb="...") ===');
cats.html.slice(0, 10).forEach(e => console.log(e));

console.log('\n=== SELECTOR ([data-wb...]) ===');
cats.selector.slice(0, 10).forEach(e => console.log(e));

console.log('\n=== getAttribute ===');
cats.getAttr.forEach(e => console.log(e));

console.log('\n=== dataset ===');
cats.dataset.forEach(e => console.log(e));

console.log('\n=== OTHER ===');
cats.other.slice(0, 20).forEach(e => console.log(e));
