#!/usr/bin/env node
/* scans pages/ and templates/ for inline style= occurrences and reports violations
   Allowed files must include a header comment matching: allow-inline-style
*/
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const scanDirs = ['pages', 'templates'];
const allowRegex = /allow-inline-style\b/i;
const styleRegex = /style\s*=\s*"/g;
let violations = [];

for (const dir of scanDirs) {
  const dirPath = path.join(root, dir);
  if (!fs.existsSync(dirPath)) continue;
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  const walk = (entries, base) => {
    for (const e of entries) {
      const p = path.join(base, e.name);
      if (e.isDirectory()) {
        walk(fs.readdirSync(p, { withFileTypes: true }), p);
        continue;
      }
      if (!/\.html?$/.test(e.name)) return;
      const src = fs.readFileSync(p, 'utf8');
      if (allowRegex.test(src.split(/\n/, 8).join('\n'))) continue; // header allow-list
      let m;
      while ((m = styleRegex.exec(src)) !== null) {
        const idx = m.index;
        const start = Math.max(0, idx - 40);
        const snippet = src.slice(start, Math.min(src.length, idx + 120)).replace(/\n/g, ' ');
        violations.push({ file: path.relative(root, p), index: idx, snippet });
      }
    }
  };
  walk(files, dirPath);
}

if (violations.length) {
  console.error('\nInline style violations detected:');
  for (const v of violations) {
    console.error(`- ${v.file}: ...${v.snippet}...`);
  }
  console.error('\nIf an inline style is unavoidable, add an allow comment to the top of the file: `<!-- allow-inline-style: reason -->`\n');
  process.exitCode = 2;
} else {
  console.log('OK - no disallowed inline styles found in pages/ or templates/');
}
