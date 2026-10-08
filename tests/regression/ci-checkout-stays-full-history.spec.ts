import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import config from '../../playwright.config';

/**
 * #1272: the regression job's checkout went shallow (1326 -> 3 commits) at the
 * start of the gate, so releases-list-every-version failed in CI only. A
 * watcher in CI caught the command:
 *   git fetch origin <PR base> --depth=1 --no-auto-maintenance --no-auto-gc ...
 * It is Playwright's own git-info plugin (gitCommitInfoPlugin.js, gitDiff):
 * when captureGitInfo.diff is left unset it is ON for every CI run, and for a
 * pull request it fetches the base commit at depth 1, which writes .git/shallow.
 * The diff must be switched off explicitly; leaving it undefined means "on in CI".
 */
test('Playwright never fetches the PR base at depth 1 (captureGitInfo.diff is explicitly false)', () => {
  expect(config.captureGitInfo?.diff).toBe(false);
});

/**
 * #1753: the same fetch came back through a second config. The page-death spec
 * starts its own Playwright run from tests/fixtures/page-death/inner.config.ts,
 * which left captureGitInfo unset, so in CI that run made the checkout shallow
 * and releases-list-every-version failed on the PR (twice, 1.0.402 then 1.0.401
 * holding the whole history; "shallow true, first-parent commits 2"). Any
 * Playwright config in the repo can run in CI, so every one must turn it off.
 */
test('every Playwright config in the repo turns captureGitInfo.diff off', () => {
  const configs = execFileSync('git', ['ls-files', '*.config.ts', '*.config.mjs', '*.config.js'], { encoding: 'utf8' })
    .split('\n').filter(Boolean)
    .filter((f) => /from ['"]@playwright\/test['"]/.test(readFileSync(f, 'utf8')) && /defineConfig\s*\(/.test(readFileSync(f, 'utf8')));
  expect(configs, 'the scan found the Playwright configs at all').toContain('playwright.config.ts');
  const missing = configs.filter((f) => !/captureGitInfo\s*:\s*\{[^}]*diff\s*:\s*false/.test(readFileSync(f, 'utf8')));
  expect(missing, 'configs that would fetch the PR base at depth 1 in CI').toEqual([]);
});
