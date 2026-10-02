import { test, expect } from '../fixtures/offline';
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

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
  // 2026-10-02 (John: "no ci duplication at all"): the commit hook runs fast
  // checks only, and the full suite runs in CI -- ci-tests.yml on PRs, and the
  // same workflow called by nightly.yml before a release. So there is ONE place
  // the suite is judged, and it must be the ratchet. A hook that quietly grew a
  // second, differently-judged suite run would bring #1044 back.
  test('CI invokes the ratchet, and the commit hook runs no suite of its own', () => {
    const hookRuns = hook.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
    expect(
      /test-ratchet\.mjs|playwright\s+test|locked-spec-run/.test(hookRuns),
      `${HOOK} runs a test suite again. The suite runs in CI (ci-tests.yml) and nightly.yml;\n` +
      'a second run in the hook duplicates CI and can judge by a different standard (#1044).',
    ).toBe(false);

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

  // Shape, not size. This asserted a NON-empty register, written while the
  // register still held debt. Empty is the goal (John, 2026-09-28: "I want all
  // failures fixed") and reached it: every failure is new, which is the point.
  test('the register exists and is well-formed, so the ratchet has something to compare against', () => {
    const reg = JSON.parse(readFileSync(REGISTER, 'utf8'));
    expect(Array.isArray(reg.failures), `${REGISTER} has no failures array`).toBe(true);
    expect(reg.count, `${REGISTER} count disagrees with its failures list`).toBe(reg.failures.length);
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

/**
 * #341 — a gate CI cannot finish is a gate CI has not run.
 *
 * #1044 (above) pointed CI at the ratchet but left `timeout-minutes: 30`
 * untouched, and the ratchet is a ~7,500-test run at 4 workers. It does not
 * fit. The two runs that were allowed to end on their own terms rather than
 * being cancelled by the next push both died the same way:
 *
 *   34071440575  "The job has exceeded the maximum execution time of 30m0s"
 *   34074191440  same — gate step 01:51:06 → killed 02:20:40 = 29m34s,
 *                at test 7020 of 7504. 93.5% through, verdict never printed.
 *
 * So every CI failure since #1044 has been the clock, not a test, and "CI is
 * red" said nothing about the code. That is the same defect #1044 fixed one
 * layer up — a gate that reports without measuring — so it is guarded in the
 * same file, structurally, for the same reason.
 */
test.describe('#341: CI budgets enough time to reach a verdict', () => {
  /** `timeout-minutes: N` under the given step name, or the job when name is null. */
  const stepOf = (name: string) => {
    const steps = ci.split(/^ {6}- (?=name:|uses:)/m).slice(1);
    // A step name may be quoted (a name holding ` #` must be, or YAML cuts it).
    return steps.find((s) => s.replace(/^name: "/, 'name: ').startsWith(`name: ${name}`)) ?? '';
  };

  test('the job budget clears the measured cost of the ratchet run', () => {
    const m = /^\s{4}timeout-minutes:\s*(\d+)/m.exec(ci);
    expect(m, `${CI} sets no job-level timeout-minutes.`).not.toBeNull();
    const budget = Number(m![1]);
    expect(
      budget,
      `${CI} allows the job ${budget} minutes. The ratchet alone was measured at 29m34s for\n` +
      '93.5% of its tests (run 34074191440), so the full gate is ~32min before install and\n' +
      'the integration/base report are counted. A budget under 45 kills the run before it\n' +
      'can print a verdict, and CI goes red on the clock rather than on the code.',
    ).toBeGreaterThanOrEqual(45);
  });

  test('the gate step has its own budget, so an overrun names itself', () => {
    const gate = stepOf('Gate —');
    expect(gate, `${CI} has no step whose name starts "Gate —".`).not.toBe('');
    const m = /timeout-minutes:\s*(\d+)/.exec(gate);
    expect(
      m,
      'The gate step has no timeout-minutes of its own. When the JOB timed out, the log said\n' +
      'only "The operation was canceled." — indistinguishable from a cancel by the next push,\n' +
      'which is why this went unnoticed for days. A step budget says which step ran out.',
    ).not.toBeNull();

    const job = Number(/^\s{4}timeout-minutes:\s*(\d+)/m.exec(ci)![1]);
    expect(
      Number(m![1]),
      'The gate step budget must be strictly under the job budget, or the job dies first and\n' +
      'the step timeout never fires — leaving the upload steps no room to save the evidence.',
    ).toBeLessThan(job);
  });

  test('the non-enforcing report step cannot extend an already-cancelled job', () => {
    const report = stepOf('Report —');
    expect(report, `${CI} has no step whose name starts "Report —".`).not.toBe('');
    expect(
      /if:\s*always\(\)/.test(report),
      'The integration/base report step runs `if: always()`, which fires on CANCELLED too.\n' +
      'On run 34074191440 it therefore started after the job had already timed out and ran a\n' +
      'further 4m45s (02:20:40 → 02:25:25) before the runner force-killed it. A step that\n' +
      'enforces nothing must not extend a job that is already over: use success() || failure().',
    ).toBe(false);
  });

  test('a push to main is not cancelled by the next push before it can answer', () => {
    // Line-based, not one regex: this file is CRLF, and `concurrency:` sits
    // under a comment block, both of which quietly defeat a multiline match.
    const lines = ci.split(/\r?\n/);
    const start = lines.findIndex((l) => /^concurrency:/.test(l));
    expect(start, `${CI} has no top-level concurrency block.`).toBeGreaterThan(-1);
    const block = lines.slice(start + 1).slice(0, lines.slice(start + 1).findIndex((l) => /^\S/.test(l)));
    const cancel = block.find((l) => /^\s+cancel-in-progress:/.test(l));
    expect(cancel, `${CI} has no concurrency.cancel-in-progress setting.`).toBeDefined();
    expect(
      cancel!.split(':').slice(1).join(':').trim(),
      'cancel-in-progress is unconditionally true. The gate takes ~38 minutes and pushes to\n' +
      'main arrive every 6-15, so every run is killed by the next one long before it finishes —\n' +
      'run 34284925939, the first to carry the 60-minute budget, died at 3m12s exactly this way.\n' +
      'Cancelling is right for a pull request and wrong for main, where every commit is permanent\n' +
      'and the question is whether THAT commit was green.',
    ).not.toBe('true');
  });

  test('EVERY workflow asks the gate\'s question, not its own (#1163)', () => {
    // #1044 fixed ci-tests.yml and this guard hard-coded that one filename, so
    // "CI — Full Compliance" kept its own January command and nobody could see
    // it: 79 failures, 66 of them register entries, every one of its last 30
    // runs red, and its colour therefore meaningless. A guard that names one
    // file cannot notice the second copy of the defect.
    const dir = '.github/workflows';
    const offenders: string[] = [];

    for (const name of readdirSync(dir).filter((f) => f.endsWith('.yml'))) {
      const file = `${dir}/${name}`;
      runLines(readFileSync(file, 'utf8')).forEach((line) => {
        if (!/playwright\s+test/.test(line)) return;
        // A run that cannot fail the build is a report, not a gate.
        if (/\|\|\s*true/.test(line) || /continue-on-error:\s*true/.test(line)) return;
        offenders.push(`  ${file}: ${line.trim()}`);
      });
      // --reporter= REPLACES playwright.config.ts's reporters, including
      // scripts/tools/test-reporter.ts, whose onBegin creates data/errors.json.
      // Without it "error log should exist" passes only when a page happened to
      // log an error — that is, only when the site is broken.
      runLines(readFileSync(file, 'utf8')).forEach((line) => {
        if (/--reporter=/.test(line) && !/\|\|\s*true/.test(line)) {
          offenders.push(`  ${file}: overrides the project's reporters — ${line.trim()}`);
        }
      });
    }

    expect(
      offenders,
      'These workflows run Playwright their own way:\n' + offenders.join('\n') + '\n\n' +
      'A raw run has no register, so it fails on recorded debt; --reporter= removes the\n' +
      "project's reporters. Run a whole project through .husky/test-ratchet.mjs (narrow it\n" +
      'with WB_GATE_PROJECTS), named specs through scripts/locked-spec-run.mjs, and ask for\n' +
      'traces with WB_TRACE rather than --trace.',
    ).toEqual([]);
  });

  test('the compliance workflow runs the ratchet, narrowed by WB_GATE_PROJECTS', () => {
    const compliance = readFileSync('.github/workflows/ci-compliance.yml', 'utf8');
    expect(
      /test-ratchet\.mjs/.test(compliance),
      '.github/workflows/ci-compliance.yml no longer runs the ratchet, so it is judging the\n' +
      'same code by a different standard again (#1163).',
    ).toBe(true);
    expect(
      /WB_GATE_PROJECTS:\s*compliance/.test(compliance),
      'ci-compliance.yml must narrow the gate to the compliance project through\n' +
      'WB_GATE_PROJECTS, not by hand-writing a playwright command.',
    ).toBe(true);
  });

  test('the uploaded evidence is a path this repo actually writes', () => {
    const upload = stepOf('Upload test report');
    expect(upload, `${CI} has no "Upload test report" step.`).not.toBe('');
    expect(
      /path:\s*playwright-report\//.test(upload),
      `${CI} uploads playwright-report/, which nothing writes — playwright.config.ts registers\n` +
      "scripts/tools/test-reporter.ts and `list`, no `html` reporter. upload-artifact only WARNS\n" +
      'on an empty path, so a red run has been leaving no evidence behind at all. Upload the\n' +
      "reporter's own data/test-results/ instead.",
    ).toBe(false);
  });
});

/**
 * One check per test category (John, 2026-10-01: "many categories of test,
 * not just one big test").
 *
 * ci-tests.yml runs one Playwright project per matrix job, so a red check on
 * the PR names its category. These hold the shape that makes that true and
 * keeps it as strict as the single run it replaced.
 */
test.describe('CI runs one check per test category', () => {
  const GATED = (/const ALL_PROJECTS = \[([^\]]+)\]/.exec(ratchet)?.[1] ?? '')
    .split(',').map((p) => p.trim().replace(/'/g, '')).filter(Boolean);
  const matrixRow = (project: string) =>
    new RegExp(`-\\s*\\{\\s*project:\\s*${project},\\s*gated:\\s*(true|false)\\s*\\}`).exec(ci)?.[1];

  test('every gated project is its own gated job, and integration and base are reported', () => {
    expect(GATED.length, `${RATCHET} ALL_PROJECTS could not be read`).toBeGreaterThan(0);
    for (const project of GATED) {
      expect(matrixRow(project), `${CI} has no gated matrix job for ${project}`).toBe('true');
    }
    for (const project of ['integration', 'base']) {
      expect(matrixRow(project), `${CI} has no report job for ${project}`).toBe('false');
    }
  });

  test('a red category cannot cancel the others', () => {
    expect(
      /fail-fast:\s*false/.test(ci),
      'Without fail-fast: false the first red category cancels the rest, which leaves them\n' +
      'unmeasured: the #1044 skipped-steps defect in a new shape.',
    ).toBe(true);
  });

  test('each gated job runs the ratchet narrowed to its own project', () => {
    expect(/WB_GATE_PROJECTS:\s*\$\{\{\s*matrix\.project\s*\}\}/.test(ci)).toBe(true);
    expect(/if:\s*matrix\.gated/.test(ci)).toBe(true);
  });

  test('"Playwright Tests" still exists, and fails when any category fails', () => {
    const summary = ci.split(/^ {2}playwright:\s*$/m)[1] ?? '';
    expect(summary, `${CI} has no summary job`).not.toBe('');
    expect(summary).toMatch(/name:\s*Playwright Tests/);
    expect(summary).toMatch(/needs:\s*test/);
    expect(summary).toMatch(/needs\.test\.result[^\n]*!=\s*"success"/);
  });

  test('each category uploads its evidence under its own name', () => {
    // upload-artifact@v4 refuses a second artifact with the same name, so a
    // shared name would lose every category's report but the first.
    for (const prefix of ['test-results', 'playwright-traces']) {
      expect(ci).toMatch(new RegExp(`name: ${prefix}-\\$\\{\\{ github\\.run_number \\}\\}-\\$\\{\\{ matrix\\.project \\}\\}`));
    }
  });

  test('a narrowed ratchet refuses --update, which would drop other projects\' entries', () => {
    const r = spawnSync(process.execPath, [RATCHET, '--update'], {
      encoding: 'utf8',
      env: { ...process.env, WB_GATE_PROJECTS: 'compliance' },
      timeout: 30_000,
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('--update needs the full gate');
  });
});
