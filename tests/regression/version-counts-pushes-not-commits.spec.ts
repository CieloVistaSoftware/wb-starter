import { test, expect } from '@playwright/test';
import { execFileSync } from 'child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { countPushes } from '../../scripts/lib/push-count.mjs';

/**
 * John, 2026-10-02: "count pushes not commits." Counting commits made the
 * badge jump by three per push (change + merge + stamp): 1.0.83 -> 1.0.86 ->
 * 1.0.89. A push is one first-parent commit on main; the stamp workflow's
 * "chore(version): stamp" commit belongs to the push it stamps.
 */
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

test('one merged PR plus its stamp commit is one push, however many commits it carries', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'push-count-'));
  try {
    git(dir, 'init', '-q', '-b', 'main');
    git(dir, 'config', 'user.email', 't@t'); git(dir, 'config', 'user.name', 't');
    const commit = (msg: string) => { writeFileSync(path.join(dir, 'f.txt'), msg); git(dir, 'add', '-A'); git(dir, 'commit', '-qm', msg); };
    commit('start'); git(dir, 'tag', 'v1.0.89');
    expect(countPushes(dir, 'v1.0.89')).toBe(0);

    // Push 1: a PR with three commits, merged, then stamped.
    git(dir, 'checkout', '-q', '-b', 'pr');
    commit('one'); commit('two'); commit('three');
    git(dir, 'checkout', '-q', 'main');
    git(dir, 'merge', '-q', '--no-ff', 'pr', '-m', 'Merge PR #1: three commits');
    expect(countPushes(dir, 'v1.0.89'), 'the merge is push 1').toBe(1);
    commit('chore(version): stamp v1.0.90 for main');
    expect(countPushes(dir, 'v1.0.89'), 'the stamp is not another push').toBe(1);

    // Push 2: a direct commit, then stamped.
    commit('fix: direct');
    commit('chore(version): stamp v1.0.91 for main');
    expect(countPushes(dir, 'v1.0.89')).toBe(2);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
