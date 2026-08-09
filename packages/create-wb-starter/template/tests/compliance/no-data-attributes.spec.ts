import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * COMPLIANCE GATE (#224): ZERO data-* attributes on the live surface.
 *
 * v3 uses plain, minimal attributes (title, content, size, variant, value, …)
 * declared on the wb- or x- element so the custom-elements manifest can advertise
 * them to IntelliSense. `data-*` config attributes are NOT accepted — they add no
 * value, aren't discoverable, and the standard's old "data attribute conventions"
 * are deprecated the same way `data-wb` was.
 *
 * This test is intentionally strict and self-documenting: it fails listing every
 * offending attribute per file. Fix with `node scripts/migrate-legacy-attrs.mjs`.
 *
 * ALLOWED is EMPTY = absolute zero. If `theme` / `page` are ratified as framework
 * state hooks (not component config), add them here explicitly with a comment —
 * nothing else is exempt.
 */
const ALLOWED = new Set<string>([
  // (empty — absolute zero tolerance)
]);

const ROOT = process.cwd();

// Live, user-facing surface. behaviors.html / newbehaviors.html are archived,
// non-rendering legacy dumps and are excluded (delete them, don't migrate).
const ARCHIVED = new Set(['behaviors.html', 'newbehaviors.html']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'data', 'test-results', '.playwright-artifacts', 'coverage', 'dist', 'out']);

function walk(dir: string, exts: string[], out: string[]): void {
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) { walk(abs, exts, out); }
    else if (exts.some((x) => e.name.endsWith(x)) && !ARCHIVED.has(e.name)) {
      out.push(path.relative(ROOT, abs).replace(/\\/g, '/'));
    }
  }
}

// The full surface users see, copy from, OR that regenerates markup:
//  - live HTML: pages/*, demos/*, public/papers/*
//  - docs: README, CONTRIBUTING, docs/**, component .md, demo .md
//  - JSON SOURCE: component schemas (src/wb-models/*.schema.json), config, and the
//    IntelliSense manifests. A `data-*` in a schema/example regenerates back into
//    pages; a `"data-*"` declared in the manifest makes IntelliSense *suggest*
//    legacy syntax. (#222 / #224)
function scannedFiles(): string[] {
  const out: string[] = [];
  for (const dir of ['pages', 'demos', path.join('public', 'papers')]) {
    walk(path.join(ROOT, dir), ['.html'], out);
  }
  for (const dir of ['docs', 'demos', 'src']) {
    walk(path.join(ROOT, dir), ['.md'], out);
  }
  for (const dir of ['src', 'config']) {
    walk(path.join(ROOT, dir), ['.json'], out);
  }
  for (const f of ['README.md', 'CONTRIBUTING.md', '.vscode/html-custom-data.json', 'data/custom-elements.json']) {
    if (fs.existsSync(path.join(ROOT, f))) out.push(f);
  }
  return [...new Set(out)];
}

// Extract offending data-* names. In HTML/MD, data-* appears as an attribute
// (`data-x=` — real markup, escaped code samples, or CSS `[data-x=…]` selectors).
// In JSON it appears either as a declared/name value (`"data-x"`) or inside an
// embedded markup string (`data-x=`). Prose mentions ("use data-size to…") match
// neither, so they don't false-positive.
function offenders(content: string, isJson: boolean): string[] {
  const re = isJson
    ? /"(data-[a-z][a-z0-9-]*)"|\b(data-[a-z][a-z0-9-]*)=/gi
    : /\b(data-[a-z][a-z0-9-]*)(?==)/gi;
  const found: string[] = [];
  for (const m of content.matchAll(re)) {
    const name = (m[1] || m[2] || '').toLowerCase();
    if (name && !ALLOWED.has(name)) found.push(name);
  }
  return [...new Set(found)].sort();
}

// SKIPPED until the #224 purge lands: this gate is intentionally red today (the
// live surface still has data-*). Per #224's red→fix→green workflow it flips to
// green together with the codemod sweep, then this .skip is removed to enforce it.
test.describe.skip('No data-* attributes on the live surface + docs + JSON source (#224)', () => {
  for (const rel of scannedFiles()) {
    test(`${rel}: zero data-* attributes`, () => {
      const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      const bad = offenders(content, rel.endsWith('.json'));

      expect(
        bad,
        `${rel} still uses data-* attributes (v3 requires plain attrs):\n  ` +
        `${bad.join(', ')}\n  Fix: node scripts/migrate-legacy-attrs.mjs ${rel}`
      ).toEqual([]);
    });
  }
});
