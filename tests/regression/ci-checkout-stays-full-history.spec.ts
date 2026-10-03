import { test, expect } from '@playwright/test';
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
