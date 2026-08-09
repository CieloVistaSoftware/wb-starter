import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Every markdown doc's fenced code blocks must be closed.
 *
 * An unclosed ``` fence swallows the rest of the document into one code block —
 * headings, prose, and later code all render as a single unformatted blob. That's
 * what makes ".md code not formatted correctly" (e.g. V3-STANDARDS.md).
 *
 * Uses a CommonMark-style fence walker (respects fence char + length, and that a
 * closer carries no info string) so nested/escaped fences don't false-positive.
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
    else if (e.name.endsWith('.md')) out.push(path.relative(ROOT, abs).replace(/\\/g, '/'));
  }
}

function mdFiles(): string[] {
  const out: string[] = [];
  for (const d of ['docs', 'demos']) walk(path.join(ROOT, d), out);
  for (const f of ['README.md', 'CONTRIBUTING.md']) if (fs.existsSync(path.join(ROOT, f))) out.push(f);
  return [...new Set(out)];
}

/** Returns the 1-based line of the unclosed fence, or 0 if all fences are closed. */
function unclosedFenceLine(md: string): number {
  const lines = md.split(/\r?\n/);
  let open: { char: string; len: number; line: number } | null = null;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s{0,3})(`{3,}|~{3,})(.*)$/);
    if (!m) continue;
    const char = m[2][0];
    const len = m[2].length;
    const info = m[3].trim();
    if (open === null) {
      open = { char, len, line: i + 1 }; // opening fence
    } else if (char === open.char && len >= open.len && info === '') {
      open = null; // valid closing fence
    }
    // otherwise: a fence-looking line inside an open block that isn't a valid
    // closer (wrong char, too short, or has an info string) — treated as content.
  }
  return open ? open.line : 0;
}

test.describe('Markdown code fences are balanced (code renders correctly)', () => {
  test('no doc has an unclosed ``` fence', () => {
    const broken: string[] = [];
    for (const rel of mdFiles()) {
      const line = unclosedFenceLine(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
      if (line > 0) broken.push(`${rel}:${line} (unclosed code fence)`);
    }
    expect(
      broken,
      `docs with an unclosed code fence — the rest of the doc renders as one unformatted code blob:\n  ${broken.join('\n  ')}`,
    ).toEqual([]);
  });
});
