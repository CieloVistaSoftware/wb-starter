/**
 * REMOVED: /?page=home route no longer exists (no public/index.html SPA).
 * Home page needs to be rebuilt as a standalone HTML file.
 */
import { test } from '@playwright/test';

test.describe.skip('Home Page Showcase — REMOVED (stale SPA route /?page=home)', () => {
  test('placeholder', () => {});
});
