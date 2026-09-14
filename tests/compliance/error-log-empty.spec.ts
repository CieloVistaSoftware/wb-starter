/**
 * ERROR LOG COMPLIANCE
 * ====================
 * Validates that data/errors.json has no errors.
 * If errors exist, we need to go into FIX MODE.
 * 
 * The error log captures runtime errors from pages
 * and other pages. A clean error log means no unhandled
 * exceptions are occurring.
 */

import { test, expect } from '@playwright/test';
import { readJson, PATHS } from '../base';
import * as path from 'path';

interface ErrorEntry {
  id: number;
  timestamp: string;
  message: string;
  stack?: string;
  url?: string;
  details?: {
    file?: string;
    line?: number;
    reason?: string;
    stack?: string;
  };
}

interface ErrorLog {
  lastUpdated: string;
  count: number;
  errors: ErrorEntry[];
}

const ERROR_LOG_PATH = path.join(PATHS.data, 'errors.json');

test.describe('Error Log Compliance', () => {
  
  test('error log should exist', () => {
    const data = readJson<ErrorLog>(ERROR_LOG_PATH);
    expect(data, 'data/errors.json should exist and be valid JSON').not.toBeNull();
  });

  test('error log should be empty (no runtime errors)', () => {
    const data = readJson<ErrorLog>(ERROR_LOG_PATH);
    
    if (!data) {
      // No file = no errors, that's fine
      return;
    }
    
    let errors = data.errors || [];
    
    // Ignore expected errors from compliance tests
    errors = errors.filter(e => !e.url?.includes('legacy-syntax-check.html'));

    // #1115: no media exemption here, on purpose. An unreachable THIRD-PARTY
    // media host (demo media is remote by rule, #762) is classified where it
    // happens -- src/wb-viewmodels/media-unreachable.js -- and reported on the
    // element as error="unreachable" plus a [WB:media-unreachable] warning, so
    // it never reaches this log. Anything that does reach it, including a
    // same-origin media failure, is a real defect and fails this test.
    // Guard: tests/regression/third-party-media-outage-is-not-a-page-error.spec.ts

    if (errors.length > 0) {
      // Format errors for clear reporting
      const errorReport = errors.map((e, i) => {
        let report = `\n[${i + 1}] ${e.message}`;
        if (e.details?.file) report += `\n    File: ${e.details.file}:${e.details.line || '?'}`;
        if (e.url) report += `\n    Page: ${e.url}`;
        if (e.details?.stack || e.stack) {
          const stack = e.details?.stack || e.stack || '';
          report += `\n    Stack: ${stack.split('\n')[0]}`;
        }
        return report;
      }).join('\n');
      
      expect.soft(errors.length, 
        `\n\n🚨 FIX MODE REQUIRED 🚨\n` +
        `Found ${errors.length} runtime error(s) in data/errors.json:\n` +
        `${errorReport}\n\n` +
        `To fix:\n` +
        `1. Review each error above\n` +
        `2. Fix the root cause in the source file\n` +
        `3. Clear the error log or run the app to verify\n` +
        `4. Re-run this test\n`
      ).toBe(0);
    }
    
    expect(errors.length, 'Error log should be empty').toBe(0);
  });

  test('error count should match errors array length', () => {
    const data = readJson<ErrorLog>(ERROR_LOG_PATH);
    
    if (!data) return;
    
    const reportedCount = data.count || 0;
    const actualCount = (data.errors || []).length;
    
    expect(reportedCount, 'Reported count should match actual errors').toBe(actualCount);
  });

});
