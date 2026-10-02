/**
 * The site's version number -- computed in ONE place (#1243).
 *
 * John, 2026-10-02: "I want port 3000 to show 1.0.what the latest push is e.g.
 * 1.0.41 simple." The number is the last release tag with its patch moved on by
 * the commits since it: tag v1.0.0 + 41 commits -> "1.0.41". Always three
 * segments (#1139: a fourth, "4.0.5.23", read as a release nobody cut).
 *
 * Every display of the version (the header's x-release badge, a standalone
 * page's badge) calls this, so the site can never show two different numbers.
 *
 * `stamp` is src/core/version.js's VERSION. `release` and `sinceRelease` come
 * from the tag (scripts/stamp-version.js); an older stamp without them falls
 * back to package.json's version and the commits ahead of upstream.
 */
export function versionNumber(stamp) {
  const release = stamp.release || stamp.version;
  const since = Number.isInteger(stamp.sinceRelease) ? stamp.sinceRelease : Number(stamp.ahead || 0);
  const [maj = 0, min = 0, pat = 0] = String(release).split('.').map((n) => Number(n) || 0);
  return { number: `${maj}.${min}.${pat + since}`, release, since };
}
