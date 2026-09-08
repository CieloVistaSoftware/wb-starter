/**
 * Custom Playwright Reporter
 * ==========================
 * Generates focused, readable test result files instead of one massive JSON blob.
 * 
 * Output files (in data/test-results/):
 *   - summary.json      : Quick stats (~1KB)
 *   - failures.json     : Failed tests with clean error messages (~5-20KB)
 *   - compliance.json   : Results for compliance project
 *   - base.json         : Results for base project
 *   - behaviors.json    : Results for behaviors project
 * 
 * Usage in playwright.config.ts:
 *   reporter: [
 *     ['./tools/test-reporter.ts'],
 *     ['list']  // Keep console output
 *   ]
 */

import type { 
  Reporter, 
  FullConfig, 
  Suite, 
  TestCase, 
  TestResult, 
  FullResult 
} from '@playwright/test/reporter';
import { writeFileSync, appendFileSync, mkdirSync, existsSync, unlinkSync, readFileSync, copyFileSync, renameSync } from 'fs';
import { join } from 'path';

interface TestEntry {
  title: string;
  file: string;
  line: number;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut' | 'interrupted';
  duration: number;
  retry: number;
  error?: string;
}

interface ProjectResults {
  project: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  tests: TestEntry[];
}

interface Summary {
  timestamp: string;
  duration: number;
  totals: {
    passed: number;
    failed: number;
    skipped: number;
    total: number;
  };
  projects: {
    name: string;
    passed: number;
    failed: number;
    skipped: number;
  }[];
}

interface FailureEntry {
  project: string;
  title: string;
  file: string;
  line: number;
  error: string;
  /**
   * Stack frames — #963.
   *
   * `error` deliberately drops `at ...` lines for readability, which is fine
   * for an assertion failure (Playwright's call log plus file/line already say
   * where it happened) and useless for a RUNTIME error. `TypeError: Cannot read
   * properties of undefined (reading 'contains')` was recorded with no frames
   * at all, and the stored file/line pointed at the test rather than at the code
   * that threw — so nothing in the output said where the bug was.
   *
   * Kept separate from `error` so the human-readable summary stays clean.
   */
  stack?: string;
  /** The failing source line, when Playwright resolved one. */
  snippet?: string;
  retry: number;
}

// Strip ANSI color codes from error messages
function stripAnsi(str: string): string {
  return str.replace(/\u001b\[[0-9;]*m/g, '');
}

/**
 * Extract a clean error message.
 *
 * This used to return ONLY the first meaningful line. Fine for a one-line
 * assertion -- but the richest specs here collect many findings and report
 * them together. permutation-compliance.spec.ts raises ONE error whose first
 * line is "card compliance failures:" and whose actual content is every line
 * after it. Keeping one line reduced that to a label announcing that a failure
 * exists, with the reason thrown away.
 *
 * The cost was not theoretical: a run reported 109 failures, failures.json
 * recorded "<name> compliance failures:" 109 times, and it took three wrong
 * hypotheses to find they were all a single crash on one line. The body would
 * have said so immediately.
 *
 * Stack frames are still dropped -- noise here, and file:line is stored
 * separately.
 */
const MAX_ERROR_LINES = 15;
const MAX_ERROR_CHARS = 2000;

/**
 * Pull the `at ...` frames out of an error — #963.
 *
 * cleanErrorMessage() strips these on purpose, which reads well for assertion
 * failures and blinds you completely for runtime ones. Kept here as its own
 * field so both needs are served.
 *
 * node_modules and node: internals are dropped: for locating a defect in THIS
 * repo they are noise, and keeping them pushes the frame that matters past the
 * truncation limit.
 */
const MAX_STACK_FRAMES = 12;

function extractStack(error: any): string | undefined {
  const raw = error?.stack;
  if (!raw) return undefined;

  const frames = stripAnsi(String(raw))
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('at '))
    .filter((l) => !l.includes('node_modules') && !l.includes('(node:'));

  if (!frames.length) return undefined;

  const kept = frames.slice(0, MAX_STACK_FRAMES);
  if (frames.length > MAX_STACK_FRAMES) {
    kept.push(`… ${frames.length - MAX_STACK_FRAMES} more frame(s)`);
  }
  return kept.join('\n');
}

