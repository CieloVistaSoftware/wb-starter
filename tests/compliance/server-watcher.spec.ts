import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { ROOT, readFile } from '../base';

/**
 * SERVER FILE WATCHER COMPLIANCE
 * ==============================
 * Ensures the server.js file watcher properly excludes noisy directories
 * like data/, node_modules, .git, etc. to prevent unnecessary live reloads.
 * 
 * Rule: "data/ changes should NOT trigger live reload (test artifacts, logs, etc.)"
 */

test.describe('Server File Watcher', () => {

  const serverPath = path.join(ROOT, 'server.js');
  let serverContent: string;

  test.beforeAll(() => {
    serverContent = readFile(serverPath);
  });

  test('triggerReload ignores data/ directory changes', () => {
    // Verify triggerReload function filters out data/ paths
    const hasDataFilter = 
      serverContent.includes("filename.startsWith('data\\\\')") ||
      serverContent.includes("filename.startsWith('data/')") ||
      serverContent.includes('data\\\\') && serverContent.includes('data/');

    const errorMessage = !hasDataFilter
      ? `\n` +
        `═══════════════════════════════════════════════════════════════════\n` +
        ` server.js triggerReload MISSING data/ FILTER\n` +
        `═══════════════════════════════════════════════════════════════════\n\n` +
        `The triggerReload function should ignore files starting with 'data/'\n` +
        `to prevent test artifacts and logs from triggering live reload.\n\n` +
        `───────────────────────────────────────────────────────────────────\n` +
        ` HOW TO FIX:\n` +
        `───────────────────────────────────────────────────────────────────\n` +
        `In server.js, add data/ check to triggerReload:\n\n` +
        `  const triggerReload = (eventType, filename) => {\n` +
        `    if (!filename) return;\n` +
        `    // Ignore git, node_modules, temp files, and data directory\n` +
        `    if (filename.includes('.git') || \n` +
        `        filename.includes('node_modules') || \n` +
        `        filename.includes('.tmp') ||\n` +
        `        filename.startsWith('data\\\\') ||\n` +
        `        filename.startsWith('data/')) return;\n` +
        `    ...\n` +
        `  };\n` +
        `═══════════════════════════════════════════════════════════════════\n`
      : '';

    expect(hasDataFilter, errorMessage).toBe(true);
  });

  test('setupPerDirWatch has WATCH_EXCLUDE list', () => {
    // Verify WATCH_EXCLUDE constant exists with expected directories
    const hasWatchExclude = serverContent.includes('WATCH_EXCLUDE');
    const hasDataInExclude = serverContent.includes("'data'") || serverContent.includes('"data"');
    const hasNodeModulesInExclude = serverContent.includes("'node_modules'") || serverContent.includes('"node_modules"');
    const hasGitInExclude = serverContent.includes("'.git'") || serverContent.includes('".git"');

    const issues: string[] = [];
    
    if (!hasWatchExclude) {
      issues.push('WATCH_EXCLUDE constant is missing');
    }
    if (!hasDataInExclude) {
      issues.push("'data' directory not in exclude list");
    }
    if (!hasNodeModulesInExclude) {
      issues.push("'node_modules' directory not in exclude list");
    }
    if (!hasGitInExclude) {
      issues.push("'.git' directory not in exclude list");
    }

    const errorMessage = issues.length > 0
      ? `\n` +
        `═══════════════════════════════════════════════════════════════════\n` +
        ` server.js WATCH_EXCLUDE INCOMPLETE\n` +
        `═══════════════════════════════════════════════════════════════════\n\n` +
        `${issues.map(i => `❌ ${i}`).join('\n')}\n\n` +
        `───────────────────────────────────────────────────────────────────\n` +
        ` HOW TO FIX:\n` +
        `───────────────────────────────────────────────────────────────────\n` +
        `In server.js, add WATCH_EXCLUDE before setupPerDirWatch:\n\n` +
        `  const WATCH_EXCLUDE = ['data', 'node_modules', '.git', 'archive', 'tmp'];\n` +
        `  const setupPerDirWatch = (root) => {\n` +
        `    ...\n` +
        `    for (const ent of entries) {\n` +
        `      if (ent.isDirectory() && !WATCH_EXCLUDE.includes(ent.name)) {\n` +
        `        stack.push(path.join(cur, ent.name));\n` +
        `      }\n` +
        `    }\n` +
        `  };\n` +
        `═══════════════════════════════════════════════════════════════════\n`
      : '';

    expect(issues.length, errorMessage).toBe(0);
  });

  test('setupPerDirWatch uses WATCH_EXCLUDE in directory traversal', () => {
    // Verify the exclude list is actually used in the directory loop
    const hasExcludeCheck = 
      serverContent.includes('WATCH_EXCLUDE.includes(ent.name)') ||
      serverContent.includes('!WATCH_EXCLUDE.includes');

    const errorMessage = !hasExcludeCheck
      ? `\n` +
        `═══════════════════════════════════════════════════════════════════\n` +
        ` server.js setupPerDirWatch NOT USING WATCH_EXCLUDE\n` +
        `═══════════════════════════════════════════════════════════════════\n\n` +
        `The WATCH_EXCLUDE list exists but isn't being checked in the\n` +
        `directory traversal loop.\n\n` +
        `───────────────────────────────────────────────────────────────────\n` +
        ` HOW TO FIX:\n` +
        `───────────────────────────────────────────────────────────────────\n` +
        `In setupPerDirWatch, check WATCH_EXCLUDE before adding to stack:\n\n` +
        `  for (const ent of entries) {\n` +
        `    if (ent.isDirectory() && !WATCH_EXCLUDE.includes(ent.name)) {\n` +
        `      stack.push(path.join(cur, ent.name));\n` +
        `    }\n` +
        `  }\n` +
        `═══════════════════════════════════════════════════════════════════\n`
      : '';

    expect(hasExcludeCheck, errorMessage).toBe(true);
  });

});
