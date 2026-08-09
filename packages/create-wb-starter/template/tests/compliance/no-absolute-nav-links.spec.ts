import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * COMPLIANCE GATE (#226): no domain-absolute internal nav/resource links in the
 * standalone HTML under pages/ and public/.
 *
 * These pages either inject into the SPA shell (pages/*.html — base is the site
 * root) or load standalone (public/*.html — base is their own dir). Under the
 * GitHub Pages PROJECT sub-path (`/wb-starter/`), any link that starts at the
 * DOMAIN root 404s:
 *   <a href="/public/doc-viewer.html">   → cielovistasoftware.github.io/public/…  ✗
 *   <a href="/pages/x.html">             → …/pages/x.html at domain root          ✗
 *   '/docs/' + doc.file                  → …/docs/x.md at domain root             ✗
 *   <link href="/src/styles/themes.css"> → …/src/styles/… at domain root          ✗
 * Local dev serves at `/`, so these pass by luck — which is exactly why the
 * doc-viewer dead-link bug (#226) shipped: clicking a doc card 404'd on deploy.
 *
 * Rule: internal links must be RELATIVE (resolve against the page's base) or
 * base-aware (`new URL(rel, import.meta.url)` / a computed site root). External
 * URLs (`https://`, protocol-relative `//`) and comments are ignored.
 */
const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.git', 'data', 'test-results', '.playwright-artifacts', 'coverage', 'dist', 'out']);

// A domain-absolute path literal (leading slash) into a known internal dir, as it
// appears in an href/src attribute or a JS string. Relative (`../src/`, `docs/`)
// and external (`https://`, `//`) forms don't start with a bare `/dir/`, so they
// don't match.
const OFFENDER = /['"`]\/(?:public|pages|docs|src|assets|node_modules|styles|wb-models|wb-views|lib)\//g;

function walk(dir: string, exts: string[], out: string[]): void {
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, exts, out);
    else if (exts.some((x) => e.name.endsWith(x))) out.push(path.relative(ROOT, abs).replace(/\\/g, '/'));
  }
}

// Strip comments so documentation/usage examples don't false-positive: HTML
// `<!-- … -->`, JS block `/* … */`, and JS line `//…` (guarding `https://`).
function stripComments(src: string): string {
  let out = src.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
  out = out.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  out = out.replace(/(^|[^:])\/\/[^\n]*/g, (_m, p1) => p1);
  return out;
}

function files(): string[] {
  const out: string[] = [];
  for (const dir of ['pages', 'public']) walk(path.join(ROOT, dir), ['.html'], out);
  return [...new Set(out)];
}

test.describe('No domain-absolute internal links in pages/ + public/ (#226)', () => {
  for (const rel of files()) {
    test(`${rel}: no domain-absolute internal links`, () => {
      const raw = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      const src = stripComments(raw);
      const hits = [...src.matchAll(OFFENDER)].map((m) => m[0].slice(1)); // drop the quote
      const offenders = [...new Set(hits)].sort();

      expect(
        offenders,
        `${rel} uses domain-absolute internal links that 404 under a sub-path base (e.g. /wb-starter/).\n  ` +
        `${offenders.join('\n  ')}\n  Make them relative (resolve against the page base) or base-aware. (#226)`
      ).toEqual([]);
    });
  }
});
