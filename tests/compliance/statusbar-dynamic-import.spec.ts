/**
 * Smoke: dynamic import of statusbar module (compat shim)
 */
import { test, expect } from '@playwright/test';

test.describe('Dynamic import: statusbar module', () => {
  test('statusbar module must be fetchable and export statusbar/default', async ({ page }) => {
    await page.goto('http://localhost:3000/builder.html');
    await page.waitForLoadState('networkidle');

    const ok = await page.evaluate(async () => {
      try {
        const m = await import('/dist/wb-viewmodels/statusbar.js');
        return !!(m && (m.statusbar || m.default));
      } catch (err) {
        // surface the error message for debugging
        (window as any).__dynamicImportError = String(err?.message || err);
        return false;
      }
    });

    if (!ok) {
      const msg = await page.evaluate(() => (window as any).__dynamicImportError || 'unknown');
      throw new Error('dynamic import failed: ' + msg);
    }

    expect(ok).toBe(true);
  });
});
