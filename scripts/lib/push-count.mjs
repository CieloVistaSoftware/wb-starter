/**
 * The badge's last number: pushes to main since the release tag.
 *
 * John, 2026-10-02: "count pushes not commits." Counting commits made the
 * number jump by three per push (the change, its merge, the stamp): 1.0.83 ->
 * 1.0.86 -> 1.0.89. A push to main lands as ONE first-parent commit (a merge,
 * or a direct commit), followed by the stamp workflow's own
 * "chore(version): stamp" commit, which is bookkeeping for that same push.
 * So: first-parent commits since the tag, not counting stamp commits.
 *
 * The stamp commit therefore has the same number as the push it stamps, and
 * the stamp no longer needs a "+1 for the commit it is about to make".
 *
 * Used by scripts/stamp-version.js (the badge) and scripts/release-versions.mjs
 * (the Releases page), so both always agree.
 */
import { execFileSync } from 'node:child_process';

export const STAMP_SUBJECT = /^chore\(version\): stamp v/;

/** Subjects of first-parent commits in tag..ref, oldest first. */
export function firstParentSubjects(root, tag, ref = 'HEAD') {
  const out = execFileSync('git', ['log', '--first-parent', '--reverse', '--format=%s', `${tag}..${ref}`],
    { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
  return out.split('\n').filter(Boolean);
}

/** Pushes to main in tag..ref: first-parent commits that are not stamp commits. */
export function countPushes(root, tag, ref = 'HEAD') {
  return firstParentSubjects(root, tag, ref).filter((s) => !STAMP_SUBJECT.test(s)).length;
}
