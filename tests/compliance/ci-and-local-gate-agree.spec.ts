import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

/**
 * #1044 — CI and the local gate must ask the same question.
 *
 * John: "if I can compile/run a site it means it's working at a particular
 * release level. It may or may not be pushed to github, but i don't expect any
 * failures when it does push. after all it's live on my local."
 *
 * That expectation could not hold. The pre-commit hook ran
 * `.husky/test-ratchet.mjs`, which fails only on failures NOT in
 * data/test-baseline-failures.json. CI ran raw `npx playwright test` with no
 * baseline at all, so it re-failed on all 530 known failures every run — main
 * had failed CI on every push since 2026-09-03. Identical code, opposite
 * verdicts.
 *
 * Worse, CI's four project steps were sequential with `continue-on-error: false`,
 * so compliance failing meant integration, base and behaviors were reported
 * `skipped` and never measured at all.
 *
 * These assertions are structural because the defect was structural: nothing was
 * wrong with any test, and everything was wrong with which question each gate
 * asked.
 */

const CI = '.github/workflows/ci-tests.yml';
const HOOK = '.husky/pre-commit';
const RATCHET = '.husky/test-ratchet.mjs';
const REGISTER = 'data/test-baseline-failures.json';

const ci = readFileSync(CI, 'utf8');
const hook = readFileSync(HOOK, 'utf8');
const ratchet = readFileSync(RATCHET, 'utf8');

/** Lines that actually run something, minus comments. */
const runLines = (yaml: string) =>
  yaml.split('\n').filter((l) => !/^\s*#/.test(l));

test.describe('#1044: CI and the local gate apply the same standard', () => {
  test('both gates invoke the ratchet', () => {
    expect(
      /test-ratchet\.mjs/.test(hook),
      `${HOOK} no longer runs the ratchet — the local gate has stopped using the register.`,
    ).toBe(true);

    expect(
      /test-ratchet\.mjs/.test(ci),
      `${CI} does not run .husky/test-ratchet.mjs.\n` +
      'CI would then judge identical code by a different standard than the commit hook,\n' +
      'which is #1044: locally green, red on push, and a real regression indistinguishable\n' +
      'from 530 lines of pre-existing debt.',
    ).toBe(true);
  });

  test('CI does not enforce a raw, unbaselined project run', () => {
    // A raw `npx playwright test --project=X` is only acceptable when it cannot
    // fail the build — otherwise CI is back to failing on the whole register.
    const offenders: string[] = [];
    const lines = runLines(ci);
    lines.forEach((line, i) => {
      const m = /npx playwright test --project=(\w+)/.exec(line);
      if (!m) return;
      // Look at the surrounding step for the escape hatches that make it a
      // REPORT rather than a gate.
      const window = lines.slice(Math.max(0, i - 6), i + 3).join('\n');
      const reported = /continue-on-error:\s*true/.test(window) || /\|\|\s*true/.test(line);
      if (!reported) offenders.push(`  ${m[1]}: ${line.trim()}`);
    });

    expect(
      offenders,
      `${CI} enforces raw project runs with no baseline:\n${offenders.join('\n')}\n\n` +
      'Every such run fails on the entire register, so CI goes red for debt rather than\n' +
      'for the change under test. Run them through the ratchet, or mark them as reported\n' +
      '(continue-on-error: true) until they have a register of their own.',
    ).toEqual([]);
  });

  test('the register exists and is non-empty, so the ratchet has something to compare against', () => {
    const reg = JSON.parse(readFileSync(REGISTER, 'utf8'));
    expect(Array.isArray(reg.failures), `${REGISTER} has no failures array`).toBe(true);
    expect(
      reg.failures.length,
      `${REGISTER} is empty. The ratchet would then treat EVERY failure as new and CI would\n` +
      'block permanently — the exact state this change removes.',
    ).toBeGreaterThan(0);
  });

  test('the ratchet reuses CI\'s server instead of booting a second one', () => {
    expect(
      /process\.env\.CI\s*\?\s*null\s*:\s*freePort\(\)/.test(ratchet),
      `${RATCHET} always picks a private port. ci-tests.yml already starts a server on 3000\n` +
      'and waits for /health, and playwright.config.ts only permits reuseExistingServer on\n' +
      'that default port — so a private port boots a second server on a runner that already\n' +
      'has a healthy one.',
    ).toBe(true);
  });

  test('CI steps cannot silently skip whole projects', () => {
    // The original failure mode: four sequential steps, `continue-on-error: false`,
    // so the first red made the rest `skipped` and unmeasured. One gate step
    // covering the ratchet's projects cannot skip its own siblings.
    const enforced = runLines(ci).filter(
      (l) => /npx playwright test --project=/.test(l) && !/\|\|\s*true/.test(l),
    );
    expect(
      enforced.length,
      'CI again has enforced per-project playwright steps. Sequential required steps mean the\n' +
      'first failure skips every project after it, so a green-looking run may have measured\n' +
      'almost nothing.',
    ).toBe(0);
  });
});
