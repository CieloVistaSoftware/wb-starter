import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * COMPLIANCE GATE: every stylesheet / script asset referenced by a page or site
 * schema (src/wb-models/**\/*.json) must resolve to a real file.
 *
 * page.json / site.json list `stylesheets` and `scripts` the page loader injects.
 * A stale entry — e.g. `../src/styles/components.css` after that file was
 * consolidated into site.css's behavior imports — 404s on EVERY page that
 * inherits it (page defaults), silently. Nothing caught it because no test
 * checked that these referenced files exist. This does.
 *
 * Paths in the schema are written `../src/…` relative to the served page (pages
 * live one level under the site root); resolve them from the repo root.
 */
const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.git', 'data', 'test-results', '.playwright-artifacts', 'coverage', 'dist', 'out']);

function walk(dir: string, out: string[]): void {
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (e.name.endsWith('.json')) out.push(path.relative(ROOT, abs).replace(/\\/g, '/'));
  }
}

function schemaFiles(): string[] {
  const out: string[] = [];
  walk(path.join(ROOT, 'src', 'wb-models'), out);
  return out;
}

// Collect every local asset path referenced under `stylesheets`/`scripts`.
function assetRefs(node: unknown, acc: string[]): void {
  if (Array.isArray(node)) { for (const n of node) assetRefs(n, acc); return; }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if ((k === 'stylesheets' || k === 'scripts') && Array.isArray(v)) {
        for (const item of v) {
          const p = typeof item === 'string' ? item : (item && typeof item === 'object' ? (item as any).src : null);
          if (typeof p === 'string' && !/^https?:/i.test(p)) acc.push(p);
        }
      }
      assetRefs(v, acc);
    }
  }
}

// A page served at <root>/pages/<x> (or the shell at <root>/) uses `../src/…`
// to reach repo-root/src. Strip leading `../` and `/` and resolve from ROOT.
function resolveAsset(ref: string): string {
  const clean = ref.replace(/^(\.\.\/)+/, '').replace(/^\/+/, '');
  return path.join(ROOT, clean);
}

test.describe('Schema-referenced stylesheets/scripts all exist', () => {
  for (const rel of schemaFiles()) {
    test(`${rel}: every stylesheet/script exists`, () => {
      let json: unknown;
      try { json = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')); }
      catch { return; } // malformed JSON is another gate's concern
      const refs: string[] = [];
      assetRefs(json, refs);
      const missing = [...new Set(refs)].filter((r) => !fs.existsSync(resolveAsset(r))).sort();

      expect(
        missing,
        `${rel} references asset(s) that don't exist (they 404 at runtime):\n  ` +
        `${missing.join('\n  ')}`
      ).toEqual([]);
    });
  }
});
