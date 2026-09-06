import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

/**
 * #1042 — the state engine must see every commit, and must report where a fix
 * has travelled even when its spec was not in the last run.
 *
 * `scripts/issue-state.mjs` split its git log on '\x1e\x1e' — a doubled
 * separator that `%H%x1f%s%x1e%b%x1e` only produces when a commit body is
 * EMPTY. Commits WITH bodies never created that boundary, so they were glued to
 * their neighbours and all but the first of each run were silently discarded:
 * 1,056 commits in range, 119 recovered, 937 dropped. A well-described commit —
 * the kind this project's standards require — was the most likely to vanish, so
 * issues that had been fixed, committed and pushed carried no commit evidence
 * and reported as never started.
 *
 * These assertions are offline by design: the engine itself calls `gh`, and a
 * test that needs the network is a test that fails for reasons unrelated to the
 * thing it checks.
 */

const US = String.fromCharCode(31); // \x1f — field separator
const RS = String.fromCharCode(30); // \x1e — record separator

const SOURCE = 'scripts/issue-state.mjs';
const src = readFileSync(SOURCE, 'utf8');

const git = (args: string[]) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

test.describe('#1042: the state engine parses every commit', () => {
  test('the log format separates FIELDS and terminates RECORDS with different bytes', () => {
    expect(
      src,
      `${SOURCE} no longer uses the %H%x1f%s%x1f%b%x1e log format. Fields must be\n` +
      `separated by \\x1f and records terminated by \\x1e — reusing one byte for both\n` +
      `is what made record boundaries depend on whether a body happened to be empty.`,
    ).toContain('%H%x1f%s%x1f%b%x1e');

    expect(
      /split\(\s*['"]\\x1e\\x1e['"]\s*\)/.test(src),
      `${SOURCE} splits records on a DOUBLED '\\x1e\\x1e'. That boundary only exists\n` +
      `when a commit body is empty, so every commit with a body is glued to its\n` +
      `neighbours and silently dropped. This is #1042 coming back.`,
    ).toBe(false);
  });

  test('every commit in range survives the parse — none are silently dropped', () => {
    const RANGE = ['--max-count=1500'];
    const expected = Number(git(['rev-list', '--count', ...RANGE, 'HEAD']).trim());
    expect(expected).toBeGreaterThan(0);

    // Parse exactly as the engine does.
    const log = git(['log', ...RANGE, `--format=%H${US}%s${US}%b${RS}`]);
    const recovered: string[] = [];
    for (const entry of log.split(RS)) {
      if (!entry.trim()) continue;
      const [sha] = entry.replace(/^\s+/, '').split(US);
      if (!/^[0-9a-f]{40}$/.test(sha)) continue;
      recovered.push(sha);
    }

    expect(
      recovered.length,
      `The parse recovered ${recovered.length} of ${expected} commits — ` +
      `${expected - recovered.length} were silently dropped.\n` +
      `That is #1042: state is derived from commit evidence, so a dropped commit ` +
      `makes a shipped fix report as never started.`,
    ).toBe(expected);

    expect(new Set(recovered).size, 'the parse produced duplicate SHAs').toBe(recovered.length);
  });

  test('a commit body containing the separator bytes cannot split one commit into two', () => {
    // The real corpus is the strongest fixture available: this repo's own
    // commits carry multi-paragraph bodies, which is precisely what the old
    // parser could not survive.
    const log = git(['log', '--max-count=200', `--format=%H${US}%s${US}%b${RS}`]);
    const entries = log.split(RS).filter((e) => e.trim());
    const malformed = entries.filter((e) => {
      const [sha] = e.replace(/^\s+/, '').split(US);
      return !/^[0-9a-f]{40}$/.test(sha);
    });

    expect(
      malformed.length,
      `${malformed.length} record(s) did not begin with a 40-char SHA, so record ` +
      `boundaries are not holding against real commit bodies.`,
    ).toBe(0);
  });
});

test.describe('#1042: travel is reported independently of proof', () => {
  test('the pushed/committed checks are not gated behind the last test run', () => {
    const travelAt = src.search(/if \(!files && commits\.length\)/);
    const proofAt = src.search(/if \(!st\) return say\('unproven', 'did not run/);

    expect(travelAt, 'the travel check (!files && commits.length) is gone').toBeGreaterThan(-1);
    expect(proofAt, "the 'did not run in the last recorded run' check is gone").toBeGreaterThan(-1);

    expect(
      travelAt < proofAt,
      `The 'did not run in the last recorded run' check sits ABOVE the pushed/committed\n` +
      `checks again. Where a fix has travelled does not depend on whether its spec was\n` +
      `in the last run — and almost every run is filtered, so this makes committed and\n` +
      `pushed work report as unproven. That is #1042.`,
    ).toBe(true);
  });

  test('a failing test still outranks travel', () => {
    expect(
      /if \(!files && commits\.length\) \{[\s\S]{0,200}?st && st\.failed[\s\S]{0,120}?say\('failing'/.test(src),
      `The travel branch no longer checks for a failing test first. Shipping a fix does\n` +
      `not make it work: a pushed issue whose test fails must report 'failing'.`,
    ).toBe(true);
  });
});

test.describe('#1041: narrative files are not mistaken for work', () => {
  test('the engine excludes sources that talk about issues rather than fix them', () => {
    expect(src, 'isNarrative() is gone — the citation scan has no exclusion list').toContain('function isNarrative');

    // The sharpest case: this file's own rationale comments cite issue numbers as
    // worked examples, and those citations were reported as pending work on the
    // very issues being explained.
    for (const path of [
      'scripts/issue-state.mjs',
      'scripts/commit-batch.mjs',
      'docs/_today/CURRENT-STATUS.md',
      'docs/standards/ISSUE-SIGNATURE-BLOCK.md',
      'pages/whats-new.html',
      'data/test-results/regression.json',
    ]) {
      const covered =
        path.startsWith('docs/_today/') ||
        path.startsWith('data/') ||
        path.startsWith('docs/standards/') ||
        path === 'pages/whats-new.html' ||
        /^CHANGELOG/i.test(path) ||
        /^scripts\/(issue-|commit-|check-issue|apply-issue|mark-issue|priority-gate|signature-field|build-priority)/.test(path);

      expect(covered, `isNarrative() no longer covers ${path}`).toBe(true);
    }

    // A real fix must still count.
    expect(
      /^scripts\/(issue-|commit-|check-issue|apply-issue|mark-issue|priority-gate|signature-field|build-priority)/
        .test('src/wb-viewmodels/sticky.js'),
      'the exclusion is over-broad — behaviour source must still count as work',
    ).toBe(false);
  });
});
