/**
 * A SPEC THAT COLLECTS NOTHING IS A SPEC THAT LIES
 * ================================================
 * #1091. John: "nothing here can distinguish a test that passed from a test that
 * never ran ... is a serious oversight, should not have ever happened."
 *
 * Playwright exits 0 when a spec collects ZERO tests, so a file that throws at
 * module scope — or that no project's testMatch covers — reports success from
 * every gate in this repo. It carries a name describing a real guarantee, goes
 * green forever, and is admissible as release evidence.
 *
 * Worse than a missing test: a missing test is visible, and this is reassuring.
 *
 * Seven incidents went through this hole (#975 for twelve days, #1049, #1041,
 * #1085, the doc-viewer end-key fixture, and two specs written in the session
 * that filed this — one of which was the spec written to fix another instance).
 *
 * The comparison itself is the subtle part and is tested here directly:
 * `suite.file` is relative to `config.rootDir` (<repo>/tests), NOT the repo
 * root. The first draft compared those strings against a repo-root walk, found
 * "0 on disk, 598 collected", and cheerfully reported that all was well — the
 * checker committing the exact defect it exists to catch.
 */
import { test, expect } from '@playwright/test';
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { collectedSpecs, testDirsFrom, specsOnDisk } from '../../scripts/check-spec-collection.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

test.describe('#1091 — every spec on disk contributes at least one test', () => {
  test('the repo has no silent specs', () => {
    // Runs the real checker. Its exit code IS the assertion.
    let out = '';
    let failed = false;
    try {
      out = execFileSync('node', ['scripts/check-spec-collection.mjs', '--json'], {
        cwd: REPO, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
      });
    } catch (e: any) {
      failed = true;
      out = String(e.stdout || '');
    }
    const report = JSON.parse(out || '{"silent":[]}');
    const names = (report.silent || []).map((s: any) => `${s.file}${s.error ? ` — ${s.error}` : ''}`);
    expect(
      names,
      'these files look like tests, are named .spec.ts, contain assertions, and run never:\n  '
        + names.join('\n  '),
    ).toEqual([]);
    expect(failed, 'checker exit code must agree with its own report').toBe(false);
  });

  test('the checker is not vacuous — it really reads the report and the disk', () => {
    expect(specsOnDisk(path.join(REPO, 'tests')).length, 'walked no specs').toBeGreaterThan(100);
  });

  /**
   * The bug the first draft had, pinned: collected paths are rootDir-relative
   * and disk paths are absolute, so the join is what makes the comparison mean
   * anything. Fixture, not live state — #1061's lesson about verdicts that move
   * on their own.
   */
  test('collected paths are resolved against rootDir, not the repo root', () => {
    const report = {
      config: { rootDir: 'C:/repo/tests', projects: [{ testDir: 'C:/repo/tests/compliance' }] },
      suites: [
        { file: 'compliance/a.spec.ts', specs: [{ title: 't' }] },
        { file: 'compliance/empty.spec.ts', specs: [] },
        { file: 'regression/b.spec.ts', suites: [{ file: 'regression/b.spec.ts', specs: [{ title: 'u' }] }] },
      ],
    };
    const got = [...collectedSpecs(report)].sort();
    expect(got).toEqual(['C:/repo/tests/compliance/a.spec.ts', 'C:/repo/tests/regression/b.spec.ts']);
    // A suite with an empty `specs` array collected nothing and must NOT count.
    expect(got.some((f) => f.endsWith('empty.spec.ts'))).toBe(false);
  });

  test('test directories come from the config, not a hardcoded guess', () => {
    const report = {
      config: { rootDir: 'C:/repo/tests', projects: [{ testDir: 'C:/repo/tests/a' }, { testDir: 'C:/repo/tests/b' }] },
      suites: [],
    };
    expect(testDirsFrom(report).sort()).toEqual(['C:/repo/tests/a', 'C:/repo/tests/b']);
  });

  test('a config with no projects still yields the rootDir', () => {
    // Or the walk covers nothing and the checker reports "all clear" over an
    // empty comparison — which is how the first draft passed.
    expect(testDirsFrom({ config: { rootDir: 'C:/repo/tests' }, suites: [] })).toEqual(['C:/repo/tests']);
  });
});
