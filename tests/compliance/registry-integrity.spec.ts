import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Fix Registry Data Integrity', () => {
  const fixesPath = path.join(process.cwd(), 'data', 'fixes.json');
  const data = JSON.parse(fs.readFileSync(fixesPath, 'utf8'));
  const fixes = Object.values(data.fixes);

  for (const fix of fixes as any[]) {
    test(`Fix ${fix.errorId} should have a verified test`, async () => {
      expect(fix.testRun, `Fix ${fix.errorId} (${fix.issue}) is missing 'testRun: true'`).toBe(true);
      expect(fix.testName, `Fix ${fix.errorId} is missing 'testName'`).toBeTruthy();
    });
  }
});
