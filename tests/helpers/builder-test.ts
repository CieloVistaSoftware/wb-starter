import { test as base, expect } from '@playwright/test';

/**
 * Builder test fixture
 * - navigates to /builder.html (domcontentloaded)
 * - waits for the app-level readiness guard (builderReady or canvas component)
 * - exposes the normal `page` fixture to tests that import from this module
 */
export const test = base.extend({
  // Override the `page` fixture only for tests that import this module.
  page: async ({ page }, use) => {
    try {
      await page.goto('/builder.html', { waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});

      // Prefer the assertBuilderReady helper for deterministic readiness
      const { assertBuilderReady } = await import('./fail-fast');
      await assertBuilderReady(page, 20000);

      // Also ensure core templates are available (defensive)
      await page.waitForFunction(() => {
        return !!(window as any).WB_COMPONENT_LIBRARY || !!(window as any).componentTemplates;
      }, undefined, { timeout: 5000 }).catch(() => {});
    } catch (err) {
      // Surface a clear initialization failure to the test runner
      throw new Error('[builder-test] builder page did not become ready: ' + (err && err.message));
    }

    await use(page);
  }
});

export { expect };