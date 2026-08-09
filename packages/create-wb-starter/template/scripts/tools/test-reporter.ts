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
import { writeFileSync, appendFileSync, mkdirSync, existsSync, unlinkSync, readFileSync, copyFileSync } from 'fs';
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
  retry: number;
}

// Strip ANSI color codes from error messages
function stripAnsi(str: string): string {
  return str.replace(/\u001b\[[0-9;]*m/g, '');
}

// Extract clean error message (first meaningful line)
function cleanErrorMessage(error: any): string {
  if (!error) return 'Unknown error';
  
  const message = error.message || String(error);
  const cleaned = stripAnsi(message);
  
  // Get first non-empty line that isn't just "Error:"
  const lines = cleaned.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed && trimmed !== 'Error:' && !trimmed.startsWith('at ');
  });
  
  // Return first line, truncated if too long
  const firstLine = lines[0] || 'Unknown error';
  return firstLine.length > 200 ? firstLine.substring(0, 200) + '...' : firstLine;
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

  private writeJson(filename: string, data: any) {
    const filepath = join(this.outDir, filename);
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
