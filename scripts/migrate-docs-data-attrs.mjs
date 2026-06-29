/**
 * One-shot migration: rewrite legacy data-* attributes in the docs markdown
 * files to v3 plain attributes / x- behaviors. (#188)
 *
 *   data-wb="ripple tooltip"  ->  x-ripple x-tooltip      (behaviors stay on the element)
 *   data-wb-title="Hi"         ->  title="Hi"             (strip data-wb-)
 *   data-variant="primary"     ->  variant="primary"      (strip data-)
 *
 * Keeps the allowlist (data-theme, data-page). Idempotent.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DOCS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs');
const ALLOW = new Set(['theme', 'page']);

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git'].includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (e.name.endsWith('.md')) acc.push(full);
  }
  return acc;
}

function migrate(src) {
  let s = src;
  // 1. data-wb="a b c"  ->  x-a x-b x-c   (both quote styles + bare)
  s = s.replace(/data-wb=(["'])([^"']*)\1/g, (_m, _q, vals) =>
    vals.trim().split(/\s+/).filter(Boolean).map((v) => 'x-' + v).join(' ')
  );
  // 2. data-wb-REST(=...)  ->  REST(=...)   (strip the data-wb- prefix)
  s = s.replace(/\bdata-wb-([a-z0-9-]+)/g, '$1');
  // 3. a bare `data-wb` token with no value -> x-wb removed; treat as nothing useful
  s = s.replace(/\bdata-wb\b(?!-)/g, 'x-behavior');
  // 4. generic data-ATTR -> ATTR, except the allowlist
  s = s.replace(/\bdata-([a-z][a-z0-9-]*)/g, (m, attr) => (ALLOW.has(attr) ? m : attr));
  return s;
}

let changed = 0;
let remaining = 0;
for (const file of walk(DOCS)) {
  const orig = fs.readFileSync(file, 'utf8');
  const out = migrate(orig);
  if (out !== orig) {
    fs.writeFileSync(file, out);
    changed++;
  }
  // count any residual non-allowlisted data-*
  for (const m of out.matchAll(/\bdata-([a-z][a-z0-9-]*)/g)) {
    if (!ALLOW.has(m[1])) remaining++;
  }
}
console.log(`migrated ${changed} files; residual non-allowlisted data-* tokens: ${remaining}`);
