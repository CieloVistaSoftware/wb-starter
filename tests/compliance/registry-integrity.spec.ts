import { test, expect } from '@playwright/test';
import { readJson, assertValidDate, DATA_FILES } from '../base';

test.describe('Fix Registry Data Integrity', () => {
  const data = readJson<any>(DATA_FILES.fixes);
  
  // Support both old format (fixes as object with errorId) and new format (fixes as array with id)
  const fixes: any[] = data?.fixes
    ? (Array.isArray(data.fixes) ? data.fixes : Object.values(data.fixes))
    : [];

  // Skip if fixes don't have lastTested (new format doesn't)
  const testable = fixes.filter(f => f.lastTested);

  if (testable.length === 0) {
    test('fixes.json exists and is valid', () => {
      expect(data, 'fixes.json should be parseable').toBeTruthy();
      expect(fixes.length, 'fixes.json should have entries').toBeGreaterThan(0);
    });
  }

  for (const fix of testable) {
    const label = fix.errorId || fix.id || 'unknown';
    test(`Fix ${label} should have lastTested date`, async () => {
      assertValidDate(fix.lastTested, 'lastTested', label);
    });
  }
});
