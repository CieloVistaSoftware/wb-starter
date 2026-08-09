/**
 * REMOVED: /?page=themes route no longer exists (no public/index.html SPA).
 * Themes showcase needs to be rebuilt as a standalone HTML file.
 */
import { test } from '@playwright/test';

test.describe.skip('Themes Showcase Page — REMOVED (stale SPA route /?page=themes)', () => {
  test('placeholder', () => {});
});
