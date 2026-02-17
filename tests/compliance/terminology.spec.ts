import { test } from '@playwright/test';
import * as path from 'path';
import { 
  getFiles, readFile, relativePath, IssueCollector, ROOT, EXCLUDE_DIRS 
} from '../base';

/**
 * TERMINOLOGY COMPLIANCE
 * ======================
 * Ensures correct project terminology is used throughout the codebase.
 * 
 * Rules:
 * 1. "WB Framework" is forbidden. Use "WB-Starter" instead.
 * 2. "Web Behaviors (WB)" is forbidden. Use "WB-Starter" instead.
 */

test.describe('Terminology Compliance', () => {
  
  test('no usage of forbidden term "WB Framework"', () => {
    const FORBIDDEN_TERM = 'WB Framework';
    const currentFilename = 'terminology.spec.ts';
    const alsoSkip = 'terminology-wb-starter.spec.ts';

    const allFiles = getFiles(ROOT, ['.md', '.html', '.js', '.ts', '.json']);
    const issues = new IssueCollector();

    for (const file of allFiles) {
      if (file.endsWith(currentFilename) || file.endsWith(alsoSkip)) continue;

      const relPath = relativePath(file);

      // Skip archive and generated data files
      if (relPath.startsWith('archive')) continue;
      if (relPath.startsWith('data')) continue;

      if (EXCLUDE_DIRS.some(dir => relPath.startsWith(dir) || relPath.includes(`/${dir}/`))) continue;

      const content = readFile(file);
      const lowerContent = content.toLowerCase();
      const lowerTerm = FORBIDDEN_TERM.toLowerCase();
      
      if (lowerContent.includes(lowerTerm)) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(lowerTerm)) {
            issues.add(`${relPath}:${i + 1}: Found forbidden term "${FORBIDDEN_TERM}" — use "WB-Starter" instead`);
          }
        }
      }
    }

    issues.expectEmpty(`Found usage of forbidden term "${FORBIDDEN_TERM}". Please use "WB-Starter" instead.\n\nDetails:\n` + issues.format());
  });

});
