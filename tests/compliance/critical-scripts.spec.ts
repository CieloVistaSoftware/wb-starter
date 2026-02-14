import fs from 'fs';
import path from 'path';
import { test, expect } from '@playwright/test';

test('package.json contains critical developer scripts', async () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  const scripts = pkg.scripts || {};
  const required = ['start', 'start:mcp', 'mcp:healthcheck', 'test', 'test:compliance'];
  const missing = required.filter(s => !Object.prototype.hasOwnProperty.call(scripts, s));
  expect(missing, `Missing critical scripts: ${missing.join(', ')}`).toHaveLength(0);
});
