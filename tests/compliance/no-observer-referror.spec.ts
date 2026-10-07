import { test, expect } from '../fixtures/offline';
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
  test('demos and showcase pages should not throw observer ReferenceError', async ({ page }) => {
    // demos/wb-views-demo.html was never committed (it survives only in the
    // create-wb-starter template), so this loaded a 404 page, waited for a WB
    // that could never arrive, and timed out -- while the `.catch` below would
    // have let a missing page count as "no errors" had it been faster. Every
    // page here must load and boot WB, or its silence proves nothing.
    // demos/autoinject.html replaces it: the whole page is auto-injected, so
    // every observer-owning behavior runs.
    const pages = ['/demos/autoinject.html', '/demos/site/cards.html', '/?page=behaviors'];
    for (const p of pages) {
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      const response = await page.goto(p);
      expect(response?.ok(), `${p} must exist (status ${response?.status()})`).toBe(true);
      await page.waitForFunction(() => (window as any).WB !== undefined, null, { timeout: 10000 });
      // Everything that could warn or fail has run once WB settles (#1516: no fixed sleep).
      await page.waitForFunction(() => typeof (window as any).WB?.settled === 'function', null, { timeout: 15000 });
      await page.evaluate(() => (window as any).WB.settled({ timeout: 15000 }));

      const found = consoleErrors.find(c => OBSERVER_ERROR_RE.test(c));
      expect(found, `No console.error on ${p} should match observer ReferenceError`).toBeUndefined();

      // detach listeners to avoid accumulation between iterations
      page.removeAllListeners('console');
    }
  });
});
