/**
 * Guard for #1161: the environment the commit gate gives the suite must not let
 * a spec's scratch-repo git commands reach the real repository.
 *
 * It reproduces the incident against a FAKE "real" repo, never this one:
 *   - make repo R (stands in for the real checkout) and a scratch dir S;
 *   - build a hook-like environment: GIT_DIR=R/.git, GIT_INDEX_FILE=R/.git/index;
 *   - in a child process with that env passed through suiteEnv(), do exactly what
 *     every-push-to-main-is-a-release.spec.ts does: git init + git config user.*
 *     in S;
 *   - R's config must still be non-bare with no injected identity, and S must
 *     have become its own repo.
 * Node-only, milliseconds.
 */
import { execFileSync, spawnSync } from 'child_process';
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { suiteEnv, HOOK_GIT_VARS } from './lib/suite-env.mjs';

let passed = 0;
let failed = 0;
const check = (ok, name, detail = '') => {
  if (ok) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ ${name}${detail ? `\n     ${detail}` : ''}`); }
};

// This guard itself may run inside a hook: never let OUR git calls leak either.
const clean = suiteEnv(process.env);
const gitIn = (dir, ...args) => execFileSync('git', args, { cwd: dir, env: clean, encoding: 'utf8', stdio: 'pipe' }).trim();

console.log('The gate strips the hook\'s git redirection before running the suite (#1161):');

const R = mkdtempSync(join(tmpdir(), 'wb-real-'));
const S = mkdtempSync(join(tmpdir(), 'wb-scratch-'));
try {
  gitIn(R, 'init', '-q', '-b', 'main');
  const hookEnv = { ...process.env, GIT_DIR: join(R, '.git'), GIT_INDEX_FILE: join(R, '.git', 'index'), git_work_tree: R };

  // ES module child (Tier-1 Law 3: no CommonJS anywhere, including a -e string;
  // compliance/es-modules.spec.ts scans for it and blocked the first attempt).
  const childScript = [
    "import { execFileSync } from 'node:child_process';",
    "const dir = process.argv[1];",
    "const g = (...a) => execFileSync('git', a, { cwd: dir, stdio: 'pipe' });",
    "g('init', '-q', '-b', 'main');",
    "g('config', 'user.email', 'test@example.invalid');",
    "g('config', 'user.name', 'gate');",
  ].join('\n');
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', childScript, S], { env: suiteEnv(hookEnv), encoding: 'utf8' });
  check(child.status === 0, 'the scratch-repo commands run', child.stderr);

  const bare = gitIn(R, 'config', '--local', '--get', 'core.bare');
  check(bare === 'false', 'the real repo is still a working tree (core.bare=false)', `core.bare=${bare}`);

  let injected = '';
  try { injected = gitIn(R, 'config', '--local', '--get-regexp', '^user\\.'); } catch { injected = ''; }
  check(injected === '', 'no identity was written into the real repo', injected);

  check(existsSync(join(S, '.git')), 'the scratch directory became its own repository');

  const stripped = suiteEnv({ GIT_DIR: 'x', Git_Index_File: 'y', GIT_WORK_TREE: 'z', KEEP: '1' }, { WB_TEST_PORT: '' });
  check(
    HOOK_GIT_VARS.every((k) => !(k in stripped)) && !('Git_Index_File' in stripped) && stripped.KEEP === '1' && stripped.WB_TEST_PORT === '',
    'suiteEnv removes every hook git variable (any case), keeps the rest, applies extras',
    JSON.stringify(stripped),
  );
} finally {
  rmSync(R, { recursive: true, force: true });
  rmSync(S, { recursive: true, force: true });
}

console.log(`\n${failed ? '❌' : '✅'} ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
