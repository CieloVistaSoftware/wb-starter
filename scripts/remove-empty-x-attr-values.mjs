#!/usr/bin/env node
/**
 * Standard §20 (#261): boolean x-* attributes are written BARE — never x-ripple="".
 *
 * Finds every `x-<name>=""` (or `=''`) in the project's HTML and Markdown sources
 * and removes the worthless `=""`. A bare attribute is IDENTICAL per the HTML spec
 * (getAttribute returns "" either way), so this is a zero-behavior-change cleanup.
 *
 * Usage:
 *   node scripts/remove-empty-x-attr-values.mjs          # fix in place, report
 *   node scripts/remove-empty-x-attr-values.mjs --check  # report only, exit 1 if found
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

// Where authored markup + code samples live. NOT src JS (setAttribute('x-…','')
// is correct code) and NOT generated artifacts.
const DIRS = ['demos', 'pages', 'public', 'articles', 'docs', 'src/wb-views'];
const ROOT_FILES = ['index.html', 'README.md'];
const EXTS = new Set(['.html', '.md']);
const SKIP = new Set(['node_modules', '.git', 'data', 'test-results', '.playwright-artifacts', 'coverage', 'dist', 'out']);

// `x-name=""` preceded by whitespace (so max-width="" etc. can never match).
const RE = /(\s)(x-[a-z][a-z0-9-]*)=(""|'')/gi;

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

const files = [];
for (const d of DIRS) walk(path.join(ROOT, d), files);
for (const f of ROOT_FILES) { const abs = path.join(ROOT, f); if (fs.existsSync(abs)) files.push(abs); }

let totalHits = 0;
const touched = [];
for (const abs of files) {
  const src = fs.readFileSync(abs, 'utf8');
  const hits = [...src.matchAll(RE)];
  if (!hits.length) continue;
  totalHits += hits.length;
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
  touched.push(`${rel}: ${hits.length} (${[...new Set(hits.map((h) => h[2]))].join(', ')})`);
  if (!CHECK) fs.writeFileSync(abs, src.replace(RE, '$1$2'));
}

if (touched.length) {
  console.log(`${CHECK ? 'FOUND' : 'FIXED'} ${totalHits} x-*="" occurrence(s) in ${touched.length} file(s):`);
  for (const t of touched) console.log('  ' + t);
} else {
  console.log('Clean — no x-*="" occurrences.');
}
process.exit(CHECK && totalHits > 0 ? 1 : 0);
