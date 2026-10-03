/**
 * Is this changed file something the build rewrote, rather than someone's work?
 *
 * `npm start` and every commit rewrite: the version stamp, the docs manifests,
 * and the ?v= cache key in entry pages (index.html, pages/, demos/). None of
 * that is work. Two places need the same answer:
 *   - stamp-version.js, so the badge does not say "uncommitted local edits"
 *     just because the server started;
 *   - pull-latest.mjs, which may reset these files to pull, and must never
 *     reset anything else.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const STAMPED = new Set(['src/core/version.js', 'docs/manifest.json', 'data/docs-manifest.json']);
const isEntryPage = (f) => f === 'index.html' || /^(pages|demos)\/[^/]+\.html$/.test(f);
const withoutKeys = (s) => s.replace(/\r\n/g, '\n').replace(/\?v=[^"'\s)]*/g, '').trim();

/** @param {string} root repo root  @param {string} file repo-relative path */
export function isBuildOutput(root, file) {
  const f = file.split('\\').join('/');
  if (STAMPED.has(f)) return true;
  if (!isEntryPage(f)) return false;
  try {
    const committed = execFileSync('git', ['show', `HEAD:${f}`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 30000 });
    return withoutKeys(committed) === withoutKeys(readFileSync(path.join(root, f), 'utf8'));
  } catch {
    return false;
  }
}
