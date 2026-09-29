#!/usr/bin/env node
/**
 * Comprehensive legacy data-* audit (#224). The OLD report (find-data-attrs.js)
 * only matched `data-*` INSIDE a `<wb-*>` tag, so it missed data-* on NATIVE
 * elements (e.g. `<input type="range" data-show-value>`) and boolean data-*
 * (no `=`). That's why the audit "kept missing these".
 *
 * This scans all authored HTML + Markdown for EVERY `data-<name>` token — on any
 * element, valued or boolean — minus a small allowlist of framework/legit data-*.
 *
 * Output: data/data-attr-audit.json + a console report grouped by file and by attr.
 * Exit 1 if any offender is found (usable as a gate).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Legit / framework data-* that are NOT component config — keep these.
const ALLOW = new Set([
  'data-theme',       // theme hook (documentElement.dataset.theme)
  'data-page',        // SPA page marker
  'data-testid',      // test hooks
  'data-src',         // lazy-load source
  'data-wb',          // legacy marker, only in the excluded legacy-syntax file
]);
// Prefix allowlist (any data-attr starting with these is kept).
const ALLOW_PREFIX = ['data-preview-']; // theme-preview swatches on the themes page

const DIRS = ['demos', 'pages', 'public', 'articles', 'docs', 'src'];
const EXTS = new Set(['.html', '.md']);
const SKIP = new Set(['node_modules', '.git', 'test-results', '.playwright-artifacts', 'coverage', 'dist', 'out']);
const SKIP_FILES = new Set(['legacy-syntax-check.html']);

function walk(dir, out) {
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (SKIP.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (EXTS.has(path.extname(e.name)) && !SKIP_FILES.has(e.name)) out.push(abs);
  }
}

function isAllowed(name) {
  if (ALLOW.has(name)) return true;
  return ALLOW_PREFIX.some((p) => name.startsWith(p));
}

const files = [];
for (const d of DIRS) walk(path.join(ROOT, d), files);

const byFile = {};      // rel -> { attr -> count }
const byAttr = {};      // attr -> total count
let total = 0;

for (const abs of files) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
  const src = fs.readFileSync(abs, 'utf8');
  for (const m of src.matchAll(/\bdata-([a-z][a-z0-9-]*)/gi)) {
    const name = ('data-' + m[1]).toLowerCase();
    if (isAllowed(name)) continue;
    total++;
    byAttr[name] = (byAttr[name] || 0) + 1;
    (byFile[rel] = byFile[rel] || {})[name] = (byFile[rel][name] || 0) + 1;
  }
}

const fileList = Object.keys(byFile).sort((a, b) =>
  Object.values(byFile[b]).reduce((x, y) => x + y, 0) - Object.values(byFile[a]).reduce((x, y) => x + y, 0)
);
const attrList = Object.entries(byAttr).sort((a, b) => b[1] - a[1]);

fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data/data-attr-audit.json'),
  JSON.stringify({ total, files: byFile, attrs: byAttr }, null, 2));

console.log(`Legacy data-* audit — ${total} occurrence(s) across ${fileList.length} file(s).\n`);
console.log('By attribute:');
for (const [a, c] of attrList) console.log(`  ${String(c).padStart(4)}  ${a}`);
console.log('\nBy file:');
for (const rel of fileList) {
  const attrs = byFile[rel];
  const n = Object.values(attrs).reduce((x, y) => x + y, 0);
  console.log(`  ${String(n).padStart(4)}  ${rel}  (${Object.keys(attrs).sort().join(', ')})`);
}
console.log('\nWrote data/data-attr-audit.json');
process.exit(total > 0 ? 1 : 0);
