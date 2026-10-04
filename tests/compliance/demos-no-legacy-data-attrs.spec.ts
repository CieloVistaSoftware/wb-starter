import { test, expect } from '../fixtures/offline';
import * as fs from 'fs';
import * as path from 'path';
import { isLegacySyntaxFixture } from '../utils/legacy-syntax-fixtures';

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
// The demo that contains legacy syntax on purpose is exempt by PATH, from
// tests/utils/legacy-syntax-fixtures.ts (#1173). This used to be a set of
// bare file names, so it also covered any other file with the same name.
// wizard.html, registry-browser.html and wb-views-demo.html were on it too
// (#321, #337, #697); none of them exists in the repo any more.
const SKIP_DIRS = new Set(['node_modules', '.git', 'data', 'test-results', '.playwright-artifacts', 'coverage', 'dist', 'out']);

function walk(dir: string, out: string[]): void {
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (e.name.endsWith('.html') && !isLegacySyntaxFixture(path.relative(ROOT, abs))) out.push(path.relative(ROOT, abs).replace(/\\/g, '/'));
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
