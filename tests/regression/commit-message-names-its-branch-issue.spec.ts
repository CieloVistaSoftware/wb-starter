import { test, expect } from '../fixtures/offline';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * #1336 -- a commit on an issue branch names that issue.
 *
 * Two parallel agents wrote commit-msg.txt in the shared scratchpad; the #1015
 * branch got a commit carrying the #1300 agent's message, and nothing caught it
 * but a person. .husky/commit-msg now refuses a message that does not cite the
 * issue the branch is named for.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

test('the branch issue is read from every branch shape the repo uses', async () => {
  const { branchIssue } = await import(pathToFileURL(path.join(ROOT, 'scripts/lib/commit-issue-match.mjs')).href);
  expect(branchIssue('claude/fix-1336-commit-names-branch-issue')).toBe(1336);
  expect(branchIssue('fix/1327-img-height')).toBe(1327);
  expect(branchIssue('claude/test-1056-lazy-only-rows')).toBe(1056);
  expect(branchIssue('claude/fix-hero-sweep-wait')).toBeNull();
  expect(branchIssue('main')).toBeNull();
});

test('the #1336 swap is refused; honest messages pass', async () => {
  const { checkMessage } = await import(pathToFileURL(path.join(ROOT, 'scripts/lib/commit-issue-match.mjs')).href);
  const branch = 'claude/fix-1015-something';
  expect(checkMessage('fix(#1300): wb- prefix audit counts tracked files', branch).ok, 'the 2026-10-03 swap').toBe(false);
  expect(checkMessage('fix(#1015): the real fix', branch).ok).toBe(true);
  expect(checkMessage('test: tighten the guard\n\nRefs #1015.', branch).ok, 'cited in the body').toBe(true);
  expect(checkMessage('fix(#10150): other', branch).ok, '#10150 is not #1015').toBe(false);
  expect(checkMessage("Merge branch 'main' into claude/fix-1015-something", branch).ok).toBe(true);
  expect(checkMessage('anything at all', 'claude/fix-hero-sweep-wait').ok, 'no issue in the branch').toBe(true);
  expect(checkMessage('fix: x\n# On branch fix-1015\n# #1015 mentioned only in a git comment', branch).ok,
    "git's comment lines do not count").toBe(false);
});

test('.husky/commit-msg refuses a swapped message in a real repository', () => {
  const hook = fs.readFileSync(path.join(ROOT, '.husky/commit-msg'), 'utf8');
  expect(hook).toContain('scripts/check-commit-issue.mjs');

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-1336-'));
  try {
    const git = (...a: string[]) => execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    git('init', '-q');
    git('checkout', '-q', '-b', 'claude/fix-1015-x');
    const msg = path.join(dir, 'msg.txt');
    const run = (text: string) => {
      fs.writeFileSync(msg, text);
      try {
        execFileSync(process.execPath, [path.join(ROOT, 'scripts/check-commit-issue.mjs'), msg], { cwd: dir, stdio: 'pipe' });
        return 0;
      } catch (e: any) { return e.status; }
    };
    expect(run('fix(#1300): someone else\'s work'), 'swapped message must fail the hook').toBe(1);
    expect(run('fix(#1015): this branch\'s work')).toBe(0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
