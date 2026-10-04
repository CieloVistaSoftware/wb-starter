import { test, expect } from '../fixtures/offline';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
// One static import (#1403): parallel workers writing the transform cache for
// a dynamic import failed with EPERM on Windows CI.
import { claimedPulls, checkComment } from '../../scripts/check-comment-cites-pr.mjs';

/**
 * #1336, the closing-comment row: a comment that says "Fixed in <PR>" on issue
 * N must cite a PR whose description names #N. A comment file overwritten in
 * the shared scratchpad closes an issue with someone else's fix and someone
 * else's validating test, and gh accepts any well-formed file.
 */
test.describe.configure({ mode: 'serial' });

const REPO = 'CieloVistaSoftware/wb-starter';
const url = (n: number) => `https://github.com/${REPO}/pull/${n}`;

test('only a PR cited as the fix is a claim', () => {
  expect(claimedPulls(`**Fixed in ${url(1455)} (merged as 03ae5574).**`, REPO)).toEqual([1455]);
  expect(claimedPulls(`**Closed by ${url(1454)}.** The fix itself landed earlier`, REPO)).toEqual([1454]);
  expect(claimedPulls(`**Landed (PR #1440, merged as 2ae0ad46): the PR-body row.**`, REPO)).toEqual([1440]);
  expect(claimedPulls(`see also ${url(1300)} for background`, REPO), 'a mention is not a claim').toEqual([]);
  expect(claimedPulls(`Fixed in https://github.com/other/repo/pull/12`, REPO), 'another repo').toEqual([]);
});

test('a swapped closing comment is refused; an honest one passes', () => {
  const swapped = `**Fixed in ${url(1300)} (merged as abc).** ... Validating test: tests/x.spec.ts`;
  const honest = `**Fixed in ${url(1395)} (merged as de6b0cdc).**`;
  const bodies = { 1300: 'Closes #1300.\n\nIn plain English ...', 1395: 'Closes #1015.\n\n...' };
  expect(checkComment(swapped, 1015, bodies, REPO), 'the 2026-10-03 shape: #1300\'s fix on #1015').toHaveLength(1);
  expect(checkComment(honest, 1015, bodies, REPO)).toEqual([]);
  expect(checkComment(`Fixed in ${url(1395)}`, 10150, bodies, REPO), '#1015 is not #10150').toHaveLength(1);
  expect(checkComment(`Fixed in ${url(9)}`, 1015, {}, REPO)[0].reason, 'an unreadable PR is reported, not passed').toMatch(/could not be read/);
});

test('the script fails the job on a swap and passes an honest comment', () => {
  const run = (comment: string, issue: number) => spawnSync(process.execPath, ['scripts/check-comment-cites-pr.mjs'], {
    env: {
      ...process.env, COMMENT_BODY: comment, ISSUE_NUMBER: String(issue), GITHUB_REPOSITORY: REPO,
      PR_BODIES_JSON: JSON.stringify({ 1300: 'Closes #1300.', 1395: 'Closes #1015.' }),
    },
    encoding: 'utf8',
  });
  expect(run(`Fixed in ${url(1300)}`, 1015).status, 'swap exits 1').toBe(1);
  expect(run(`Fixed in ${url(1395)}`, 1015).status, 'honest exits 0').toBe(0);
  expect(run('Thanks, looking into it.', 1015).status, 'no claim, nothing to check').toBe(0);
});

test('the workflow runs on issue comments, passes the comment through env, and answers on the issue', () => {
  const wf = fs.readFileSync('.github/workflows/closing-comment-cites-its-pr.yml', 'utf8');
  expect(wf).toMatch(/issue_comment:\s*\n\s*types:\s*\[created, edited\]/);
  expect(wf).toMatch(/COMMENT_BODY: \$\{\{ github\.event\.comment\.body \}\}/);
  expect(wf, 'the comment must never be interpolated into a run: line').not.toMatch(/run:.*github\.event\.comment/);
  expect(wf).toMatch(/!github\.event\.issue\.pull_request/);
  expect(wf).toMatch(/issues: write/);
  expect(wf).toMatch(/if: failure\(\)[\s\S]*gh issue comment/);
});
