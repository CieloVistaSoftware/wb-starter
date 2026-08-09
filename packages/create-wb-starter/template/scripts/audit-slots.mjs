#!/usr/bin/env node
/**
 * "slot" audit. WB is Light-DOM composition — the shadow-DOM `<slot>` mechanism
 * (and `slot="…"` / `data-slot` / `data.slot`) is being RETIRED. This finds every
 * occurrence of the word "slot" and categorizes it so we can burn it down.
 *
 * Output: data/slot-audit.json + a grouped console report.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['src', 'demos', 'pages', 'public', 'articles', 'docs', 'tests'];
const EXTS = new Set(['.js', '.ts', '.mjs', '.html', '.md', '.json', '.css']);
const SKIP = new Set(['node_modules', '.git', 'lib', 'vendor', 'dist', 'out', 'test-results', 'coverage', '.playwright-artifacts']);

// Category patterns, most-specific first.
const CATS = [
  { key: '<slot> element', re: /<\/?slot[\s>]/i },
  { key: 'slot="…" attribute', re: /\bslot\s*=\s*["']/i },
  { key: '[slot] / [slot=] selector', re: /\[\s*slot\s*[\]=]/i },
  { key: 'data-slot', re: /data-slot/i },
  { key: 'JS .slot / data.slot / slotContent / slots', re: /\.slot\b|\.slots\b|\bslotcontent\b|data\.slot|slot:\s/i },
  { key: 'prose / comment / other', re: /slot/i },
];

function walk(dir, out) {
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (SKIP.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (EXTS.has(path.extname(e.name))) out.push(abs);
  }
}

function categorize(line) {
  for (const c of CATS) if (c.re.test(line)) return c.key;
  return null;
}

const files = [];
for (const d of DIRS) walk(path.join(ROOT, d), files);

const byFile = {};   // rel -> { total, cats: {cat: n} }
const byCat = {};    // cat -> n
let total = 0;

for (const abs of files) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
  const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    if (!/slot/i.test(line)) return;
    const cat = categorize(line);
    total++;
    byCat[cat] = (byCat[cat] || 0) + 1;
    const f = (byFile[rel] = byFile[rel] || { total: 0, cats: {} });
    f.total++; f.cats[cat] = (f.cats[cat] || 0) + 1;
  });
}

const fileList = Object.keys(byFile).sort((a, b) => byFile[b].total - byFile[a].total);
const catList = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data/slot-audit.json'),
  JSON.stringify({ total, byCat, byFile }, null, 2));

console.log(`"slot" audit — ${total} line(s) across ${fileList.length} file(s).\n`);
console.log('By category:');
for (const [c, n] of catList) console.log(`  ${String(n).padStart(4)}  ${c}`);
console.log('\nTop files:');
for (const rel of fileList.slice(0, 30)) {
  const cats = Object.entries(byFile[rel].cats).map(([c, n]) => `${c}:${n}`).join(', ');
  console.log(`  ${String(byFile[rel].total).padStart(4)}  ${rel}  (${cats})`);
}
console.log('\nWrote data/slot-audit.json');
