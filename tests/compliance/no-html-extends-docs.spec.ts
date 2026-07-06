import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Standard §9: the old HTML-`extends` design is PURGED. Docs and demos must not
 * show extends-based component code — customized built-ins
 * (`class X extends HTMLButtonElement`, `{ extends: 'button' }`, `is="…"`) or
 * `class X extends HTMLElement/LitElement` examples — not even as counter-examples.
 *
 * The English verb "extends" and the schema `$extends` keyword are unrelated and
 * remain allowed; only code-level extends patterns are flagged.
 */
const ROOT = process.cwd();
const DIRS = ['docs', 'demos', 'pages'];
const EXTS = new Set(['.md', '.html']);
const SKIP = new Set(['node_modules', '.git', 'data', 'test-results', '.playwright-artifacts', 'coverage', 'dist', 'out', '_today']);

const PATTERNS: { re: RegExp; why: string }[] = [
  { re: /class\s+\w+\s+extends\s+HTML\w*Element\b/, why: 'custom-element class code (extends HTML*Element)' },
  { re: /class\s+\w+\s+extends\s+LitElement\b/, why: 'Lit class code (extends LitElement)' },
  { re: /\{\s*extends\s*:\s*['"]/, why: 'customized built-in ({ extends: "…" })' },
  { re: /<\w+[^>]*\bis\s*=\s*["']wb-/i, why: 'customized built-in usage (is="wb-…")' },
];

function walk(dir: string, out: string[]): void {
  let ents: fs.Dirent[];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (SKIP.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (EXTS.has(path.extname(e.name))) out.push(abs);
  }
}

test('no doc or demo shows HTML-extends component code (§9)', () => {
  const files: string[] = [];
  for (const d of DIRS) walk(path.join(ROOT, d), files);

  const offenders: string[] = [];
  for (const abs of files) {
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    // The standards doc defines the rule and may quote the forbidden patterns.
    if (/standards\/(DEMOS-AND-DOCS-STANDARDS|V3-STANDARDS)\.md$/.test(rel)) continue;
    const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      for (const { re, why } of PATTERNS) {
        if (re.test(lines[i])) {
          offenders.push(`${rel}:${i + 1} — ${why}\n      > ${lines[i].trim().slice(0, 90)}`);
          break;
        }
      }
    }
  }
  expect(
    offenders,
    `HTML-extends code found (the old design — purge it, §9):\n  ${offenders.join('\n  ')}`
  ).toEqual([]);
});
