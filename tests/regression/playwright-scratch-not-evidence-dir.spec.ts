import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

/**
 * #1038 — running the tests must not destroy the record of the tests.
 *
 * Playwright CLEARS `outputDir` at the start of every run. `data/test-results/`
 * is the reporter's evidence directory: scripts/issue-state.mjs,
 * commit-readiness.mjs and mark-issue-verification.mjs all read
 * `data/test-results/<project>.json` to decide what state an issue is in.
 *
 * While those were the SAME directory, every run erased the previous run's
 * record for all five projects — and a FILTERED run erased it while replacing
 * almost none of it. The pre-commit gate is exactly such a run (priority-1
 * specs + project-integrity only). Measured 2026-09-06: two gate runs took
 * ready 3 -> 0, failing 7 -> 0 and unproven 5 -> 18 with no work done to any of
 * those issues, and `issue-state.mjs` reported "last recorded run: none".
 *
 * This is structural, so it is asserted against the config rather than by
 * running a suite inside a suite.
 */

const read = (p: string) => readFileSync(p, 'utf8');

/** The value Playwright wipes. */
function outputDirOf(config: string): string {
  const m = /^\s*outputDir:\s*['"]([^'"]+)['"]/m.exec(config);
  if (!m) throw new Error('playwright.config.ts: no outputDir found');
  return m[1].replace(/^\.\//, '').replace(/\/$/, '');
}

/** The directory the reporter writes its per-project evidence into. */
function reporterOutDirOf(reporter: string): string {
  const m = /outDir\s*:\s*string\s*=\s*['"]([^'"]+)['"]/.exec(reporter);
  if (!m) throw new Error('test-reporter.ts: no outDir found');
  return m[1].replace(/^\.\//, '').replace(/\/$/, '');
}

test.describe('#1038: Playwright scratch is not the state engine evidence dir', () => {
  const config = read('playwright.config.ts');
  const reporter = read('scripts/tools/test-reporter.ts');

  test('outputDir and the reporter evidence dir are different directories', () => {
    const scratch = outputDirOf(config);
    const evidence = reporterOutDirOf(reporter);

    expect(
      scratch,
      `playwright.config.ts outputDir is "${scratch}", the same directory the reporter\n` +
      `writes its per-project evidence into. Playwright clears outputDir on every run,\n` +
      `so this makes a test run erase the record every gate and every state query reads.`,
    ).not.toBe(evidence);
  });

  test('neither directory is nested inside the other', () => {
    const scratch = outputDirOf(config);
    const evidence = reporterOutDirOf(reporter);
    const nested = scratch.startsWith(`${evidence}/`) || evidence.startsWith(`${scratch}/`);

    expect(
      nested,
      `"${scratch}" and "${evidence}" are nested. Clearing outputDir takes the other\n` +
      `directory's contents with it, which is the same defect as sharing one path.`,
    ).toBe(false);
  });

  test('every script that reads run evidence reads it from outside outputDir', () => {
    const scratch = outputDirOf(config);
    const readers = [
      'scripts/issue-state.mjs',
      'scripts/commit-readiness.mjs',
      'scripts/mark-issue-verification.mjs',
    ];

    const offenders: string[] = [];
    const needle = `${scratch}/`;
    for (const file of readers) {
      const src = read(file);
      // Plain substring scan: a path literal under the directory Playwright wipes.
      for (let i = src.indexOf(needle); i !== -1; i = src.indexOf(needle, i + 1)) {
        const line = src.slice(0, i).split('\n').length;
        offenders.push(`  ${file}:${line}  reads from ${needle}`);
      }
    }

    expect(
      offenders,
      `These read run evidence out of Playwright's scratch directory, which is cleared\n` +
      `at the start of every run:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
