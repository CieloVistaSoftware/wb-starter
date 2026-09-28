/**
 * Which tags a failed ship may delete (#1157).
 *
 * A failed ship must leave nothing behind (#1097), and that includes a tag it
 * cut. It must NOT include a tag that was already there.
 *
 * The first version asked "which tag matches the version in package.json right
 * now?". That is the right answer only AFTER release.mjs has bumped the
 * version. A failure before the bump (the ratchet runs first) leaves package.json
 * naming the CURRENT release, so the rollback found the live release's tag and
 * deleted it: on 2026-09-14 a failed 4.0.5 ship printed
 * "Deleted tag 'v4.0.4' (was b53e2605)". Every ship that failed before the
 * bump had done the same, including the three on 2026-09-12.
 *
 * So the question is asked the only way that cannot misfire: record the tag set
 * before anything is written, and at rollback remove exactly the tags that are
 * new since then.
 */
import { execFileSync } from 'child_process';
import { suiteEnv } from './suite-env.mjs';

// `root` must decide which repository these act on. An inherited GIT_DIR (set
// whenever this runs under a git hook) silently overrides cwd: from a worktree
// the rollback guard read the REAL repo's tags instead of its scratch repo's.
// A function whose job is deleting tags must never be able to aim elsewhere.
const git = (root, args, extra = {}) =>
  execFileSync('git', args, { cwd: root, env: suiteEnv(process.env), ...extra });

/** Every v* tag in the repo, as a Set. */
export function releaseTags(root) {
  const out = git(root, ['tag', '--list', 'v*'], { encoding: 'utf8' });
  return new Set(out.split(/\r?\n/).map((t) => t.trim()).filter(Boolean));
}

/** Tags present now that were not present in `before`. Pure. */
export function tagsCreatedSince(before, now) {
  return [...now].filter((t) => !before.has(t)).sort();
}

/**
 * Delete only the tags this run created. Returns the list it deleted, so the
 * caller can say so; a pre-existing tag is never touched.
 */
export function deleteTagsCreatedSince(root, before) {
  const created = tagsCreatedSince(before, releaseTags(root));
  for (const tag of created) {
    git(root, ['tag', '-d', tag], { stdio: 'inherit' });
  }
  return created;
}
