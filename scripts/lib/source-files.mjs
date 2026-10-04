/**
 * source-files.mjs — the repo's definition of "source", for scanners (#1300)
 *
 * A gate that walks the filesystem does not scan source. It scans whatever is
 * on disk, which on a working machine includes every cache, log and report the
 * previous run left behind. `scripts/audit-wb-prefix.mjs` learned this four
 * times:
 *
 *   #960   data/test-results.json (7,080 wb- refs) and data/test-status.json
 *          (1,108) made PACKAGE/MODULE/CLASS track how much failure text the
 *          LAST run happened to capture
 *   #960   data/priority-gate.json — open GitHub issue bodies; issues ABOUT
 *          the removed tags quote them
 *   #1027  data/error-log-archive/ — runtime error text quoting a tag
 *   #1300  data/fixes-cache.json + data/issues-cache.json — the same GitHub
 *          issue text again, under two new names, reporting 700 live
 *          "component tags" that exist in no page anywhere
 *
 * Each time, one more name went on a deny-list. That is not a fix: it is a
 * standing promise to break the gate again with the next generated file, and
 * it makes CI (fresh checkout, no caches) and a developer's tree disagree
 * about the answer.
 *
 * Note what all six have in common: they are all `data/*`. That is not a
 * coincidence — TIER1-LAWS.md §12 says "scripts that produce data write to
 * data/*.json", so `data/` IS this repo's output directory, by law. So the
 * rule is two things, and it needs both:
 *
 *   1. the file list comes from git, not from a filesystem walk, so a
 *      gitignored cache cannot change a gate's answer and a fresh CI checkout
 *      and a working tree agree;
 *   2. `data/` is not source, so the one generated cache that IS deliberately
 *      tracked cannot either. data/priority-gate.json is committed on purpose:
 *      scripts/build-priority-gate.mjs lands a GitHub read on disk so the
 *      pre-commit gate never needs the network (#743), and untracking it would
 *      break that gate on a fresh clone. Tracked, generated, and correctly so.
 *
 * Excluding `data/` blinds nothing: every file in it is derived from source by
 * a script in this repo, so anything a scanner would find there it finds at
 * the origin, where the fix belongs.
 *
 * Otherwise the repo already states which files are source — the ones git
 * tracks, with .gitignore naming everything generated. So ask git. Every
 * former deny-list entry is already gitignored or under data/, and every
 * FUTURE generated file will be too, because an untracked artifact is a
 * problem in its own right
 * (tests/compliance/generated-output-is-not-tracked.spec.ts).
 *
 * `--cached --others --exclude-standard`, not `--cached` alone: the commit
 * gate runs scanners inside a `git worktree add --no-checkout` copy whose
 * index is empty, so a plain `ls-files` there returns nothing and every check
 * passes vacuously (#1161, learned in tests/compliance/repo-layout.spec.ts).
 * Files on disk that .gitignore does not exclude are also the right set for a
 * gate: a stray source file is caught before it is ever committed.
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { suiteEnv } from './suite-env.mjs';

/**
 * Directories the fallback walk must not descend into.
 *
 * This list exists ONLY for the no-git fallback, which runs over a directory
 * that is not a work tree and therefore has no .gitignore to consult. On the
 * git path it is unnecessary by construction: every name here is gitignored,
 * so git never reports it. Do not add generated files here — fix .gitignore
 * instead, which fixes every scanner and CI at once.
 *
 * `lib` is deliberately NOT here, though the deny-list this replaced had it:
 * it matched by basename, so it silently excluded `scripts/lib/` (31 source
 * modules) and `src/lib/` from every scan.
 */
export const WALK_SKIP_DIRS = new Set([
  'node_modules', '.git', 'out', 'dist', 'coverage', 'test-results',
  'playwright-report', 'vendor', 'archive', 'tmp',
  '.claude', 'test-single', 'error-log-archive',
]);

/**
 * Repo-relative path prefixes that are output, not source, whatever git thinks
 * of them. TIER1-LAWS.md §12: script output goes to data/*.json.
 */
export const NON_SOURCE_PREFIXES = ['data/'];

function isSource(rel, prefixes) {
  const posix = rel.split('\\').join('/');
  return !prefixes.some((p) => posix === p.replace(/\/$/, '') || posix.startsWith(p));
}

function walk(dir, extRe, skipDirs, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (skipDirs.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, extRe, skipDirs, out);
    else if (extRe.test(e.name)) out.push(p);
  }
  return out;
}

/**
 * Repo-relative paths of everything git considers part of the tree: tracked
 * files plus untracked files .gitignore does not exclude.
 *
 * @param {string} root absolute path to scan
 * @returns {string[]|null} null when `root` is not inside a git work tree
 */
export function gitFileList(root) {
  let raw;
  try {
    raw = execFileSync(
      'git',
      ['-C', root, 'ls-files', '--cached', '--others', '--exclude-standard', '-z'],
      { encoding: 'utf8', env: suiteEnv(process.env), maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] },
    );
  } catch {
    // No git binary, or `root` is not a work tree (a downstream site audited
    // with --dir, a published tarball). The fallback walk handles it.
    return null;
  }
  // -z: NUL-separated and never quoted, so a path with a space, a quote or a
  // non-ASCII character arrives verbatim instead of as git's C-escaped form.
  return [...new Set(raw.split('\0').filter(Boolean))];
}

/**
 * The source files a scanner should read.
 *
 * @param {object} opts
 * @param {string} opts.root        absolute directory to scan
 * @param {RegExp} opts.ext         extension filter, tested against the basename
 * @param {Set<string>} [opts.skipDirs] directory names for the fallback walk only
 * @param {string[]} [opts.skipPrefixes] repo-relative prefixes that are output
 * @returns {{ files: string[], source: 'git'|'walk' }} absolute paths
 */
export function sourceFiles({
  root, ext, skipDirs = WALK_SKIP_DIRS, skipPrefixes = NON_SOURCE_PREFIXES,
}) {
  const rel = gitFileList(root);
  if (rel && rel.length) {
    return {
      files: rel
        .filter((f) => ext.test(path.basename(f)) && isSource(f, skipPrefixes))
        .map((f) => path.join(root, f)),
      source: 'git',
    };
  }
  return {
    files: walk(root, ext, skipDirs)
      .filter((f) => isSource(path.relative(root, f), skipPrefixes)),
    source: 'walk',
  };
}
