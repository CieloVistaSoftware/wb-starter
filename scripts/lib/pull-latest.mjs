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
import path from 'node:path';
import { changedPaths } from './git-status.mjs';
import { isBuildOutput } from './build-output.mjs';

export function pullLatest(root) {
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000 }).trim();
  const firstLine = (e) => String((e && e.message) || e).split('\n')[0];

  try {
    const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
    if (branch !== 'main') return { updated: false, message: `on branch "${branch}", not main -- not updated` };

    git('fetch', '--quiet', 'origin', 'main');
    const behind = Number(git('rev-list', '--count', 'HEAD..origin/main'));
    if (!behind) return { updated: false, message: 'already the latest code' };

    // Raw, never trimmed: see git-status.mjs (#1082).
    const status = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8', timeout: 30000 });
    const changed = changedPaths(status).map((f) => f.split('\\').join('/'));
    const own = changed.filter((f) => !isBuildOutput(root, f));
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
export function updateToLatest(root, { quiet = false } = {}) {
  if (isTestServer()) {
    return Promise.resolve({ updated: false, message: 'test server: not updating' });
  }
  const result = pullLatest(root);
  if (!quiet || result.updated) console.log(`[update-to-latest] ${result.message}`);
  if (!result.updated) return Promise.resolve(result);
  return new Promise((resolve) => {
    execFile(process.execPath, restampArgs(root), { cwd: root }, () => resolve(result));
  });
}

const isTestServer = () => Boolean(process.env.CI) || process.env.WB_NO_OPEN === '1';

/**
 * The re-stamp after an update. --local, the same as npm start: the dev server
 * serves .local/src/core/version.js (#1131), so a stamp written to the tracked
 * file left the badge on the old number until a restart, and dirtied the
 * working tree besides.
 */
export function restampArgs(root) {
  return [path.join(root, 'scripts', 'stamp-version.js'), '--local'];
}

/**
 * John, 2026-10-10: "the local version must always match the .io". npm start
 * pulls once and the badge pulls on a click, but main moves many times a day,
 * so a server left running fell behind the live site and showed an older
 * number. This checks origin/main every `everyMs` and brings the checkout up
 * to it under pullLatest()'s rules (main only, fast-forward only, never over
 * the person's own edits). It logs only when it updates, or when the reason
 * it cannot changes, so a checkout on a branch says so once, not every tick.
 * Off on a test or CI server. Returns a function that stops it.
 */
export function keepUpToDate(root, {
  everyMs = 120000, update = updateToLatest, log = console.log,
  schedule = (fn, ms) => setInterval(fn, ms), cancel = clearInterval,
} = {}) {
  if (isTestServer()) return () => {};
  let last = '';
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const { updated, message } = await update(root, { quiet: true });
      if (!updated && message !== 'already the latest code' && message !== last) {
        log(`[keep-up-to-date] ${message} -- this copy can fall behind the live site`);
      }
      last = updated ? '' : message;
    } finally { running = false; }
  };
  const timer = schedule(tick, everyMs);
  if (timer && timer.unref) timer.unref();
  return () => cancel(timer);
}
