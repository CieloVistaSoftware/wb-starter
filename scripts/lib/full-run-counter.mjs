/**
 * The "commits since the last full suite run" counter (#1178).
 *
 * .husky/pre-commit runs the whole suite on every 10th commit, and counts
 * commits in a file under .git/ so the count is shared by every worktree (#974).
 * Only the hook ever reset it. So the count meant "commits since the HOOK last
 * ran the suite", not "since the suite last ran" -- and release.mjs runs the same
 * ratchet over the same projects.
 *
 * 2026-09-15: `npm run ship` ran the release gate (7855 tests, 49.5m, no new
 * failures), then committed the release. That commit was the 10th, so the hook
 * started all 7855 again on a tree that differed only by the version stamp.
 *
 * Both callers now go through this file: the hook for the path, release.mjs to
 * reset after its full run passes. One definition of where the count lives, so
 * the two cannot drift apart the way a copied `git rev-parse` line would.
 *
 * CLI (used by the hook, which is shell):
 *   node scripts/lib/full-run-counter.mjs --path     print the counter file path
 */
import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { suiteEnv } from './suite-env.mjs';

const FILE = 'wb-fix-count';

/**
 * Absolute path of the counter for the repository at `root`.
 * --git-common-dir, not --git-dir: in a worktree --git-dir is
 * .git/worktrees/<name>, which gave every worktree its own count (#974).
 * An inherited hook GIT_DIR must not redirect it to another repo (#1161).
 */
export function fullRunCounterPath(root) {
  const common = execFileSync('git', ['rev-parse', '--git-common-dir'], {
    cwd: root,
    env: suiteEnv(process.env),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  return path.join(path.resolve(root, common), FILE);
}

/** The current count; a missing or unreadable counter is 0, as the hook reads it. */
export function readFullRunCount(root) {
  try {
    const n = Number.parseInt(readFileSync(fullRunCounterPath(root), 'utf8').trim(), 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

/** Record that the full suite just passed the ratchet: the count starts over. */
export function resetFullRunCounter(root) {
  writeFileSync(fullRunCounterPath(root), '0\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--path')) {
    process.stdout.write(fullRunCounterPath(process.cwd()));
  } else {
    console.error('usage: node scripts/lib/full-run-counter.mjs --path');
    process.exit(2);
  }
}
