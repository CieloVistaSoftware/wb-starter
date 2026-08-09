import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * COMPLIANCE GATE: demo files must use plain v3 attributes, not deprecated
 * `data-*` config attributes.
 *
 * Demos render a component AND show their own markup as a code sample, so a
 * `data-variant="primary"` in a demo teaches every reader the deprecated syntax
 * — the "code generation is all wrong" report. v3 uses plain attributes
 * (variant, size, tooltip, value-suffix, …) declared straight on the element.
 *
 * ALLOWED: `data-theme` only — that's the framework theme hook read by
 * src/core/theme.js via documentElement.dataset.theme, not component config.
 *
 * EXCLUDED: files whose whole purpose is exercising legacy syntax.
 */
const ROOT = process.cwd();
const ALLOWED = new Set<string>(['data-theme']);
// Demos that intentionally contain legacy syntax to verify it still works,
// or whose data-* usage isn't WB behavior config at all (#321 follow-up):
//   - wizard.html: marked obsolete (#337, wizard.spec.ts fully skipped) --
//     its data-tab is the wizard's own vanilla-JS tab switcher, not a WB
//     behavior attribute, and the page isn't taught as a live syntax
//     example anymore.
//   - registry-browser.html: data-label is a plain CSS attr() responsive-
//     table label (`content: attr(data-label)`), never read by any WB
//     behavior -- unrelated to the deprecated-config-syntax this gate
//     exists to catch.
const EXCLUDE = new Set<string>(['legacy-syntax-check.html', 'wizard.html', 'registry-browser.html']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'data', 'test-results', '.playwright-artifacts', 'coverage', 'dist', 'out']);

function walk(dir: string, out: string[]): void {
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (e.name.endsWith('.html') && !EXCLUDE.has(e.name)) out.push(path.relative(ROOT, abs).replace(/\\/g, '/'));
  }
}

function demoFiles(): string[] {
  const out: string[] = [];
  walk(path.join(ROOT, 'demos'), out);
  return out;
}

// Any data-* config token — valued (data-variant="…") OR boolean (data-autosize).
// The old `(?==)` guard missed boolean attributes, which is how demos kept
// slipping through. data-theme is the only allowed framework hook.
function offenders(content: string): string[] {
  const found: string[] = [];
  for (const m of content.matchAll(/\bdata-([a-z][a-z0-9-]*)/gi)) {
    const name = ('data-' + m[1]).toLowerCase();
    if (!ALLOWED.has(name)) found.push(name);
  }
  return [...new Set(found)].sort();
}

test.describe('Demos use plain v3 attributes, not data-* config', () => {
  for (const rel of demoFiles()) {
    test(`${rel}: no deprecated data-* config attributes`, () => {
      const bad = offenders(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
      expect(
        bad,
        `${rel} shows deprecated data-* config in its code sample (v3 uses plain attrs):\n  ` +
        `${bad.join(', ')}\n  Only data-theme (framework hook) is allowed.`
      ).toEqual([]);
    });
  }
});
