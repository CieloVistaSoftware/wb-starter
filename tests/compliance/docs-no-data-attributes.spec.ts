/**
 * v3 docs must use PLAIN attributes, not data-*.
 *
 * v3 components read bare attributes (title, variant, size, message, …); the
 * legacy data-* / data-wb syntax is back-compat only and must not appear in the
 * documentation's examples. This audit scans every markdown file under docs/ and
 * fails with the full list of offenders so they can be migrated.
 *
 * Genuinely-legitimate data-* (not WB component conventions) are allowlisted:
 *  - data-theme  — the theme system attribute on <html>
 *  - data-page   — SPA route marker
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ALLOW = new Set(['data-theme', 'data-page']);
const DOCS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs');

function mdFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) mdFiles(full, acc);
    else if (entry.name.endsWith('.md')) acc.push(full);
  }
  return acc;
}

test('docs use plain v3 attributes, not data-* (audit)', () => {
  const offenders: { file: string; attrs: string[] }[] = [];

  for (const file of mdFiles(DOCS_DIR)) {
    const text = fs.readFileSync(file, 'utf8');
    const found = new Set<string>();
    // Only real attribute USAGE (data-x=…), not prose mentions or filenames like
    // "demos-no-legacy-data-attrs.spec.ts". Consistent with the demos gate.
    for (const m of text.matchAll(/\bdata-[a-z][a-z0-9-]*(?==)/g)) {
      const attr = m[0];
      if (!ALLOW.has(attr)) found.add(attr);
    }
    if (found.size) offenders.push({ file: path.relative(DOCS_DIR, file), attrs: [...found].sort() });
  }

  const report = offenders
    .map((o) => `  ${o.file}  →  ${o.attrs.join(', ')}`)
    .join('\n');
  const totalAttrs = offenders.reduce((n, o) => n + o.attrs.length, 0);

  expect(
    offenders,
    `${offenders.length} doc(s) use legacy data-* attributes (${totalAttrs} distinct) — v3 docs must use plain attributes:\n${report}`
  ).toEqual([]);
});
