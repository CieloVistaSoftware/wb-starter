import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = [];
const skipDirs = ['node_modules', 'archive', 'tmp', '.playwright-artifacts', 'test-results', '.git', 'data', 'playwright-report'];

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    if (skipDirs.includes(f)) continue;
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else {
      const ext = path.extname(f);
      if (!['.ts', '.js', '.html', '.md', '.json', '.css'].includes(ext)) continue;
      const content = fs.readFileSync(full, 'utf8');
      // Find references to builder.html
      if (content.includes('builder.html')) {
        const rel = path.relative(ROOT, full);
        const lines = content.split('\n');
        const hits = [];
        lines.forEach((line, i) => {
          if (line.includes('builder.html')) {
            hits.push(`L${i+1}: ${line.trim().substring(0, 140)}`);
          }
        });
        results.push({ file: rel, hits });
      }
    }
  }
}

walk(ROOT);
fs.writeFileSync(path.join(ROOT, 'data', 'builder-html-refs.json'), JSON.stringify(results, null, 2));
console.log(`Found ${results.length} files referencing builder.html`);
results.forEach(r => console.log(`  ${r.file} (${r.hits.length} refs)`));
