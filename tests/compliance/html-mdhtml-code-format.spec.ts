import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * COMPLIANCE GATE (#288): <wb-mdhtml> code samples hand-written inline in
 * demos/pages .html files must follow the same multi-line attribute rule
 * (Rule 1, docs/code-examples-standard.md) as markdown docs — every
 * attribute on its own line, never two-or-more crammed onto one line.
 *
 * md-code-format.spec.ts covers this for .md files; this covers the same
 * pattern where it shows up as a literal ```html fence embedded inside an
 * HTML page's <wb-mdhtml> element (demos/autoinject.html's "Code:" panels).
 */
const ROOT = process.cwd();
const SKIP = new Set(['node_modules', '.git', 'data', 'test-results', '.playwright-artifacts', 'coverage', 'dist', 'out']);

function walk(dir: string, out: string[]): void {
  let ents: fs.Dirent[];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (SKIP.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (e.name.endsWith('.html')) out.push(path.relative(ROOT, abs).replace(/\\/g, '/'));
  }
}

function htmlFiles(): string[] {
  const out: string[] = [];
  for (const d of ['demos', 'pages']) walk(path.join(ROOT, d), out);
  return [...new Set(out)];
}

// Two or more attributes on one HTML-escaped tag line inside a code fence —
// e.g. `&lt;input type="checkbox" checked&gt;`. Boolean attrs (no `=`) count too.
const MULTI_ATTR = /&lt;[a-zA-Z][a-zA-Z0-9-]*(?:\s+[a-zA-Z-]+(?:="[^"]*")?){2,}/;

test.describe('<wb-mdhtml> code samples in .html pages follow the multi-line format (#288)', () => {
  for (const rel of htmlFiles()) {
    test(`${rel}: wb-mdhtml code fences not crammed onto one line`, () => {
      const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      if (!text.includes('wb-mdhtml')) return; // nothing to check
      const lines = text.split('\n');
      let inFence = false;
      const offenders: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        const ln = lines[i];
        if (/^```/.test(ln.trim())) { inFence = !inFence; continue; }
        if (!inFence) continue;
        if (MULTI_ATTR.test(ln)) offenders.push(`  L${i + 1}: ${ln.trim()}`);
      }
      expect(offenders, `multi-attribute lines in ${rel}:\n${offenders.join('\n')}`).toEqual([]);
    });
  }
});
