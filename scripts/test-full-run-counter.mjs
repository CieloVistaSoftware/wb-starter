/**
 * Guard for #1178: a full suite run by release.mjs resets the 10th-commit
 * counter, so `npm run ship` never runs the whole suite twice on one batch.
 *
 * Node-only, a few seconds, throwaway git repos only; it never reads or writes
 * this repository's counter.
 *
 * Parameters and their edges (every combination runs, nothing hand-picked):
 *   counter before  : absent | 0 | 3 | 9 | 10 | 15 | garbage
 *   ratchet verdict : pass | fail
 *   where           : main checkout | linked worktree (#974: one shared count)
 * Oracle:
 *   ratchet passes -> release exits 0 and the counter reads 0 from BOTH places
 *   ratchet fails  -> release exits 1 and the counter file is byte-for-byte unchanged
 *
 * Plus: the path ignores a hostile inherited GIT_DIR (#1161), the read rules
 * match the hook's (absent or unreadable is 0), and the hook takes its path from
 * the shared module rather than its own copy of the git command.
 */
import { execFileSync, spawnSync } from 'child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, existsSync, rmSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { fullRunCounterPath, readFullRunCount } from './lib/full-run-counter.mjs';
import { suiteEnv } from './lib/suite-env.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

let passed = 0;
let failed = 0;
const check = (ok, name, detail = '') => {
  if (ok) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ ${name}${detail ? `\n     ${detail}` : ''}`); }
};

const env = suiteEnv(process.env);
const scratch = [];

/** A repo that can run a copy of release.mjs with a stub ratchet. */
function releaseRepo(ratchetExit) {
  const dir = mkdtempSync(join(tmpdir(), 'wb-full-run-counter-'));
  scratch.push(dir);
  const git = (...a) => execFileSync('git', a, { cwd: dir, env, stdio: 'pipe', encoding: 'utf8' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'guard@example.invalid');
  git('config', 'user.name', 'guard');

  for (const f of ['scripts/release.mjs', 'scripts/lib/full-run-counter.mjs', 'scripts/lib/suite-env.mjs', 'scripts/lib/next-version.mjs']) {
    mkdirSync(dirname(join(dir, f)), { recursive: true });
    copyFileSync(join(ROOT, f), join(dir, f));
  }
  mkdirSync(join(dir, '.husky'), { recursive: true });
  writeFileSync(join(dir, '.husky', 'test-ratchet.mjs'), `process.exit(${ratchetExit});\n`);
  // release.mjs's gate 2 reads the version's entry from data/releases.json
  // (1.0 replaced the hand-edited What's New page with it).
  mkdirSync(join(dir, 'data'), { recursive: true });
  writeFileSync(join(dir, 'data', 'releases.json'),
    JSON.stringify({ releases: [{ version: '1.0.1', items: [{ kind: 'fixed', html: 'fixture' }] }] }) + '\n');
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'guard', version: '1.0.0', type: 'module' }) + '\n');
  git('add', '-A');
  git('commit', '-q', '-m', 'fixture');

  const wt = join(dir, 'linked-worktree');
  git('worktree', 'add', '-q', '-b', 'side', wt);
  return { dir, wt };
}

// ── 1. One counter, wherever you ask from, whatever GIT_DIR says ─────────────
console.log('\nthe counter path');
{
  const { dir, wt } = releaseRepo(0);
  const fromMain = fullRunCounterPath(dir);
  const fromWorktree = fullRunCounterPath(wt);
  check(fromMain === fromWorktree, 'main checkout and linked worktree share one counter (#974)',
    `main: ${fromMain}\n     worktree: ${fromWorktree}`);
  check(resolve(fromMain) === resolve(dir, '.git', 'wb-fix-count'), 'it lives in the common .git directory', fromMain);

  const other = releaseRepo(0).dir;
  const saved = process.env.GIT_DIR;
  process.env.GIT_DIR = join(other, '.git');
  const hostile = fullRunCounterPath(dir);
  if (saved === undefined) delete process.env.GIT_DIR; else process.env.GIT_DIR = saved;
  check(hostile === fromMain, 'an inherited GIT_DIR does not redirect it to another repo (#1161)', hostile);
}

// ── 2. Read rules match the hook: absent or unreadable is 0 ──────────────────
console.log('\nreading the count');
{
  const { dir } = releaseRepo(0);
  const file = fullRunCounterPath(dir);
  const cases = [[null, 0], ['0\n', 0], ['3\n', 3], ['9\n', 9], ['10\n', 10], ['15', 15], ['garbage\n', 0], ['-3\n', 0]];
  for (const [content, want] of cases) {
    if (content === null) rmSync(file, { force: true }); else writeFileSync(file, content);
    const got = readFullRunCount(dir);
    check(got === want, `${content === null ? 'absent' : JSON.stringify(content)} reads as ${want}`, `got ${got}`);
  }
}

// ── 3. release.mjs: a passing full run resets it, a failing one leaves it ─────
console.log('\nrelease.mjs and the counter');
const BEFORE = [null, '0\n', '3\n', '9\n', '10\n', '15\n', 'garbage\n'];
for (const verdict of ['pass', 'fail']) {
  for (const before of BEFORE) {
    for (const where of ['main', 'worktree']) {
      const { dir, wt } = releaseRepo(verdict === 'pass' ? 0 : 1);
      const cwdRepo = where === 'main' ? dir : wt;
      const file = fullRunCounterPath(dir);
      if (before !== null) writeFileSync(file, before);

      const run = spawnSync(process.execPath, [join(cwdRepo, 'scripts', 'release.mjs'), '--check'], {
        cwd: cwdRepo, env, encoding: 'utf8',
      });
      const label = `ratchet ${verdict}, counter ${before === null ? 'absent' : JSON.stringify(before.trim())}, from ${where}`;

      if (verdict === 'pass') {
        const ok = run.status === 0 && readFullRunCount(dir) === 0 && readFullRunCount(wt) === 0 && existsSync(file);
        check(ok, `${label} -> exit 0, counter 0`,
          `exit ${run.status}, main reads ${readFullRunCount(dir)}, worktree reads ${readFullRunCount(wt)}, file ${existsSync(file) ? 'present' : 'absent'}` +
          (run.status !== 0 ? `\n     ${(run.stderr || run.stdout).trim().split(String.fromCharCode(10)).slice(-3).join(' | ')}` : ''));
      } else {
        const after = existsSync(file) ? readFileSync(file, 'utf8') : null;
        check(run.status === 1 && after === before, `${label} -> exit 1, counter untouched`,
          `exit ${run.status}, before ${JSON.stringify(before)}, after ${JSON.stringify(after)}`);
      }
    }
  }
}

// ── 4. The hook takes its path from the shared module ────────────────────────
console.log('\nthe pre-commit hook');
{
  const hook = readFileSync(join(ROOT, '.husky', 'pre-commit'), 'utf8');
  const line = hook.split(String.fromCharCode(10)).find((l) => /^\s*COUNT_FILE=/.test(l)) || '';
  check(line.includes('scripts/lib/full-run-counter.mjs --path'),
    'COUNT_FILE comes from scripts/lib/full-run-counter.mjs, not a second copy of the git command', line.trim());
}

for (const d of scratch) {
  try { rmSync(d, { recursive: true, force: true }); } catch { /* a locked temp dir is not a guard failure */ }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
