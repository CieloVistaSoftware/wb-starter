import { test, expect } from '../fixtures/offline';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * #1534: scripts/clean-merged-worktrees.mjs removes the worktrees whose work
 * is merged, and nothing else. Built in a throwaway repository so the real
 * worktrees are never at risk:
 *
 *   wb-merged    merged, clean, node_modules a JUNCTION to a shared folder -> removed
 *   wb-open      branch not merged                                      -> kept
 *   wb-dirty     merged, but a tracked file is edited                   -> kept
 *
 * And the one that matters most (#1129): the shared folder the junction
 * pointed at still has its contents afterwards.
 */
const SCRIPT = path.resolve('scripts', 'clean-merged-worktrees.mjs');

test('removes merged, clean worktrees and never follows the node_modules junction (#1534)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-1534-'));
  const repo = path.join(tmp, 'wb-starter');
  const git = (cwd: string, ...a: string[]) => execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  try {
    fs.mkdirSync(repo);
    git(repo, 'init', '-q', '-b', 'main');
    git(repo, 'config', 'user.email', 'test@example.com');
    git(repo, 'config', 'user.name', 'test');
    fs.writeFileSync(path.join(repo, 'a.txt'), 'a\n');
    git(repo, 'add', '.');
    git(repo, 'commit', '-q', '-m', 'base');

    // The shared node_modules every worktree links to.
    const shared = path.join(tmp, 'shared-node-modules');
    fs.mkdirSync(shared);
    fs.writeFileSync(path.join(shared, 'keep.txt'), 'must survive');

    const add = (name: string, branch: string) => {
      const dir = path.join(tmp, name);
      git(repo, 'worktree', 'add', '-q', '-b', branch, dir, 'main');
      return dir;
    };
    const merged = add('wb-merged', 'merged-branch');
    fs.symlinkSync(shared, path.join(merged, 'node_modules'), 'junction');
    const open = add('wb-open', 'open-branch');
    fs.writeFileSync(path.join(open, 'b.txt'), 'b\n');
    git(open, 'add', '.');
    git(open, 'commit', '-q', '-m', 'unmerged work');
    const dirty = add('wb-dirty', 'dirty-branch');
    fs.writeFileSync(path.join(dirty, 'a.txt'), 'edited, not committed\n');

    const out = execFileSync(process.execPath, [SCRIPT, '--apply', '--base', 'main', '--no-fetch'], { cwd: repo, encoding: 'utf8' });

    expect(fs.existsSync(merged), `the merged, clean worktree is removed\n${out}`).toBe(false);
    expect(fs.readFileSync(path.join(shared, 'keep.txt'), 'utf8'), 'the junction target is untouched (#1129)').toBe('must survive');
    expect(fs.existsSync(open), 'an unmerged worktree is kept').toBe(true);
    expect(fs.existsSync(dirty), 'a worktree with uncommitted edits is kept').toBe(true);
    expect(out).toMatch(/wb-open: open-branch is not merged/);
    expect(out).toMatch(/wb-dirty: uncommitted changes/);
    expect(git(repo, 'branch', '--list', 'merged-branch'), 'the merged branch is deleted').toBe('');
    expect(git(repo, 'worktree', 'list'), 'git no longer lists the removed worktree').not.toContain('wb-merged');
  } finally {
    // Unlink any junction before the recursive delete, the same rule the script follows.
    for (const name of ['wb-merged', 'wb-open', 'wb-dirty']) {
      const nm = path.join(tmp, name, 'node_modules');
      try { if (fs.lstatSync(nm).isSymbolicLink()) fs.unlinkSync(nm); } catch { /* none */ }
    }
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('a dry run changes nothing (#1534)', () => {
  const src = fs.readFileSync(SCRIPT, 'utf8');
  // Every destructive call sits behind the --apply check.
  const firstDestructive = Math.min(...['unlinkSync', "'remove'", "'-D'"].map((s) => src.indexOf(s)).filter((i) => i >= 0));
  const applyGate = src.indexOf('if (!apply)');
  expect(applyGate, 'the script must gate on --apply').toBeGreaterThan(0);
  expect(firstDestructive, 'nothing destructive may run before the --apply gate').toBeGreaterThan(applyGate);
});