function cleanErrorMessage(error: any): string {
  if (!error) return 'Unknown error';

  const message = error.message || String(error);
  const cleaned = stripAnsi(message);

  const lines = cleaned.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed && trimmed !== 'Error:' && !trimmed.startsWith('at ');
  });

  if (!lines.length) return 'Unknown error';

  const kept = lines.slice(0, MAX_ERROR_LINES);
  if (lines.length > MAX_ERROR_LINES) {
    kept.push(`… ${lines.length - MAX_ERROR_LINES} more line(s)`);
  }

  const out = kept.join('\n');
  return out.length > MAX_ERROR_CHARS ? out.substring(0, MAX_ERROR_CHARS) + '…' : out;
}

class WBTestReporter implements Reporter {
  private outDir: string = 'data/test-results';
  private projectResults: Map<string, ProjectResults> = new Map();
  private failures: FailureEntry[] = [];
  private startTime: number = 0;
  private failureLogPath: string = '';
  private failureCount: number = 0;
  private previousFailures: Set<string> = new Set();

  onBegin(config: FullConfig, suite: Suite) {
    this.startTime = Date.now();

    // Ensure output directory exists
    mkdirSync(this.outDir, { recursive: true });

    // Initialize live failure log (clear previous)
    this.failureLogPath = join(this.outDir, 'failures-live.log');
    if (existsSync(this.failureLogPath)) {
      unlinkSync(this.failureLogPath);
    }
    writeFileSync(this.failureLogPath, `=== Test Run Started: ${new Date().toISOString()} ===\n\n`);

    // #562: data/errors.json (src/core/error-logger.js's shared, server-side
    // runtime error log) used to carry over from whatever the PREVIOUS
    // invocation -- or, worse, a stale git-committed snapshot -- left behind.
    // error-log-empty.spec.ts (tests/compliance/) asserts that file is empty;
    // with no reset, entries from an unrelated earlier run (or leftover
    // manual/agent browsing, unconnected to this run's pages entirely) failed
    // that gate for reasons no test in the CURRENT run caused. onBegin runs
    // exactly once per `playwright test` invocation, before any project's
    // tests start (including a single-file run of just error-log-empty.spec.ts
    // itself), so resetting here gives every run a clean slate: only errors
    // genuinely produced by pages loaded DURING this run can appear by the
    // time that gate checks. Mirrors the failures-live.log reset immediately
    // above -- same "clear stale run state at onBegin" pattern, applied to
    // the other shared, cross-run log this test suite writes.
    this.resetErrorLog();
    
    // Load previous failures for comparison
    const prevFailuresPath = join(this.outDir, 'failures.json');
    if (existsSync(prevFailuresPath)) {
      try {
        const prev = JSON.parse(readFileSync(prevFailuresPath, 'utf-8'));
        for (const f of prev.failures || []) {
          this.previousFailures.add(`${f.file}:${f.line}:${f.title}`);
        }
      } catch (e) { /* ignore */ }
    }
    
    // Initialize project buckets
    for (const project of config.projects) {
      const name = project.name || 'default';
      this.projectResults.set(name, {
        project: name,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        tests: []
      });
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const projectName = test.parent.project()?.name || 'default';
    const project = this.projectResults.get(projectName);
    
    if (!project) {
      console.warn(`Unknown project: ${projectName}`);
      return;
    }

    // Build test entry
    const entry: TestEntry = {
      title: test.title,
      file: test.location.file.replace(/\\/g, '/').split('/tests/')[1] || test.location.file,
      line: test.location.line,
      status: result.status,
      duration: result.duration,
      retry: result.retry
    };

    // Handle different statuses
    switch (result.status) {
      case 'passed':
        project.passed++;
        break;
      case 'failed':
      case 'timedOut':
        project.failed++;
        entry.error = cleanErrorMessage(result.error);
        
        // Add to failures list
        const failureEntry: FailureEntry = {
          project: projectName,
          title: test.title,
          file: entry.file,
          line: test.location.line,
          error: entry.error,
          // #963: capture the frames the message intentionally strips.
          stack: extractStack(result.error),
          snippet: result.error?.snippet ? stripAnsi(result.error.snippet).slice(0, 600) : undefined,
          retry: result.retry
        };
        this.failures.push(failureEntry);
        
        // Log failure immediately to file
        this.logFailureImmediately(failureEntry, result.status);
        break;
      case 'skipped':
        project.skipped++;
        break;
      case 'interrupted':
        project.failed++;
        entry.error = 'Test interrupted';
        break;
    }

    project.duration += result.duration;
    project.tests.push(entry);
  }

  /**
   * Clear the shared runtime error log for this run — but ARCHIVE it first.
   *
   * John: "there were 26 or more errors in the error log where did they go?"
   * They were here, and this function destroyed them. #562 gave every run a
   * clean slate, which is right for the gate, and it did so by overwriting the
   * ONLY copy of a log a person reads — silently, with no console line and no
   * backup. Running the suite therefore erased real findings that had nothing
   * to do with the suite, and nothing said so afterwards. Two full gate runs
   * and roughly fifteen single-spec runs in one session is fifteen chances to
   * lose someone's morning.
   *
   * Nothing dies in silence: the previous contents are copied to
   * data/error-log-archive/errors-<timestamp>.json and that path is printed, so
   * a wiped log is recoverable and the wipe is announced. An already-empty log
   * is not archived — nothing to lose, and no point in the noise.
   */
  private resetErrorLog() {
    const target = join('data', 'errors.json');
    const archiveDir = join('data', 'error-log-archive');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');

    try {
      if (existsSync(target)) {
        const previous = readFileSync(target, 'utf8');
        let count = 0;
        try {
          count = (JSON.parse(previous).errors || []).length;
        } catch {
          count = -1;   // unparseable is exactly the state worth keeping a copy of
        }
        if (count !== 0) {
          mkdirSync(archiveDir, { recursive: true });
          const archived = join(archiveDir, `errors-${stamp}.json`);
          writeFileSync(archived, previous, 'utf8');
          console.log(
            `[WBTestReporter] data/errors.json held `
            + `${count === -1 ? 'unparseable content' : `${count} error(s)`}; archived to `
            + `${archived} before clearing it for this run.`
          );
        }
      }
    } catch (e) {
      // An archive that cannot be written must SAY so — losing the log quietly
      // is the whole defect this block exists to prevent.
      console.warn('[WBTestReporter] Could not archive data/errors.json before clearing it:', e);
    }

    try {
      writeFileSync(
        target,
        JSON.stringify({ lastUpdated: new Date().toISOString(), count: 0, errors: [] }, null, 2),
        'utf8'
      );
    } catch (e) {
      // Never let a reset failure abort the test run itself.
      console.warn('[WBTestReporter] Could not reset data/errors.json:', e);
    }
  }

  private logFailureImmediately(failure: FailureEntry, status: string) {
    this.failureCount++;
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const statusIcon = status === 'timedOut' ? '⏱️' : '❌';
    
    const logEntry = [
      `${statusIcon} FAILURE #${this.failureCount} [${timestamp}]`,
      `   Project: ${failure.project}`,
      `   Test: ${failure.title}`,
      `   File: ${failure.file}:${failure.line}`,
      `   Error: ${failure.error}`,
      // #963: the frames go in the live log too. Chasing a failure from this
      // file used to mean knowing only WHAT broke, never WHERE.
      failure.snippet ? `   Source:\n${failure.snippet.split('\n').map((l) => '     ' + l).join('\n')}` : '',
      failure.stack ? `   Stack:\n${failure.stack.split('\n').map((l) => '     ' + l).join('\n')}` : '',
      failure.retry > 0 ? `   Retry: ${failure.retry}` : '',
      '\n'
    ].filter(Boolean).join('\n');
    
    // Append to log file immediately
    appendFileSync(this.failureLogPath, logEntry);
    
    // Also print to stderr for immediate visibility
    console.error(`\n${statusIcon} FAILED: ${failure.title}`);
    console.error(`   ${failure.error}`);
  }

  async onEnd(result: FullResult) {
    const totalDuration = Date.now() - this.startTime;

    // Calculate totals
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    const projectSummaries: Summary['projects'] = [];

    for (const [name, project] of this.projectResults) {
      totalPassed += project.passed;
      totalFailed += project.failed;
      totalSkipped += project.skipped;

      projectSummaries.push({
        name,
        passed: project.passed,
        failed: project.failed,
        skipped: project.skipped
      });

      // Write individual project file (only if it has tests)
      if (project.tests.length > 0) {
        this.writeJson(`${name}.json`, {
          project: name,
          timestamp: new Date().toISOString(),
          stats: {
            passed: project.passed,
            failed: project.failed,
            skipped: project.skipped,
            total: project.tests.length,
            duration: project.duration
          },
          tests: project.tests
        });
      }
    }

    // Write summary
    const summary: Summary = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      totals: {
        passed: totalPassed,
        failed: totalFailed,
        skipped: totalSkipped,
        total: totalPassed + totalFailed + totalSkipped
      },
      projects: projectSummaries.filter(p => 
        p.passed + p.failed + p.skipped > 0
      )
    };
    this.writeJson('summary.json', summary);

    // Write failures (deduplicated - only final retry)
    const uniqueFailures = this.deduplicateFailures(this.failures);
    this.writeJson('failures.json', {
      timestamp: new Date().toISOString(),
      count: uniqueFailures.length,
      failures: uniqueFailures
    });
    
    // Write comparison with previous run
    if (this.previousFailures.size > 0) {
      const currentFailureKeys = new Set(
        uniqueFailures.map(f => `${f.file}:${f.line}:${f.title}`)
      );
      
      const fixed = [...this.previousFailures]
        .filter(key => !currentFailureKeys.has(key))
        .map(key => key.split(':').slice(2).join(':'));
      
      const stillFailing = uniqueFailures
        .filter(f => this.previousFailures.has(`${f.file}:${f.line}:${f.title}`))
        .map(f => f.title);
      
      const newFailures = uniqueFailures
        .filter(f => !this.previousFailures.has(`${f.file}:${f.line}:${f.title}`))
        .map(f => f.title);
      
      this.writeJson('comparison.json', {
        timestamp: new Date().toISOString(),
        fixed: { count: fixed.length, tests: fixed },
        stillFailing: { count: stillFailing.length, tests: stillFailing },
        newFailures: { count: newFailures.length, tests: newFailures }
      });
    }

    // Print summary to console
    this.printSummary(summary, uniqueFailures.length);
  }

