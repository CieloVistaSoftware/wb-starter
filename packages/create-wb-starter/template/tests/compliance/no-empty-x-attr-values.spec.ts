import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Standard §20 (#261): boolean x-* attributes are written BARE — `x-ripple`,
 * never `x-ripple=""`. The `=""` adds no value and lengthens what users type.
 *
 * Scans all authored HTML + Markdown (demos, pages, public, articles, docs,
 * src/wb-views, index.html) for `x-<name>=""` / `=''`.
 * Fix automatically with: node scripts/remove-empty-x-attr-values.mjs
 */
const ROOT = process.cwd();
const DIRS = ['demos', 'pages', 'public', 'articles', 'docs', 'src/wb-views'];
const ROOT_FILES = ['index.html', 'README.md'];
const EXTS = new Set(['.html', '.md']);
const SKIP = new Set(['node_modules', '.git', 'data', 'test-results', '.playwright-artifacts', 'coverage', 'dist', 'out']);
const RE = /(\s)(x-[a-z][a-z0-9-]*)=(""|'')/gi;

function walk(dir: string, out: string[]): void {
  let ents: fs.Dirent[];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (SKIP.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (EXTS.has(path.extname(e.name))) out.push(abs);
  }
}

test('no boolean x-* attribute carries a worthless ="" (§20)', () => {
  const files: string[] = [];
  for (const d of DIRS) walk(path.join(ROOT, d), files);
  for (const f of ROOT_FILES) { const abs = path.join(ROOT, f); if (fs.existsSync(abs)) files.push(abs); }

  const offenders: string[] = [];
  for (const abs of files) {
    const src = fs.readFileSync(abs, 'utf8');
    const hits = [...src.matchAll(RE)];
    if (hits.length) {
      offenders.push(
        `${path.relative(ROOT, abs).replace(/\\/g, '/')}: ${[...new Set(hits.map((h) => h[2] + '=""'))].join(', ')}`
      );
    }
  }
  expect(
    offenders,
    `x-*="" found — write boolean x-* attributes bare. Fix: node scripts/remove-empty-x-attr-values.mjs\n  ${offenders.join('\n  ')}`
  ).toEqual([]);
});
