/**
 * A COMMIT THAT IS NOT ON THE SHIPPING BRANCH IS NOT "PUSHED"
 * ==========================================================
 * #1043. The state engine decides how far a fix has travelled, and it decided
 * "pushed" with:
 *
 *   git rev-list --max-count=4000 --remotes
 *
 * `--remotes` is EVERY remote branch. So a commit pushed to a working branch —
 * where most work starts — reported as pushed, i.e. delivered, while it sat on
 * nothing anyone ships from. Unshipped work read as done, which is the exact
 * failure the engine exists to prevent.
 *
 * Reachability from the remote DEFAULT branch is the honest test. This asserts
 * the contract behaviourally: run the engine with the shipping ref pointed at an
 * older commit, and the issues cited by everything after that commit must stop
 * reporting `pushed` — because relative to that ref, they are not.
 *
 * Testing it against origin/main directly is impossible without side effects:
 * every commit in this history is already on origin/main, so there is nothing
 * unshipped to observe. WB_DEFAULT_REF produces the same SHAPE — commits that
 * exist but are not reachable from the shipping ref — while creating no branch
 * and no commit. Nothing about the repo changes.
 */

import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';

/** Issue numbers the engine currently reports as `pushed`, given a shipping ref. */
function pushedIssues(defaultRef?: string): Set<number> {
  const out = execFileSync('node', ['scripts/issue-state.mjs'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: defaultRef ? { ...process.env, WB_DEFAULT_REF: defaultRef } : process.env,
  });

  const found = new Set<number>();
  for (const line of out.split('\n')) {
    // "#1234   pushed   <detail>" — the state is the second column.
    const m = line.match(/^#(\d{3,5})\s+(\S+)/);
    if (m && m[2] === 'pushed') found.add(Number(m[1]));
  }
  return found;
}

test('an issue whose commits are not on the shipping branch does not report as pushed', () => {
  test.slow(); // two full passes over the git log.

  const asShipped = pushedIssues();

  // A ref far enough back that a good deal of recent history is not reachable
  // from it. HEAD~120 is arbitrary only in size; what matters is that it splits
  // the history, which the guard below confirms.
  const olderRef = execFileSync('git', ['rev-parse', 'HEAD~120'], { encoding: 'utf8' }).trim();
  const unreachable = execFileSync(
    'git', ['rev-list', '--count', `${olderRef}..HEAD`], { encoding: 'utf8' },
  ).trim();

  expect(
    Number(unreachable),
    'the chosen ref does not actually exclude any history, so this test would prove nothing',
  ).toBeGreaterThan(20);

  const asOlder = pushedIssues(olderRef);

  // Everything the narrower ref calls pushed must ALSO be pushed under the real
  // shipping branch: moving the ref back can only ever remove travel, never add
  // it. If this fails, the rule is not reachability at all.
  const gainedTravel = [...asOlder].filter((n) => !asShipped.has(n));
  expect(
    gainedTravel,
    'issues became "pushed" when the shipping branch was moved BACKWARDS — ' +
    'travel is not being decided by reachability from the shipping ref',
  ).toEqual([]);

  // And the narrower ref must genuinely take travel away from someone. If the
  // set is unchanged, `pushed` is not consulting the ref — which is precisely
  // the defect: `--remotes` gave the same answer no matter what ships.
  const lostTravel = [...asShipped].filter((n) => !asOlder.has(n));
  expect(
    lostTravel.length,
    `No issue lost "pushed" when ${unreachable} commits were placed beyond the shipping ref. ` +
    'That is what `--remotes` did: report delivered regardless of where the code actually is.',
  ).toBeGreaterThan(0);
});
