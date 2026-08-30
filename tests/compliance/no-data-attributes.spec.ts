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
// Framework state hooks, NOT wb-*/x-* behavior config. Each was already
// ratified with verified reasoning in demos-no-legacy-data-attrs.spec.ts; this
// list was left empty and so demanded renames that other specs assert against,
// making the pair unsatisfiable (#895). The docstring above reserved exactly
// this exemption — it just never propagated here.
//
//   data-theme             set on documentElement, read by darkmode.js, keyed
//                          by 9 stylesheets. Root-element state, not config.
//   data-code-width        CSS attribute-selector hook (x-demo[data-code-width]),
//                          never read by JS. code-panel-width-compliance.spec.ts
//                          and code-panel-50vw-min-width.spec.ts assert this
//                          exact name — renaming regresses them (#550).
//   data-x-expected-errors <html> flag read by error-logger.js.
//                          expected-error-log-suppression.spec.ts asserts this
//                          exact name — renaming regresses it (#550).
//
// Closed list. Behavior CONFIG in data-* form is still a failure; see #895 for
// the per-behavior rename pass that is deliberately not covered here.
const ALLOWED = new Set<string>([
  'data-theme',
  'data-code-width',
  'data-x-expected-errors',
]);

const ROOT = process.cwd();

// Live, user-facing surface. behaviors.html / newbehaviors.html are archived,
// non-rendering legacy dumps and are excluded (delete them, don't migrate).
const ARCHIVED = new Set([
  'behaviors.html', 'newbehaviors.html',
  // Fixtures whose whole purpose is exercising legacy syntax, so they must
  // CONTAIN it. Same exclusion demos-no-legacy-data-attrs.spec.ts already
  // applies; this list was missing them, so the two gates disagreed (#895).
  'legacy-syntax-check.html', 'wizard.html', 'registry-browser.html', 'wb-views-demo.html',
]);
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

// The #224 purge landed, so per that issue's own red→fix→green workflow the
// .skip is removed and this gate now enforces. It had stayed skipped long after
// the sweep it was waiting for: 453 assertions across the live surface, docs and
// JSON source, all passing, none of them running. Measured before removing it —
// 453 passed, 0 failed.
//
// A skip is the third way a suite reports clean without checking anything,
// alongside collecting zero tests and passing vacuously. It is the most
// respectable-looking of the three, because it names a reason; the reason just
// has to be re-checked once in a while, and nothing was re-checking this one.
test.describe('No data-* attributes on the live surface + docs + JSON source (#224)', () => {
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
