/**
 * A TEST THAT NAMES AN ISSUE IS A TEST FOR THAT ISSUE
 * ==================================================
 * #1090. The state engine reported #1078 as `needs-test — work exists, no test
 * names it`. A spec named it twice, once in the test title itself:
 *
 *   test('a mid-boot setContent does not leave injections stuck forever (#1078)', …)
 *
 * So a fixed, tested, committed issue read as untested and sat in the backlog
 * looking like open work. `treeCites` could not have caught it: that scans the
 * diff and untracked files, so a spec becomes invisible to it the moment it is
 * committed — exactly when the issue is next reviewed.
 *
 * THE TRAP THIS SPEC EXISTS TO HOLD SHUT
 * --------------------------------------
 * The obvious fix — match `#NNNN` anywhere in the spec — was written first and
 * was wrong within minutes. It credited #1080 with a spec whose author had
 * explicitly failed to diagnose it, because the file contained:
 *
 *   // awaiting what it starts and whenIdle() reporting it. Filed as #1080 so
 *
 * A comment saying an issue was FILED is the opposite of a test proving it
 * fixed. That is the same defect as #1041 (a file containing "#1234" counted as
 * pending work on it) and #1085 (a comment reading "zero <x-demo>" counted as an
 * <x-demo>) — prose read as source truth, for the third time.
 *
 * So only a test/describe TITLE counts: the assertion surface, where naming an
 * issue is a claim about what is being proven.
 */
import { test, expect } from '@playwright/test';
import { issuesNamedInTestTitles } from '../../scripts/lib/test-citations.mjs';

const set = (s: Set<number>) => [...s].sort((a, b) => a - b);

test.describe('#1090 — only a test title claims an issue', () => {
  test('a number in a test title counts', () => {
    const src = `test('a mid-boot setContent does not leave injections stuck forever (#1078)', async () => {});`;
    expect(set(issuesNamedInTestTitles(src))).toEqual([1078]);
  });

  test('a number in a describe title counts', () => {
    const src = `test.describe('#1076 — a push to main must carry a version', () => {});`;
    expect(set(issuesNamedInTestTitles(src))).toEqual([1076]);
  });

  test('a number in a COMMENT does not count', () => {
    // The exact line that mis-credited #1080.
    const src = [
      '/** REGRESSION (#1075): the auto-inject loop threw its promises away. */',
      "// awaiting what it starts and whenIdle() reporting it. Filed as #1080 so",
      "test('scan awaits every injection it starts', async () => {});",
    ].join('\n');
    expect(set(issuesNamedInTestTitles(src))).toEqual([]);
  });

  test('a number in ordinary code does not count', () => {
    const src = `const RELATED = [1080, 1075]; // see #1080\ntest('unrelated title', () => {});`;
    expect(set(issuesNamedInTestTitles(src))).toEqual([]);
  });

  test('several issues in one title all count', () => {
    const src = `test('release.mjs no longer corrupts the lockfile (#991, #1057)', () => {});`;
    expect(set(issuesNamedInTestTitles(src))).toEqual([991, 1057]);
  });

  test('every quote style a title can use is read', () => {
    const src = [
      `test("double (#101)", () => {});`,
      `test('single (#102)', () => {});`,
      'test(`backtick (#103)`, () => {});',
    ].join('\n');
    expect(set(issuesNamedInTestTitles(src))).toEqual([101, 102, 103]);
  });

  test('a bare number without a hash is not an issue reference', () => {
    // Titles carry counts and sizes constantly — "builds 415 demos" must not
    // claim issue 415.
    const src = `test('builds 415 demos under 900ms', () => {});`;
    expect(set(issuesNamedInTestTitles(src))).toEqual([]);
  });

  test('empty and missing input are handled', () => {
    expect(set(issuesNamedInTestTitles(''))).toEqual([]);
    expect(set(issuesNamedInTestTitles(null as unknown as string))).toEqual([]);
  });
});
