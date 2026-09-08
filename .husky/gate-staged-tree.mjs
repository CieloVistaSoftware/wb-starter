/**
 * GATE THE COMMIT, NOT THE WORKING DIRECTORY
 * ==========================================
 * #1065. John: "this is only about the 10th time changes (late) have aborted
 * the commit/next release. This points to our process being unable to finish
 * doing the right thing."
 *
 * He is right, and it is structural. `.husky/test-ratchet.mjs` boots a server
 * on the repo directory and runs Playwright against whatever is on disk at that
 * moment. The full suite is ~7,500 tests and takes ~50 minutes. So the gate does
 * not validate the commit — it validates the working directory, continuously,
 * for fifty minutes, and then reports a verdict about a tree that no longer
 * exists.
 *
 * Measured in a single session: three runs died that way. Two to edits made by
 * the committer while the run was going, and one to a DIFFERENT session's change
 * to a spec the commit did not contain — that commit named 18 files by pathspec
 * and was blocked by a file that was not among them. No amount of care by the
 * committer prevents that, which is what makes it a race rather than a gate.
 *
 * WHAT THIS DOES
 * --------------
 * Materialises the INDEX — exactly what `git commit` is about to record — into a
 * throwaway worktree, and runs the ratchet there. Edits landing during the run
 * cannot affect it, because the run is not looking at the place edits happen.
 * Two sessions stop invalidating each other for free.
 *
 *   git worktree add --detach <tmp>          a real checkout, so specs that
 *                                            shell out to git still work
 *   git checkout-index -a -f --prefix=<tmp>/ overwrite it with the STAGED
 *                                            content, not HEAD's
 *   node .husky/test-ratchet.mjs             run the unchanged gate in there
 *
 * WHY NOT JUST `git stash` THE UNSTAGED CHANGES
 * ---------------------------------------------
 * Because the stash stack is shared with every other worktree and session on
 * this machine — the exact concurrency this exists to survive. A stash/pop
 * around a fifty-minute run is a window for another session to pop the wrong
 * entry, and it would leave the working directory mangled if the run is killed.
 * Nothing here touches the user's files.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, symlinkSync, copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const REPO = resolve(fileURLToPath(new URL('..', import.meta.url)));

const git = (args, opts = {}) =>
  execFileSync('git', args, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();

/** Unique per run, so two concurrent commits cannot collide on one path. */
const stamp = `${Date.now().toString(36)}-${process.pid}`;
const TMP = join(tmpdir(), `wb-gate-${stamp}`);

let worktreeAdded = false;

function cleanup() {
  // Always, on every path — a failed gate must not leave a checkout behind, or
  // `git worktree list` fills with corpses and the disk fills with node_modules
  // junctions pointing at a repo nobody remembers.
  try {
    if (worktreeAdded) execFileSync('git', ['worktree', 'remove', '--force', TMP], { cwd: REPO, stdio: 'ignore' });
  } catch { /* fall through to the rm below */ }
  try { rmSync(TMP, { recursive: true, force: true, maxRetries: 3 }); } catch { /* best effort */ }
  try { execFileSync('git', ['worktree', 'prune'], { cwd: REPO, stdio: 'ignore' }); } catch { /* best effort */ }
}

// Interrupts included: Ctrl-C during a fifty-minute gate is normal, and it must
// not be the thing that leaves the repo in a worse state than not running it.
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => { cleanup(); process.exit(130); });
}

function main() {
  const staged = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean);
  if (!staged.length) {
    console.log('[gate] nothing staged — skipping the full-suite gate.');
    return 0;
  }

  console.log(`[gate] testing the STAGED tree (${staged.length} file(s)), not the working directory.`);
  console.log(`[gate] ${TMP}`);

  mkdirSync(TMP, { recursive: true });
  git(['worktree', 'add', '--detach', '--no-checkout', TMP, 'HEAD']);
  worktreeAdded = true;

  // The index, not HEAD. This is the whole point: what runs is what commits.
  git(['checkout-index', '-a', '-f', `--prefix=${TMP}/`]);

  // node_modules is gitignored and enormous. A junction costs nothing and needs
  // no elevation on Windows; installing per commit would make a 50-minute gate
  // very much worse.
  const mods = join(REPO, 'node_modules');
  if (existsSync(mods)) {
    try {
      symlinkSync(mods, join(TMP, 'node_modules'), 'junction');
    } catch (err) {
      console.error(`[gate] could not link node_modules: ${err.message}`);
      console.error('[gate] refusing to run — an install-less tree would fail for the wrong reason.');
      return 1;
    }
  }

  // Gitignored files the suite legitimately needs. The register itself is
  // TRACKED, so it arrives with checkout-index; these are the few that are not.
  for (const rel of ['.env', 'data/issues-cache.json']) {
    const from = join(REPO, rel);
    if (existsSync(from)) {
      try {
        mkdirSync(join(TMP, rel, '..'), { recursive: true });
        copyFileSync(from, join(TMP, rel));
      } catch { /* optional by definition */ }
    }
  }

  const run = spawnSync(process.execPath, [join('.husky', 'test-ratchet.mjs'), ...process.argv.slice(2)], {
    cwd: TMP,
    stdio: 'inherit',
    env: {
      ...process.env,
      // Never adopt a server from the real checkout: that would serve the
      // working directory and reintroduce exactly the bug being fixed.
      WB_TEST_PORT: '',
      // Let the suite know where it really lives, for anything that reports paths.
      WB_GATE_SOURCE_REPO: REPO,
    },
  });

  // The reporter's evidence is written inside the temp tree, which is correct —
  // the gate must not clobber data/test-results/ in the real checkout, since
  // scripts/issue-state.mjs reads it and a filtered run wiping it is #1038 all
  // over again. Copy back only the two summaries, so a blocked commit can still
  // be diagnosed without the run being re-done.
  for (const rel of ['data/test-results/failures.json', 'data/test-results/comparison.json']) {
    const from = join(TMP, rel);
    if (!existsSync(from)) continue;
    try {
      mkdirSync(join(REPO, 'data', 'gate-evidence'), { recursive: true });
      copyFileSync(from, join(REPO, 'data', 'gate-evidence', rel.split('/').pop()));
    } catch { /* diagnosis aid only */ }
  }

  if (run.status !== 0) {
    console.error('');
    console.error('[gate] The STAGED tree did not pass. This verdict is about the commit itself,');
    console.error('[gate] so editing files now cannot change it — fix the staged content, restage,');
    console.error('[gate] and commit again. Evidence: data/gate-evidence/');
  }
  return run.status === 0 ? 0 : 1;
}

let code = 1;
try {
  code = main();
} catch (err) {
  console.error(`[gate] failed to set up the staged-tree checkout: ${err.message}`);
  console.error('[gate] NOT falling back to testing the working directory — that is the bug (#1065).');
  code = 1;
} finally {
  cleanup();
}
process.exit(code);
