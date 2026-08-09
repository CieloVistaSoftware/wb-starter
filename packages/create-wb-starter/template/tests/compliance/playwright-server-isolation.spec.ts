import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('Playwright supports isolated per-worktree test servers', () => {
  const rootDir = path.resolve(process.cwd());
  const config = fs.readFileSync(path.join(rootDir, 'playwright.config.ts'), 'utf8');

  expect(config).toContain("process.env.WB_TEST_PORT || process.env.PORT");
  expect(config).toContain('baseURL: `http://localhost:${testPort}`');
  expect(config).toContain('port: testPort');
  expect(config).toContain("PORT: String(testPort)");
  expect(config).toContain('reuseExistingServer: !requestedTestPort');
  expect(config).not.toContain('reuseExistingServer: true');
});