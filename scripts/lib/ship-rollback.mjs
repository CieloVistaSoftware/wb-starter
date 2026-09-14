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

/** Every v* tag in the repo, as a Set. */
export function releaseTags(root) {
  const out = execFileSync('git', ['tag', '--list', 'v*'], { cwd: root, encoding: 'utf8' });
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
    execFileSync('git', ['tag', '-d', tag], { cwd: root, stdio: 'inherit' });
  }
  return created;
}
