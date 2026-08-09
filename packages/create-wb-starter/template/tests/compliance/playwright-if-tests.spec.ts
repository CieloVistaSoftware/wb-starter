import { spawnSync } from 'child_process';
import path from 'path';
import { test, expect } from '@playwright/test';

test('playwright-if-tests: exits 0 when no tests match', () => {
  const script = path.join(process.cwd(), 'scripts', 'playwright-if-tests.js');
  const r = spawnSync('node', [script, '--', '--grep', '____no_such_test_pattern____'], { encoding: 'utf8' });
  // script should exit 0 and print skipping message when no tests match
  expect(r.status).toBe(0);
  expect(r.stdout || r.stderr).toContain('no matching tests found');
});
