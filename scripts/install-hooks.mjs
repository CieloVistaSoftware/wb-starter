/**
 * Point git at .husky/ so the hooks in this repo actually run.
 *
 * Runs as `npm install`'s `prepare` step. Nothing did this before: a fresh
 * clone -- CI's included -- had .husky/pre-commit and .husky/pre-push on disk
 * and git never ran them (tests/regression/every-push-to-main-is-a-release
 * "git is configured to run the hook at all" failed in CI for exactly that).
 * A hook that only runs on the one machine someone configured by hand is the
 * #1008 shape: present, correct, and executed by nothing.
 *
 * Never fails the install: no git (a tarball install) or not a work tree just
 * means there is nothing to wire.
 */
import { execFileSync } from 'node:child_process';

try {
  execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { stdio: 'ignore' });
  execFileSync('git', ['config', 'core.hooksPath', '.husky'], { stdio: 'ignore' });
  console.log('git hooks: core.hooksPath -> .husky');
} catch {
  // Not a git checkout -- nothing to wire.
}
