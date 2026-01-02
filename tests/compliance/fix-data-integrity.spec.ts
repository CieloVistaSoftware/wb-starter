/**
 * FIX DATA INTEGRITY
 * ==================
 * Validates fixes.json structure.
 */

import { test, expect } from '@playwright/test';
import { readJson, DATA_FILES } from '../base';

test.describe('Fix Data Integrity', () => {
  const data = readJson<{ fixes: Record<string, any> }>(DATA_FILES.fixes);
  const fixes = data ? Object.entries(data.fixes) : [];

  for (const [key, entry] of fixes) {
    test(`Fix ${key} should have valid structure`, async () => {
      expect(entry.fix).toBeDefined();
      expect(entry.fix.code, `Fix ${key} missing 'code' field`).toBeDefined();
      expect(typeof entry.fix.code).toBe('string');
      expect(entry.fix.code.length).toBeGreaterThan(0);
      expect(entry.fix.file, `Fix ${key} missing 'file' field`).toBeDefined();
      
      const file = entry.fix.file;
      const validExtensions = ['.js', '.ts', '.html', '.css', '.json'];
      const hasValidExt = validExtensions.some(ext => file.includes(ext));
      expect(hasValidExt, `Fix ${key} file '${file}' should have valid extension`).toBe(true);
    });
  }
});
