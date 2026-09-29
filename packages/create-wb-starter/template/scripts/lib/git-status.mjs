/**
 * git-status.mjs — parse `git status --porcelain` without eating a character
 *
 * #1082. Both stamp-version.js and ship.mjs did this:
 *
 *   git('git status --porcelain')   // helper .trim()s the WHOLE output
 *     .split('\n')
 *     .map((l) => l.slice(3).trim())
 *
 * Porcelain v1 emits `XY<space>PATH` with XY fixed at two characters, so an
 * unstaged modification begins with a LEADING SPACE: " M src/core/version.js".
 * `.slice(3)` is right for that. Trimming the whole output first removes that
 * space from the FIRST LINE ONLY, and the slice then cuts one character too
 * many:
 *
 *   " M src/core/version.js"  ->  "M src/core/version.js"  ->  "rc/core/version.js"
 *
 * Every other line is unaffected, which is exactly why it survived: the bug is
 * invisible unless you look at the alphabetically-first entry.
 *
 * IT DEFEATED #1071 IN #1071's OWN SCENARIO
 *
 * stamp-version.js excludes its own output so that a tree whose ONLY change is
 * src/core/version.js does not read as dirty. But in that case version.js is
 * the first (and only) line — so it is the entry that gets mangled, the
 * exclusion list does not match "rc/core/version.js", and `dirty` comes back
 * true. The guard was bypassed precisely when it was needed, which is why the
 * badge kept saying "uncommitted changes" after #1071 shipped.
 *
 * The surrounding whitespace in porcelain output is DATA, not noise. Split
 * first; never trim the whole thing.
 */

/**
 * Paths from `git status --porcelain` (v1), in the order git reported them.
 *
 * Handles every status shape: unstaged " M ", staged "M  ", staged+unstaged
 * "MM ", untracked "?? ", deleted "D  ". Rename/copy entries are reported by
 * git as "R  old -> new"; the destination is the path that exists now, so that
 * is what comes back.
 *
 * @param {string} raw exact stdout of `git status --porcelain` — NOT trimmed
 * @returns {string[]}
 */
export function changedPaths(raw) {
  return String(raw ?? '')
    .split('\n')
    // Only the line ENDINGS are noise (CRLF on Windows). The leading two
    // status columns are the payload's shape.
    .map((line) => line.replace(/\r$/, ''))
    .filter((line) => line.length > 3)
    .map((line) => line.slice(3))
    .map((path) => {
      const arrow = path.indexOf(' -> ');
      return arrow === -1 ? path : path.slice(arrow + 4);
    })
    .map((path) => path.trim())
    .filter(Boolean);
}

/**
 * Is the tree dirty, ignoring paths that a build step regenerates?
 *
 * @param {string} raw exact stdout of `git status --porcelain`
 * @param {string[]} generated repo-relative paths that do not count as work
 * @returns {boolean}
 */
export function isDirty(raw, generated = []) {
  const ignore = new Set(generated.map((f) => f.split('\\').join('/')));
  return changedPaths(raw).some((f) => !ignore.has(f.split('\\').join('/')));
}
