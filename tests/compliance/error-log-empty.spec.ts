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

    // #1115: a demo's media is deliberately REMOTE (#762 -- "all audio and video
    // must be from out there not local"), because these are copy-paste examples
    // and a relative src 404s for whoever pastes it. The cost of that rule is
    // that a third-party host having a bad minute makes audio.js throw -- which
    // it MUST, per DEMOS-AND-DOCS §30 -- and that error lands here.
    //
    // Measured 2026-09-12: one slow archive.org response failed this spec and
    // compliance/dark-mode.spec.ts together, and no release could be cut for as
    // long as it lasted. Neither spec is on the baseline register, so there was
    // no allowance to fall back on.
    //
    // A failure to reach SOMEONE ELSE'S server is not a defect in this repo.
    // Narrow on purpose: the message must name an off-origin http(s) URL ending
    // in a media extension. A same-origin media failure, or any other error
    // from any host, still fails -- that is the #514/#763 lesson about
    // exemptions that quietly become "ignore media".
    const EXTERNAL_MEDIA = /https?:\/\/(?!localhost|127\.0\.0\.1)[^\s"']+\.(?:mp3|mp4|wav|ogg|oga|webm|m4a|aac|flac|mov)/i;
    const isExternalMediaFailure = (e: ErrorEntry) => {
      const text = `${e.message ?? ''} ${e.details?.reason ?? ''} ${e.details?.file ?? ''}`;
      return EXTERNAL_MEDIA.test(text) && /failed to load|not supported|MEDIA_ERR|network/i.test(text);
    };
    const externalMediaErrors = errors.filter(isExternalMediaFailure);
    errors = errors.filter(e => !isExternalMediaFailure(e));
    if (externalMediaErrors.length) {
      console.warn(
        `[error-log-empty] ignoring ${externalMediaErrors.length} external media load failure(s) ` +
        `(#1115): ${externalMediaErrors.map(e => e.message?.slice(0, 90)).join(' | ')}`
      );
    }

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
