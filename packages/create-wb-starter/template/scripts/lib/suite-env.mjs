/**
 * The environment a gate hands to the test suite (#1161).
 *
 * Inside a git hook, git exports GIT_DIR / GIT_INDEX_FILE (and sometimes
 * GIT_WORK_TREE, GIT_PREFIX, GIT_COMMON_DIR) pointing at the REAL repository.
 * Every child inherits them. So a spec that builds a "throwaway" repo with
 * `git init` in a temp directory is, under the gate, reinitialising the real one.
 *
 * 2026-09-14: that is what happened. A 10th-commit gate ran the suite from the
 * pre-commit hook; tests/regression/every-push-to-main-is-a-release.spec.ts ran
 * `git init` + `git config user.email test@example.invalid` in its scratch dir,
 * and the real .git/config came out with core.bare = true and a repo-local
 * identity "gate <test@example.invalid>". The next `npm run ship` died with
 * "this operation must be run in a work tree".
 *
 * Stripping them here fixes it in one place for every spec, present and future,
 * instead of trusting each of fifty specs to remember.
 */

/** Variables git sets for hooks that redirect git commands to another repo. */
export const HOOK_GIT_VARS = [
  'GIT_DIR',
  'GIT_INDEX_FILE',
  'GIT_WORK_TREE',
  'GIT_PREFIX',
  'GIT_COMMON_DIR',
  'GIT_OBJECT_DIRECTORY',
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
];

/**
 * A copy of `env` with the hook's git redirection removed and `extra` applied.
 * Pure: never mutates the input.
 */
export function suiteEnv(env, extra = {}) {
  const out = { ...env };
  for (const key of Object.keys(out)) {
    // Windows env keys are case-insensitive; match that.
    if (HOOK_GIT_VARS.includes(key.toUpperCase())) delete out[key];
  }
  return { ...out, ...extra };
}
