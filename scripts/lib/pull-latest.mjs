/**
 * Bring a checkout up to the latest main from GitHub -- on request.
 *
 * John, 2026-10-02, pointing at the version badge: "make pressing this button
 * first get the latest code before reloading." server.js calls this from
 * POST /api/update-to-latest when the badge is clicked on port 3000.
 *
 * Safe by construction:
 *   - only on branch main, only a fast-forward (`git pull --ff-only`): it never
 *     merges, rebases or rewrites anything;
 *   - files the build rewrites on every start are reset first, or they would
 *     block every pull: the version stamp, the docs manifests, and entry pages
 *     whose ONLY change is the ?v= cache key;
 *   - any other uncommitted change is the person's own work: it is left
 *     untouched and nothing is pulled.
 *
 * Never throws: returns { updated, message } with one line saying what it did.
 */
import { execFileSync, execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const STAMPED = new Set(['src/core/version.js', 'docs/manifest.json', 'data/docs-manifest.json']);
const isEntryPage = (f) => f === 'index.html' || /^(pages|demos)\/[^/]+\.html$/.test(f);
const withoutKeys = (s) => s.replace(/\?v=[^"'\s)]*/g, '');

export function pullLatest(root) {
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const firstLine = (e) => String((e && e.message) || e).split('\n')[0];

  // A file the build rewrote, not something the person wrote.
  const rewrittenByBuild = (f) => {
    if (STAMPED.has(f)) return true;
    if (!isEntryPage(f)) return false;
    try { return withoutKeys(git('show', `HEAD:${f}`)) === withoutKeys(readFileSync(path.join(root, f), 'utf8').trim()); } catch { return false; }
  };

  try {
    const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
    if (branch !== 'main') return { updated: false, message: `on branch "${branch}", not main -- not updated` };

    git('fetch', '--quiet', 'origin', 'main');
    const behind = Number(git('rev-list', '--count', 'HEAD..origin/main'));
    if (!behind) return { updated: false, message: 'already the latest code' };

    const changed = git('status', '--porcelain').split('\n').filter(Boolean).map((l) => l.slice(3).replace(/\\/g, '/'));
    const own = changed.filter((f) => !rewrittenByBuild(f));
    if (own.length) {
      return { updated: false, message: `not updated: you have uncommitted changes (${own.slice(0, 3).join(', ')}${own.length > 3 ? ', ...' : ''}), left untouched` };
    }
    if (changed.length) git('checkout', '--', ...changed);
    git('pull', '--ff-only', '--quiet', 'origin', 'main');
    return { updated: true, message: `updated to the latest main (+${behind} commit${behind === 1 ? '' : 's'})` };
  } catch (e) {
    return { updated: false, message: `not updated: ${firstLine(e)}` };
  }
}

/**
 * What POST /api/update-to-latest does: refuse on a test or CI server (a test
 * must never pull anyone's checkout), pull, re-stamp the version on success,
 * and log one line. Resolves { updated, message }.
 */
export function updateToLatest(root) {
  if (process.env.CI || process.env.WB_NO_OPEN === '1') {
    return Promise.resolve({ updated: false, message: 'test server: not updating' });
  }
  const result = pullLatest(root);
  console.log(`[update-to-latest] ${result.message}`);
  if (!result.updated) return Promise.resolve(result);
  return new Promise((resolve) => {
    execFile(process.execPath, [path.join(root, 'scripts', 'stamp-version.js')], { cwd: root }, () => resolve(result));
  });
}
