import fs from 'fs';
import path from 'path';
import { test, expect } from '@playwright/test';

test('Lock directory must be empty before merge', async () => {
  const lockDir = path.join(process.cwd(), 'Lock');
  if (!fs.existsSync(lockDir)) return;
  const entries = fs.readdirSync(lockDir).filter(f => !f.startsWith('.'));
  expect(entries, `Found Lock/ entries that should be removed before merge:\n${entries.join('\n')}`).toHaveLength(0);
});
