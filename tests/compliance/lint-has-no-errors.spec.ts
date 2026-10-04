import { test, expect } from '@playwright/test';
import { ESLint } from 'eslint';
import path from 'node:path';

/**
 * #1237: `npx eslint .` reported 659 errors in 100 files, and nothing failed.
 *
 * The lint ratchet (.husky/lint-ratchet.mjs) checks only STAGED files and fails
 * only when a file's count goes up, so a file nobody touches can hold any
 * number of errors forever. 550 were environment noise (Node and service-worker
 * globals the config never declared), and under that noise sat real defects:
 * a relativetime cleanup that threw (clearInterval(interval) with no
 * `interval`), a validator whose validate() was silently replaced by a
 * duplicate key, two test assertions that were never awaited, and two regexes
 * built from strings where '\.' was '.' and '\b' was a backspace.
 *
 * The whole repository lints with zero errors, and stays that way.
 */
test('the repository lints with zero errors (#1237)', async () => {
  test.setTimeout(300_000); // a full lint, with type-aware rules on tests/, is ~25s locally
  const eslint = new ESLint({ cwd: process.cwd() });
  const results = await eslint.lintFiles(['.']);
  expect(results.length, 'ESLint looked at the repository').toBeGreaterThan(300);

  const errors = results.flatMap((r) => r.messages
    .filter((m) => m.severity === 2)
    .map((m) => `${path.relative(process.cwd(), r.filePath).split(path.sep).join('/')}:${m.line} ${m.ruleId ?? 'parse'} ${m.message}`));
  expect(errors, 'lint errors (npx eslint . lists them)').toEqual([]);
});
