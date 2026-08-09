/**
 * FIX DATA INTEGRITY
 * ==================
 * Validates fixes.json structure.
 * Supports both formats:
 *   - Legacy: fixes as object with fix.code / fix.file
 *   - Current: fixes as array with id, fix (string), filesChanged
 */

import { test, expect } from '@playwright/test';
import { readJson, DATA_FILES } from '../base';

test.describe('Fix Data Integrity', () => {
  const data = readJson<any>(DATA_FILES.fixes);

  if (!data || !data.fixes) {
    test('fixes.json exists and has fixes', () => {
      expect(data, 'fixes.json should be parseable').toBeTruthy();
      expect(data?.fixes, 'fixes.json should have fixes field').toBeTruthy();
    });
    return;
  }

  // Detect format: array (current) or object (legacy)
  const isArray = Array.isArray(data.fixes);

  if (isArray) {
    // Current format: array of { id, test, title, problem, fix, filesChanged, category }
    for (let i = 0; i < data.fixes.length; i++) {
      const entry = data.fixes[i];
      const label = entry.id || `Fix-${i}`;

      test(`${label} should have valid structure`, async () => {
        expect(entry.id, `${label} missing 'id'`).toBeDefined();
        expect(entry.fix, `${label} missing 'fix' description`).toBeDefined();
        expect(typeof entry.fix).toBe('string');
        expect(entry.fix.length, `${label} 'fix' should not be empty`).toBeGreaterThan(0);
        expect(entry.filesChanged, `${label} missing 'filesChanged'`).toBeDefined();
        expect(Array.isArray(entry.filesChanged), `${label} 'filesChanged' should be array`).toBe(true);
      });
    }
  } else {
    // Legacy format: object keyed by fix name, each has fix.code / fix.file
    const fixes = Object.entries(data.fixes);
    for (const [key, entry] of fixes) {
      test(`Fix ${key} should have valid structure`, async () => {
        const e = entry as any;
        expect(e.fix).toBeDefined();
        expect(e.fix.code, `Fix ${key} missing 'code' field`).toBeDefined();
        expect(typeof e.fix.code).toBe('string');
        expect(e.fix.code.length).toBeGreaterThan(0);
        expect(e.fix.file, `Fix ${key} missing 'file' field`).toBeDefined();

        const file = e.fix.file;
        const validExtensions = ['.js', '.ts', '.html', '.css', '.json'];
        const hasValidExt = validExtensions.some(ext => file.includes(ext));
        expect(hasValidExt, `Fix ${key} file '${file}' should have valid extension`).toBe(true);
      });
    }
  }
});
