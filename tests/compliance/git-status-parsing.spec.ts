/**
 * THE FIRST CHANGED FILE KEEPS ALL ITS CHARACTERS
 * ===============================================
 * #1082. `git status --porcelain` emits `XY<space>PATH` with XY fixed at two
 * columns, so an unstaged modification starts with a leading space. Both
 * stamp-version.js and ship.mjs trimmed the WHOLE output before splitting,
 * which strips that space from the first line only — and `.slice(3)` then ate
 * a character of the first path:
 *
 *   " M src/core/version.js"  ->  "rc/core/version.js"
 *
 * WHY IT MATTERED RATHER THAN JUST LOOKING ODD
 * --------------------------------------------
 * stamp-version.js excludes `src/core/version.js` so a tree whose only change
 * is its own output does not read as dirty (#1071). In that scenario version.js
 * is the FIRST line, so it is the one entry that gets mangled, the exclusion
 * misses it, and the tree reads dirty anyway. #1071 could not work in the case
 * it was written for, and the deployed badge kept saying "uncommitted changes".
 *
 * The last assertion here is that property directly, not the parsing — a parser
 * test alone would pass on a correct parser wired up wrong.
 */
import { test, expect } from '@playwright/test';
import { changedPaths, isDirty } from '../../scripts/lib/git-status.mjs';

// Real shapes, taken from `git status --porcelain` output rather than invented.
const UNSTAGED = ' M src/core/version.js\n M package.json\n';
const STAGED = 'M  src/core/version.js\nM  package.json\n';
const UNTRACKED = '?? scripts/ship.mjs\n?? .husky/pre-push\n';
const BOTH = 'MM src/core/version.js\n M tests/base.ts\n';
const DELETED = 'D  data/test-single/badge.json\n M .gitignore\n';
const RENAMED = 'R  scripts/old.mjs -> scripts/new.mjs\n';

test.describe('#1082 — porcelain parsing', () => {
  test('the FIRST entry survives intact, in every status shape', () => {
    // One assertion per shape, because the bug only ever touched line one and a
    // test that checked the list length would have passed throughout.
    expect(changedPaths(UNSTAGED)[0]).toBe('src/core/version.js');
    expect(changedPaths(STAGED)[0]).toBe('src/core/version.js');
    expect(changedPaths(UNTRACKED)[0]).toBe('scripts/ship.mjs');
    expect(changedPaths(BOTH)[0]).toBe('src/core/version.js');
    expect(changedPaths(DELETED)[0]).toBe('data/test-single/badge.json');
  });

  test('a leading dot is not eaten', () => {
    // The symptom that surfaced it: `npm run ship -- --dry` listed
    // "github/workflows/ci-tests.yml" for a change to `.github/...`.
    expect(changedPaths(' M .github/workflows/ci-tests.yml\n')[0])
      .toBe('.github/workflows/ci-tests.yml');
  });

  test('later entries were never broken, and still are not', () => {
    expect(changedPaths(UNSTAGED)).toEqual(['src/core/version.js', 'package.json']);
    expect(changedPaths(DELETED)).toEqual(['data/test-single/badge.json', '.gitignore']);
  });

  test('a rename reports the path that exists now', () => {
    expect(changedPaths(RENAMED)).toEqual(['scripts/new.mjs']);
  });

  test('CRLF and empty output are handled', () => {
    expect(changedPaths(' M package.json\r\n M .gitignore\r\n'))
      .toEqual(['package.json', '.gitignore']);
    expect(changedPaths('')).toEqual([]);
    expect(changedPaths(null)).toEqual([]);
  });

  test('#1071: a tree whose ONLY change is version.js is NOT dirty', () => {
    // The property, stated as itself. This is the assertion that was false in
    // production for the whole life of #1071.
    expect(isDirty(' M src/core/version.js\n', ['src/core/version.js'])).toBe(false);
  });

  test('#1071: but real work still counts as dirty', () => {
    // Guards the opposite failure — an exclusion broad enough to hide anything
    // would make the badge lie in the other direction.
    expect(isDirty(' M src/core/version.js\n M src/core/wb.js\n', ['src/core/version.js']))
      .toBe(true);
    expect(isDirty(' M src/core/wb.js\n', ['src/core/version.js'])).toBe(true);
  });
});
