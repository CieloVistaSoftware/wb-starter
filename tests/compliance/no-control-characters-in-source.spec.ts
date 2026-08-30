import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * No stray control characters in source (#888).
 *
 * Eleven `\b` word-boundary escapes were on disk as literal BACKSPACE bytes
 * (0x08) across four files. A regex asking for a literal backspace never
 * matches real source, so every check built on one silently returned zero:
 *
 *   scripts/test-wb-demo-integrity.mjs   the <div x-demo> opener count
 *   scripts/analyze-showcase3.js         the x-alert type scan
 *   scripts/audit-docs.mjs               the components-word audit
 *   tests/behaviors/permutation-compliance.spec.ts   an x- class filter
 *
 * The x-demo one reported "0 opened, 293 closed cleanly" on 15 files — and it
 * runs before any Playwright project in `npm test`, so the whole suite stopped
 * at a failure that was not real. The audit-docs one was quieter and worse: it
 * reported the components-word audit clean throughout the entire
 * components→behaviors rename, because it matched nothing at all.
 *
 * This has to be a byte check. The character is invisible in every editor and
 * in `git diff`; only `cat -A` shows it, as `^H`. Nobody was going to catch it
 * by reading.
 *
 * TAB, LF and CR are legitimate. Everything else below 0x20, plus DEL, is not.
 */

const ROOTS = ['src', 'scripts', 'tests'];
const EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.css', '.json']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'out', 'dist', 'test-results', 'playwright-report', '.claude']);

const TAB = 0x09;
const LF = 0x0a;
const CR = 0x0d;
const DEL = 0x7f;
const SPACE = 0x20;

/** Name the ones that actually happen, so a failure explains itself. */
const NAMES: Record<number, string> = {
  0x00: 'NUL',
  0x07: 'BEL (\\a)',
  0x08: 'BACKSPACE (\\b — almost certainly a word-boundary escape that got eaten)',
  0x0b: 'VERTICAL TAB (\\v)',
  0x0c: 'FORM FEED (\\f)',
  0x1b: 'ESC (\\e)',
};

function sourceFiles(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) sourceFiles(full, out);
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

test.describe('source contains no stray control characters', () => {
  const files = sourceFiles(ROOTS[0]).concat(...ROOTS.slice(1).map((r) => sourceFiles(r)));

  test('the sweep actually ran', () => {
    // A glob that matched nothing would report perfect compliance forever.
    expect(files.length, `no source files found under ${ROOTS.join(', ')}`).toBeGreaterThan(100);
  });

  test('no file carries a control character', () => {
    const found: string[] = [];

    for (const file of files) {
      const buf = fs.readFileSync(file);
      for (let i = 0; i < buf.length; i++) {
        const byte = buf[i];
        const isControl = (byte < SPACE && byte !== TAB && byte !== LF && byte !== CR) || byte === DEL;
        if (!isControl) continue;

        // Report the line, since the character itself will not be visible.
        const line = buf.subarray(0, i).toString('utf8').split('\n').length;
        const name = NAMES[byte] || `0x${byte.toString(16).padStart(2, '0')}`;
        found.push(`${file.split(path.sep).join('/')}:${line} contains ${name}`);
        break; // one report per file is enough to send someone looking
      }
    }

    expect(
      found,
      'a control character in source is invisible in an editor and in git diff — ' +
      'a regex built around one matches nothing and the check silently passes',
    ).toEqual([]);
  });
});
