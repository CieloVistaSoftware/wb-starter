/**
 * RUNNING A TEST IS NOT A SOURCE CHANGE
 * =====================================
 * #1081. #1071 gitignored the generated files that were permanently dirtying
 * the working tree — data/test-results.json, data/test-status.json,
 * data/bg-health.json — and its commit says "the working tree can now actually
 * be clean". It missed `data/test-single/`, which was tracked with 250 files
 * and is rewritten by scripts/test-async.mjs on every single-spec run.
 *
 * So the clean tree lasted until the first verification, which is the exact
 * condition #1071 existed to end.
 *
 * WHY THIS IS A GATE AND NOT A TIDY-UP
 * ------------------------------------
 * Two correct rules deadlocked on it:
 *   - #1076: scripts/ship.mjs refuses to release from a dirty tree, because a
 *     version has to name what the site will actually serve.
 *   - release.mjs gate 1 runs the suite.
 * The suite writes these files, so the gate dirtied the tree that the ship flow
 * had just demanded be clean, and shipping became impossible.
 *
 * It also re-corrupts the version badge: stamp-version.js excludes only
 * src/core/version.js from its dirty check, so test scratch made it stamp
 * `dirty: true` and the badge's "*" went back to meaning "someone ran a test".
 *
 * Written as the GENERAL rule rather than as `data/test-single/` specifically,
 * because this is the second time — the next generated-output directory should
 * fail here rather than be discovered a third time by a deadlock.
 */
import { test, expect } from '@playwright/test';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Directories whose contents exist only because something ran, never because
 * someone wrote them. Each is an output location named by a script in this
 * repo, not a guess.
 */
const GENERATED_DIRS = [
  'data/test-single',       // scripts/test-async.mjs, one file per single-spec run
  'data/test-results',      // scripts/tools/test-reporter.ts
  'data/playwright-output', // playwright.config.ts outputDir (cleared every run)
  'data/gate-evidence',     // .husky/test-ratchet.mjs
];

/**
 * Individual files a TEST writes. Same defect as the directories above, found
 * the same way: `npm run ship` refused a dirty tree and these were in it.
 *
 * Each is named with the spec that writes it, so the claim is checkable rather
 * than a list someone has to trust.
 *
 * data/notes.json is deliberately NOT here. It is written by
 * src/wb-viewmodels/notes.js and server.js — the notes drawer — so it is a
 * user's saved work, not a build output. Untracking it would quietly stop
 * persisting something a person typed.
 */
const GENERATED_FILES = [
  'data/default-gui-census.json',      // tests/behaviors/default-gui-census.spec.ts
  'data/documented-example-sweep.json', // tests/behaviors/every-documented-example-works.spec.ts
  'data/px-audit.json',                 // tests/compliance/px-no-new-creep.spec.ts
];

function trackedUnder(dir: string): string[] {
  const out = execFileSync('git', ['ls-files', '--', dir], {
    cwd: REPO,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  return out.split('\n').map((l) => l.trim()).filter(Boolean);
}

test.describe('#1081 — generated output must not be tracked', () => {
  for (const dir of GENERATED_DIRS) {
    test(`nothing under ${dir} is tracked`, () => {
      const tracked = trackedUnder(dir);
      expect(
        tracked,
        `${tracked.length} tracked file(s) under ${dir}. These are rewritten by a `
          + 'run, so every verification dirties the tree — which blocks `npm run ship` '
          + '(#1076) and makes the version badge report "dirty" for having run a test '
          + '(#1071). Untrack with `git rm --cached` (the files stay on disk) and add '
          + 'the directory to .gitignore.\nFirst few:\n'
          + tracked.slice(0, 5).map((f) => `  ${f}`).join('\n'),
      ).toEqual([]);
    });
  }

  test('no test-written FILE is tracked', () => {
    const tracked = GENERATED_FILES.filter((f) => trackedUnder(f).length > 0);
    expect(
      tracked,
      `${tracked.length} tracked file(s) rewritten by a test run: ${tracked.join(', ')}. `
        + 'Every verification dirties the tree, which blocks `npm run ship` (#1076). '
        + 'Untrack with `git rm --cached` (the file stays on disk) and add it to .gitignore.',
    ).toEqual([]);
  });

  test('each generated directory is ignored, so it cannot creep back', () => {
    // Untracking alone is not enough: the next run recreates the files as
    // untracked, `git add -A` sweeps them straight back in, and the deadlock
    // returns. ship.mjs runs `git add -A`, so this is not hypothetical.
    const ignore = fs.readFileSync(path.join(REPO, '.gitignore'), 'utf8');
    const missing = GENERATED_DIRS.filter((dir) => {
      const bare = dir.replace(/\/$/, '');
      return !new RegExp(`^\\s*/?${bare}/?\\s*$`, 'm').test(ignore);
    });
    expect(missing, `.gitignore does not cover: ${missing.join(', ')}`).toEqual([]);
  });
});
