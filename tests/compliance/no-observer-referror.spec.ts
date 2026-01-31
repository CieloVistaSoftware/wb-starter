import { test, expect } from '@playwright/test';
import * as path from 'path';
import { readJson, PATHS } from '../base';

/**
 * Regression: ensure no ReferenceError for undeclared "observer"-style globals
 * (historically surfaced as "observer is not defined" in CI). This test loads
 * high-surface pages and asserts there are no console.errors or persisted
 * runtime errors that match the pattern.
 */

const ERROR_LOG_PATH = path.join(PATHS.data, 'errors.json');
const OBSERVER_ERROR_RE = /observer is not defined|ResizeObserver is not defined|MutationObserver is not defined/i;

test.describe('Runtime: no undefined-observer ReferenceError', () => {
  test('public/builder.html should not throw observer ReferenceError', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/public/builder.html');
    await page.waitForFunction(() => (window as any).WB !== undefined);
    // allow any async init logs to settle
    await page.waitForTimeout(500);

    const found = consoleErrors.find(c => OBSERVER_ERROR_RE.test(c));
    expect(found, `No console.error should match observer ReferenceError — got: ${consoleErrors.join('\n')}`).toBeUndefined();

    // Also ensure the persisted error log does not contain such an entry
    const data = readJson(ERROR_LOG_PATH);
    const persisted = (data?.errors || []).find((e: any) => OBSERVER_ERROR_RE.test(e.message || ''));
    expect(persisted, 'No persisted runtime error mentioning missing observers').toBeUndefined();
  });

  test('demos and showcase pages should not throw observer ReferenceError', async ({ page }) => {
    const pages = ['/demos/wb-views-demo.html', '/demos/pce-test.html', '/demos/behaviors-showcase.html'];
    for (const p of pages) {
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.goto(p);
      await page.waitForFunction(() => (window as any).WB !== undefined, { timeout: 5000 }).catch(() => null);
      await page.waitForTimeout(350);

      const found = consoleErrors.find(c => OBSERVER_ERROR_RE.test(c));
      expect(found, `No console.error on ${p} should match observer ReferenceError`).toBeUndefined();

      // detach listeners to avoid accumulation between iterations
      page.removeAllListeners('console');
    }
  });
});
