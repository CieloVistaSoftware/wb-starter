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
 * 1. "WB Framework" is forbidden. Use "WB Behaviors" or "WB Behaviors Library".
 */

test.describe('Terminology Compliance', () => {
  
  test('no usage of forbidden term "WB Framework"', () => {
    // Context: "WB Framework" is forbidden.
    const FORBIDDEN_TERM = ['WB', 'Framework'].join(' ');
    // Filter out this test file itself
    const currentFileUrl = import.meta.url;
    // Simple way to avoid checking self: just don't fail if the file is this one
    const currentFilename = 'terminology.spec.ts';
    
    // Define ALLOWED_EXCEPTIONS
    const ALLOWED_EXCEPTIONS = [];

    // Get all files
    const allFiles = getFiles(ROOT, ['.md', '.html', '.js', '.ts', '.json']);
    const issues = new IssueCollector();

    for (const file of allFiles) {
      if (file.endsWith(currentFilename)) continue;

      const relPath = relativePath(file);
      
      // Skip allowed exceptions
      if (ALLOWED_EXCEPTIONS.includes(relPath)) continue;

      // Skip node_modules and other excluded dirs (already handled by getFiles but double check)
      if (EXCLUDE_DIRS.some(dir => relPath.startsWith(dir) || relPath.includes(`/${dir}/`))) continue;

      const content = readFile(file);
      
      // Case-insensitive check
      const lowerContent = content.toLowerCase();
      const lowerTerm = FORBIDDEN_TERM.toLowerCase();
      
      if (lowerContent.includes(lowerTerm)) {
        // Find line number
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(lowerTerm)) {
            issues.add(`${relPath}:${i + 1}: Found forbidden term "${FORBIDDEN_TERM}"`);
          }
        }
      }
    }

    issues.expectEmpty(`Found usage of forbidden term "${FORBIDDEN_TERM}". Please use "WB Behaviors" instead.\n\nDetails:\n` + issues.format());
  });

});
