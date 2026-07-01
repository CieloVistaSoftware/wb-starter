import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * COMPLIANCE GATE (#227): HTML code samples in markdown docs must follow the
 * multi-line standard (docs/code-examples-standard.md) — the two hard rules:
 *   - a comment sits on its OWN line, never glued to the following tag
 *   - each tag starts on a NEW line, never `</a><b>` crammed together
 *
 * Fix violations with: `node scripts/format-md-code-samples.mjs` (js-beautify with
 * wrap_attributes force-expand-multiline + the project's post-processing).
 */
const ROOT = process.cwd();
const SKIP = new Set(['node_modules', '.git', 'data', 'test-results', '.playwright-artifacts', 'coverage', 'dist', 'out']);

function walk(dir: string, out: string[]): void {
  let ents: fs.Dirent[]; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
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

// A tag boundary crammed onto one line: a closing tag immediately followed by an
// opening tag, or an HTML comment followed by a tag on the same line.
const CRAMMED = [/<\/[a-zA-Z][\w-]*>\s*<[a-zA-Z]/, /-->\s*<[a-zA-Z]/];

test.describe('Markdown code samples follow the multi-line format (#227)', () => {
  for (const rel of mdFiles()) {
    test(`${rel}: code samples not crammed onto one line`, () => {
      const lines = fs.readFileSync(path.join(ROOT, rel), 'utf8').split('\n');
      let inFence = false;
      const offenders: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        const ln = lines[i];
        if (/^```/.test(ln)) { inFence = !inFence; continue; }
        if (!inFence) continue;
        if (CRAMMED.some((re) => re.test(ln))) offenders.push(`  L${i + 1}: ${ln.trim().slice(0, 90)}`);
      }
      expect(
        offenders,
        `${rel}: code samples cram tags/comments onto one line (comments + each tag must be on their own line).\n` +
        `${offenders.join('\n')}\n  Fix: node scripts/format-md-code-samples.mjs ${rel}`
      ).toEqual([]);
    });
  }
});
