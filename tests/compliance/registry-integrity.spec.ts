import { test, expect } from '@playwright/test';
import { readJson, assertValidDate, DATA_FILES } from '../base';

test.describe('Fix Registry Data Integrity', () => {
  const data = readJson<{ fixes: Record<string, any> }>(DATA_FILES.fixes);
  const fixes = data ? Object.values(data.fixes) : [];

  for (const fix of fixes) {
    test(`Fix ${fix.errorId} should have lastTested date`, async () => {
      assertValidDate(fix.lastTested, 'lastTested', fix.errorId);
    });
  }
});
