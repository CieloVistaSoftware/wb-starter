import { test, expect } from '@playwright/test';
import { readJson, getFiles, ROOT, PATHS } from '../base';
import * as path from 'path';

test.describe('Docs Manifest Integrity', () => {
  const MANIFEST_PATH = path.join(ROOT, 'docs', 'manifest.json');
  const DOCS_DIR = path.join(ROOT, 'docs');

  test('All markdown files in docs/ should be listed in manifest.json', async () => {
    const manifest = readJson(MANIFEST_PATH);
    expect(manifest).toBeTruthy();

    // Extract all file paths from manifest
    const manifestFiles = new Set<string>();
    
    function extractFiles(categories: any[]) {
      for (const cat of categories) {
        if (cat.docs) {
          for (const doc of cat.docs) {
            if (doc.file) manifestFiles.add(path.normalize(doc.file));
          }
        }
        if (cat.pages) {
           // Pages might not map 1:1 to md files, but let's check if they do
           // Usually pages are html files in pages/ dir, but let's see if any md files are referenced
        }
      }
    }

    if (manifest.categories) {
      extractFiles(manifest.categories);
    }

    // Get all .md files in docs/
    const allMdFiles = getFiles(DOCS_DIR, ['.md']);
    
    const missingFiles: string[] = [];

    for (const file of allMdFiles) {
      const relativePath = path.relative(DOCS_DIR, file);
      // Normalize path separators
      const normalizedPath = path.normalize(relativePath);
      
      // Skip _today folder as it seems to be for daily logs
      if (normalizedPath.startsWith('_today')) continue;
      
      // Skip manifest.json itself (it's not md)
      
      if (!manifestFiles.has(normalizedPath)) {
        missingFiles.push(normalizedPath);
      }
    }

    if (missingFiles.length > 0) {
      const errorId = 'WB_DOCS_MANIFEST_MISSING_FILE_046';
      const errorMessage = `Found ${missingFiles.length} markdown files not listed in docs/manifest.json:\n${missingFiles.join('\n')}`;
      
      // We intentionally fail with a specific error signature that matches the fix
      console.error(`[${errorId}] ${errorMessage}`);
      throw new Error(`${errorId}: ${errorMessage}`);
    }
  });
});
