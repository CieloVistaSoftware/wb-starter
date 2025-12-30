import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Fix Data Integrity', () => {
  const fixesPath = path.join(__dirname, '../../data/fixes.json');
  const data = JSON.parse(fs.readFileSync(fixesPath, 'utf8'));
  const fixes = data.fixes;

  for (const [key, entry] of Object.entries(fixes)) {
    test(`Fix ${key} should have valid structure`, async () => {
      expect(entry.fix).toBeDefined();
      
      // Check for code block
      expect(entry.fix.code, `Fix ${key} missing 'code' field`).toBeDefined();
      expect(typeof entry.fix.code).toBe('string');
      expect(entry.fix.code.length).toBeGreaterThan(0);

      // Check for file
      expect(entry.fix.file, `Fix ${key} missing 'file' field`).toBeDefined();
      
      // Check file extension / language
      const file = entry.fix.file;
      const validExtensions = ['.js', '.html', '.css', '.json'];
      const hasValidExt = validExtensions.some(ext => file.includes(ext));
      
      expect(hasValidExt, `Fix ${key} file '${file}' should have .js, .html, .css or .json extension`).toBe(true);
    });
  }
});
