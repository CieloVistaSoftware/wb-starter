import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test('no disallowed inline styles in pages/ or templates/', async () => {
  let out = '';
  try {
    out = execSync('node ./scripts/check-inline-styles.mjs', { encoding: 'utf8', stdio: 'pipe' });
  } catch (err: any) {
    // command exits non-zero when violations detected
    out = err.stdout || err.message || String(err);
  }
  // Fail the test if the script printed a violation summary
  expect(out).toMatch(/OK - no disallowed inline styles found/);
});