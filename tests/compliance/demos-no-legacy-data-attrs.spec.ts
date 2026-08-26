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
 * ALLOWED: framework-level hooks that are never WB behavior config --
 *   - `data-theme` : read by src/core/theme.js via documentElement.dataset.theme.
 *   - `data-code-width` : a CSS attribute-selector hook (src/styles/behaviors/demo.css,
 *     Standard §28), same exception already codified for pages/behaviors.html in
 *     tests/compliance/legacy-attr-compliance.spec.ts (#200) -- controls the demo's
 *     code-panel width preset via `x-demo[data-code-width="…"]`, never read by JS.
 *     content.html's demos also participate in tests/regression/code-panel-width-
 *     compliance.spec.ts and code-panel-50vw-min-width.spec.ts, which assert this
 *     exact attribute name -- renaming it would regress those (#550).
 *   - `data-x-expected-errors` : a framework/test-infra hook on `<html>`, read by
 *     src/core/error-logger.js via `documentElement.hasAttribute(...)`, structurally
 *     identical to `data-theme` (documentElement flag, not wb-* / x-* component config).
 *     tests/regression/expected-error-log-suppression.spec.ts asserts this exact
 *     attribute name -- renaming it would regress that test (#550).
 *
 * EXCLUDED: files whose whole purpose is exercising legacy syntax.
 */
const ROOT = process.cwd();
const ALLOWED = new Set<string>(['data-theme', 'data-code-width', 'data-x-expected-errors']);
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
//   - wb-views-demo.html: data-wbv-for / data-wbv-template / data-wbv-no-autocode
//     are read by that page's OWN vanilla script (details.dataset.wbvTemplate,
//     details.dataset.wbvFor, hasAttribute('data-wbv-no-autocode')) on plain
//     <details> / <example-block> elements. No WB behavior reads them, so they
//     teach nobody deprecated WB config syntax -- same category as wizard.html's
//     data-tab and registry-browser.html's data-label (#697).
const EXCLUDE = new Set<string>(['legacy-syntax-check.html', 'wizard.html', 'registry-browser.html', 'wb-views-demo.html']);
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
