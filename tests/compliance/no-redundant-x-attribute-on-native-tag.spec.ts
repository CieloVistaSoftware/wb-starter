import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * COMPLIANCE GATE: a native HTML element must not carry an explicit
 * `x-<tagname>` attribute matching its own tag (e.g. `<form x-form>`,
 * `<fieldset x-fieldset>`). John, live: "write an auditor that find
 * x-attributes with same name as tag. get rid of the x-attribute."
 *
 * These pairs are redundant, not just stylistically -- src/core/tag-map.js's
 * nativeMap already maps the bare tag to the SAME behavior automatically
 * once a page's WB.init({ autoInject: true }) (the standard for every demo
 * page) is in effect. The explicit x-<tag> attribute was needed under an
 * older convention; keeping it in demo markup teaches readers a pattern
 * that's no longer necessary, the same class of issue #448 (redundant
 * class="wb-x" on a <wb-x> tag) already fixed for custom elements.
 *
 * Scoped to demos/**\/*.html and pages/**\/*.html -- the markup readers
 * actually copy from, matching demos-no-legacy-data-attrs.spec.ts's scope
 * and reasoning for the same class of "teaches a stale pattern" gate.
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
    else if (e.name.endsWith('.html')) out.push(path.relative(ROOT, abs).replace(/\\/g, '/'));
  }
}

function targetFiles(): string[] {
  const out: string[] = [];
  walk(path.join(ROOT, 'demos'), out);
  walk(path.join(ROOT, 'pages'), out);
  return out;
}

// Matches a bare native-tag opening tag (no hyphen in the name -- excludes
// wb-*/x-* custom elements, which are a different, already-covered check)
// whose attribute list contains a bare `x-<sametagname>` token.
function findRedundantPairs(html: string): string[] {
  const found: string[] = [];
  const openTagRe = /<([a-z][a-z0-9]*)\b([^>]*)>/gi;
  let m;
  while ((m = openTagRe.exec(html))) {
    const tag = m[1].toLowerCase();
    const attrs = m[2];
    const xAttrRe = new RegExp(`(^|\\s)x-${tag}(\\s|=|$)`, 'i');
    if (xAttrRe.test(attrs)) {
      found.push(`<${tag}> carries redundant x-${tag} attribute`);
    }
  }
  return [...new Set(found)];
}

test.describe('No native element carries an x-<tag> attribute matching its own tag', () => {
  for (const rel of targetFiles()) {
    test(`${rel}: no redundant x-<tag> attribute on a native tag`, () => {
      const bad = findRedundantPairs(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
      expect(
        bad,
        `${rel} has redundant x-<tag> attributes (already auto-injected via tag-map.js's nativeMap when autoInject is on):\n  ${bad.join('\n  ')}`
      ).toEqual([]);
    });
  }
});
