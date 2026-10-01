import { test, expect } from '../fixtures/offline';
import fs from 'node:fs';
import path from 'node:path';
import {
  SCAN_ROOTS, SKIP_DIRS, ROOT_ENTRIES, isScannedPath, findControlBytes,
} from '../../scripts/lib/control-bytes.mjs';

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

// #1049: this was ['src', 'scripts', 'tests'] with code extensions only, so
// pages/behaviors.html -- 2,500 lines of inline JavaScript, the largest single
// body of executable source in the project -- was never scanned. It carried a
// 0x08 exactly like #888's, in `/\baction=("|')\/api\//`, which meant the
// static-site warning from #752 could never fire. The guard was written from
// the four files that happened to be hit in #888 rather than from where code
// actually lives, and stayed green for months while the same bug sat two
// directories away.
//
// Scan where executable source IS, not where it was last found.
//
// #1162: the roots, extensions, skipped directories and the byte rule live in
// scripts/lib/control-bytes.mjs (imported above), shared with the staged-file
// check that now runs in the fast part of pre-commit. Two copies would drift the
// way #1049's did.

function sourceFiles(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) sourceFiles(full, out);
    } else if (isScannedPath(full)) {
      out.push(full);
    }
  }
  return out;
}

test.describe('source contains no stray control characters', () => {
  // Plus the repo-root HTML entry points, which no root directory covers.
  const rootEntries = ROOT_ENTRIES.filter((f: string) => fs.existsSync(f));
  const files = SCAN_ROOTS.flatMap((r: string) => sourceFiles(r)).concat(rootEntries);

  test('the sweep actually ran', () => {
    // A glob that matched nothing would report perfect compliance forever.
    expect(files.length, `no source files found under ${SCAN_ROOTS.join(', ')}`).toBeGreaterThan(100);
  });

  test('no file carries a control character', () => {
    const found: string[] = [];

    for (const file of files) {
      const [first] = findControlBytes(fs.readFileSync(file));
      // Report the line, since the character itself will not be visible.
      // One report per file is enough to send someone looking.
      if (first) found.push(`${file.split(path.sep).join('/')}:${first.line} contains ${first.name}`);
    }

    expect(
      found,
      'a control character in source is invisible in an editor and in git diff — ' +
      'a regex built around one matches nothing and the check silently passes',
    ).toEqual([]);
  });
});
