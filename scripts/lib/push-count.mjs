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
 *
 * WHERE THE COUNT STARTS: the newest of
 *   - the last release tag (v1.0.0 today), and
 *   - ANCHOR: main's "stamp v1.0.89" commit, the last commit-counted number.
 * Counting pushes from v1.0.0 would have taken the badge from 1.0.89 back to
 * 1.0.26, so the count carries on from 1.0.89 instead. It is a constant, not a
 * tag, because neither this repo's Actions token nor Claude's session may
 * write tags (GitHub refused both, 2026-10-02). A release tag cut later, on a
 * descendant of the anchor, takes over automatically.
 */
import { execFileSync } from 'node:child_process';

export const STAMP_SUBJECT = /^chore\(version\): stamp v/;

export const ANCHOR = { version: '1.0.89', commit: '56c79eb8dff9d98a11a954d548c829d8feb03e72' };

const run = (root, ...args) => execFileSync('git', args,
  { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }).trim();
const isAncestor = (root, a, b) => {
  try { execFileSync('git', ['merge-base', '--is-ancestor', a, b], { cwd: root, stdio: 'ignore' }); return true; } catch { return false; }
};

/**
 * Where ref's count starts: { release, base } -- the version the count adds to,
 * and the commit (or tag) it counts from. null when there is no tag at all.
 */
export function countBase(root, ref = 'HEAD') {
  let tag = '';
  try { tag = run(root, 'describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*', ref); } catch { /* no tag */ }
  const anchorHere = isAncestor(root, ANCHOR.commit, ref);
  const tagIsNewer = tag && isAncestor(root, ANCHOR.commit, `${tag}^{commit}`);
  const found = anchorHere && !tagIsNewer
    ? { release: ANCHOR.version, base: ANCHOR.commit }
    : tag ? { release: tag.replace(/^v/, ''), base: tag } : null;
  // A release commit counts from the moment it lands, tagged or not. The stamp
  // workflow and release.yml both start on the same push, so the stamp can run
  // before the tag exists: it then counted from the previous tag, stamped the
  // release push as an ordinary 1.0.N, and dropped the release's own entry from
  // data/releases.json. Only a 1.0.N that equals the next push number survived
  // that race, which is why 1.0.132 shipped and 1.0.400 would not have.
  const rel = releaseCommit(root, ref);
  if (rel && (!found || isAncestor(root, `${found.base}^{commit}`, rel.base))) return rel;
  return found;
}

/** `release: 1.0.400 — …`: the subject release.mjs gives the commit it tags. */
export const RELEASE_SUBJECT = /^release: (\d+\.\d+\.\d+)(?:\s|$)/;

/** The newest release commit reachable from ref, as a count base; null when none. */
export function releaseCommit(root, ref = 'HEAD') {
  let out = '';
  try { out = run(root, 'log', '-E', '--grep=^release: [0-9]+\\.[0-9]+\\.[0-9]+', '--format=%H%x1f%s', ref); } catch { /* no history */ }
  for (const line of out.split('\n').filter(Boolean)) {
    const [sha, subject] = line.split('\x1f');
    const m = (subject || '').match(RELEASE_SUBJECT);
    if (m) return { release: m[1], base: sha };
  }
  return null;
}

/** Subjects of first-parent commits in tag..ref, oldest first. */
export function firstParentSubjects(root, tag, ref = 'HEAD') {
  return run(root, 'log', '--first-parent', '--reverse', '--format=%s', `${tag}..${ref}`).split('\n').filter(Boolean);
}

/**
 * True when sha is the merge that brought base onto main: a release made
 * through a PR lands as that merge, so the merge IS the release's push (the
 * badge reads 1.0.400, not 1.0.401), not one more push after it.
 */
export function isReleaseMerge(root, base, sha) {
  try { return run(root, 'rev-parse', `${sha}^2`) === run(root, 'rev-parse', `${base}^{commit}`); } catch { return false; }
}

/** Pushes to main in tag..ref: first-parent commits that are not stamp commits. */
export function countPushes(root, tag, ref = 'HEAD') {
  const base = run(root, 'rev-parse', `${tag}^{commit}`);
  return run(root, 'log', '--first-parent', '--format=%s%x1f%P', `${tag}..${ref}`).split('\n').filter(Boolean)
    .map((line) => line.split('\x1f'))
    .filter(([subject, parents]) => !STAMP_SUBJECT.test(subject) && (parents || '').split(' ')[1] !== base).length;
}