  private deduplicateFailures(failures: FailureEntry[]): FailureEntry[] {
    // Keep only the highest retry for each test (the final attempt)
    const byKey = new Map<string, FailureEntry>();
    
    for (const failure of failures) {
      const key = `${failure.file}:${failure.line}:${failure.title}`;
      const existing = byKey.get(key);
      
      if (!existing || failure.retry > existing.retry) {
        byKey.set(key, failure);
      }
    }
    
    return Array.from(byKey.values());
  }

  /**
   * Archive the previous file before overwriting it.
   *
   * These files are rewritten by EVERY run, including a single-spec one. So a
   * full-suite result — the only thing that can answer "what is actually
   * failing right now" — is destroyed by the next `npm run test:async` on one
   * file, and there is no way back to it. Measured cost, twice in one session:
   * an attempt to reconcile the debt register read failures.json and found 0
   * entries, because three single-spec runs had happened since the full run
   * that produced it; and a stale test-status.json was misread as current
   * because nothing said when it was written.
   *
   * Same pattern as data/error-log-archive/, which this repo already keeps for
   * exactly this reason. Never destroy a diagnostic; move it aside.
   */
  private archivePrevious(filepath: string, filename: string) {
    if (!existsSync(filepath)) return;
    try {
      const archiveDir = join(this.outDir, 'archive');
      if (!existsSync(archiveDir)) mkdirSync(archiveDir, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const dot = filename.lastIndexOf('.');
      const base = dot > 0 ? filename.slice(0, dot) : filename;
      const ext = dot > 0 ? filename.slice(dot) : '';
      renameSync(filepath, join(archiveDir, `${base}-${stamp}${ext}`));
    } catch {
      // An archive that cannot be written must not stop the run from recording
      // its own results — that would trade a lost history for a lost result.
    }
  }

  private writeJson(filename: string, data: any) {
    const filepath = join(this.outDir, filename);
    this.archivePrevious(filepath, filename);
    writeFileSync(filepath, JSON.stringify(data, null, 2));
  }

  private printSummary(summary: Summary, failureCount: number) {
    console.log('\n' + '═'.repeat(60));
    console.log('  WB TEST RESULTS');
    console.log('═'.repeat(60));
    
    const { totals } = summary;
    const duration = (summary.duration / 1000).toFixed(1);
    
    console.log(`  Total: ${totals.total} tests in ${duration}s`);
    console.log(`  ✓ Passed:  ${totals.passed}`);
    console.log(`  ✗ Failed:  ${totals.failed}`);
    if (totals.skipped > 0) {
      console.log(`  ○ Skipped: ${totals.skipped}`);
    }
    
    console.log('\n  By Project:');
    for (const p of summary.projects) {
      const total = p.passed + p.failed + p.skipped;
      const status = p.failed > 0 ? '✗' : '✓';
      console.log(`    ${status} ${p.name}: ${p.passed}/${total} passed`);
    }
    
    // Compare with previous run
    if (this.previousFailures.size > 0) {
      const currentFailureKeys = new Set(
        this.failures.map(f => `${f.file}:${f.line}:${f.title}`)
      );
      
      const fixed: string[] = [];
      const stillFailing: string[] = [];
      const newFailures: string[] = [];
      
      // Find fixed (was failing, now passing)
      for (const key of this.previousFailures) {
        if (!currentFailureKeys.has(key)) {
          const title = key.split(':').slice(2).join(':');
          fixed.push(title);
        }
      }
      
      // Categorize current failures
      for (const f of this.failures) {
        const key = `${f.file}:${f.line}:${f.title}`;
        if (this.previousFailures.has(key)) {
          stillFailing.push(f.title);
        } else {
          newFailures.push(f.title);
        }
      }
      
      if (fixed.length > 0) {
        console.log(`\n  ✅ FIXED (${fixed.length}):`);
        for (const t of fixed.slice(0, 5)) {
          console.log(`     - ${t.substring(0, 50)}${t.length > 50 ? '...' : ''}`);
        }
        if (fixed.length > 5) console.log(`     ... and ${fixed.length - 5} more`);
      }
      
      if (newFailures.length > 0) {
        console.log(`\n  🆕 NEW FAILURES (${newFailures.length}):`);
        for (const t of newFailures.slice(0, 5)) {
          console.log(`     - ${t.substring(0, 50)}${t.length > 50 ? '...' : ''}`);
        }
        if (newFailures.length > 5) console.log(`     ... and ${newFailures.length - 5} more`);
      }
      
      if (stillFailing.length > 0) {
        console.log(`\n  ❌ STILL FAILING (${stillFailing.length}):`);
        for (const t of stillFailing.slice(0, 5)) {
          console.log(`     - ${t.substring(0, 50)}${t.length > 50 ? '...' : ''}`);
        }
        if (stillFailing.length > 5) console.log(`     ... and ${stillFailing.length - 5} more`);
      }
    }
    
    if (failureCount > 0) {
      console.log(`\n  See failures: data/test-results/failures.json`);
      console.log(`  Live log:    data/test-results/failures-live.log`);
    }
    
    // Finalize live log
    appendFileSync(this.failureLogPath, `\n=== Test Run Complete: ${summary.totals.failed} failures ===\n`);
    
    console.log('═'.repeat(60) + '\n');
  }
}

export default WBTestReporter;
