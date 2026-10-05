/**
 * The date of each file's last COMMIT, never its mtime (#1071, #1503).
 *
 * A fresh clone stamps every mtime with the checkout time, and an mtime changes
 * on every save, so anything generated from mtimes churns on every machine and
 * every run. A commit date changes only when the file itself is committed
 * again. Shared by scripts/update-docs-manifest.js and
 * scripts/generate-search-index.js -- one implementation, not two.
 *
 * Returns null when git cannot give a true answer -- no git, not a repo, or a
 * shallow clone, where every file older than the cut-off would wrongly carry
 * the newest commit's date. Callers then leave the dates they have.
 *
 * @param {string} root repository root
 * @param {string[]} paths directories to read history for
 * @returns {Map<string, string> | null} repo-relative path -> YYYY-MM-DD
 */
import { execFileSync } from 'node:child_process';

export function readGitDates(root, paths) {
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 256 * 1024 * 1024 });
  try {
    if (git('rev-parse', '--is-shallow-repository').trim() === 'true') return null;
    // One pass over history, newest commit first: the first time a path
    // appears is its latest commit.
    const log = git('log', '--format=%x00%cs', '--name-only', '--', ...paths);
    const dates = new Map();
    let date = '';
    for (const line of log.split('\n')) {
      if (line.startsWith('\0')) { date = line.slice(1); continue; }
      const file = line.trim();
      if (file && !dates.has(file)) dates.set(file, date);
    }
    return dates;
  } catch {
    return null;
  }
}

/**
 * The date each file was CREATED: the commit that first added it, carried
 * through renames (#1226 -- John: "I want to be able to see all docs by
 * creation date somehow").
 *
 * One pass over history, oldest first. An add records its path's date; a
 * rename hands the old path's date to the new one, so a moved doc keeps the
 * day it was written. Same refusal as readGitDates for a shallow clone, whose
 * cut-off commit would look like every old file's birthday.
 *
 * @param {string} root repository root
 * @param {string[]} paths directories to read history for
 * @returns {Map<string, string> | null} repo-relative path -> YYYY-MM-DD
 */
export function readGitCreated(root, paths) {
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 256 * 1024 * 1024 });
  try {
    if (git('rev-parse', '--is-shallow-repository').trim() === 'true') return null;
    const log = git('log', '--reverse', '-M', '--diff-filter=AR', '--name-status', '--format=%x00%cs', '--', ...paths);
    const created = new Map();
    let date = '';
    for (const line of log.split('\n')) {
      if (line.startsWith('\0')) { date = line.slice(1); continue; }
      const [status, from, to] = line.split('\t');
      if (!status) continue;
      if (status === 'A' && from && !created.has(from)) created.set(from, date);
      else if (status.startsWith('R') && to) created.set(to, created.get(from) || date);
    }
    return created;
  } catch {
    return null;
  }
}
