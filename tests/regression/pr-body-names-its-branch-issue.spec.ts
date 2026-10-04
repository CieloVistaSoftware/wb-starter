import { test, expect } from '../fixtures/offline';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
// One static import (#1403): parallel workers writing the transform cache for
// a dynamic import failed with EPERM on Windows CI.
import { checkPrBody } from '../../scripts/check-pr-body-issue.mjs';

/**
 * #1336, the PR row: a PR on an issue branch has a description that names
 * that issue. A body file overwritten in the shared scratchpad gives a PR that
 * argues for someone else's change, and gh accepts any well-formed file.
 */
test.describe.configure({ mode: 'serial' });

test('a swapped description is refused; honest ones pass', () => {
  const branch = 'claude/fix-1015-something';
  expect(checkPrBody('Closes #1300.\n\n## In plain English\n...', branch).ok, 'another issue\'s body').toBe(false);
  expect(checkPrBody('Closes #1015.\n\n## In plain English\n...', branch).ok).toBe(true);
  expect(checkPrBody('#1015 at the start of a line counts in a PR', branch).ok, 'not a git comment here').toBe(true);
  expect(checkPrBody('Closes #10150.', branch).ok, '#10150 is not #1015').toBe(false);
  expect(checkPrBody('anything', 'claude/fix-hero-sweep-wait').ok, 'no issue in the branch').toBe(true);
});

test('the script fails the job on a swap and passes an honest PR', () => {
  const run = (body: string, branch: string) => spawnSync(process.execPath, ['scripts/check-pr-body-issue.mjs'], {
    env: { ...process.env, PR_BODY: body, PR_BRANCH: branch }, encoding: 'utf8',
  });
  expect(run('Closes #1300.', 'claude/fix-1015-x').status, 'swap exits 1').toBe(1);
  expect(run('Closes #1015.', 'claude/fix-1015-x').status, 'honest exits 0').toBe(0);
});

test('a workflow runs the check on every PR, with the body passed as data (#1336)', () => {
  const wf = fs.readFileSync('.github/workflows/pr-body-names-its-issue.yml', 'utf8');
  expect(wf).toMatch(/pull_request:\s*\n\s*types:\s*\[opened, edited, reopened, synchronize\]/);
  expect(wf).toContain('node scripts/check-pr-body-issue.mjs');
  // Untrusted text goes through env, never into the run line itself.
  expect(wf).toContain('PR_BODY: ${{ github.event.pull_request.body }}');
  expect(wf).not.toMatch(/run:.*github\.event\.pull_request\.body/);
});
