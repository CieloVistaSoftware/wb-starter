import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { getFiles, readFile, relativePath, ROOT, PATHS } from '../base';

/**
 * ES MODULES COMPLIANCE
 * =====================
 * Ensures all JavaScript uses ES modules, never CommonJS.
 * 
 * Rule: "Never use CommonJS (require, module.exports, .cjs). Always use ES modules (import/export)."
 */

test.describe('ES Modules Compliance', () => {

  test('no CommonJS require() in JavaScript files', () => {
    const jsFiles = [
      ...getFiles(PATHS.src, ['.js']),
      ...getFiles(path.join(ROOT, 'scripts'), ['.js', '.mjs']),
      path.join(ROOT, 'server.js')
    ].filter(f => fs.existsSync(f));

    const issues: string[] = [];

    // Patterns that indicate CommonJS
    const requirePattern = /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    const moduleExportsPattern = /\bmodule\.exports\b/;
    const exportsPattern = /\bexports\.\w+\s*=/;

    for (const file of jsFiles) {
      if (file.endsWith('.cjs')) continue;
      
      const content = readFile(file);
      const relPath = relativePath(file);

      // Check for require()
      let match;
      while ((match = requirePattern.exec(content)) !== null) {
        const moduleName = match[1];
        issues.push(`${relPath}:\n    FOUND:  const x = require("${moduleName}")\n    FIX:    import ${getImportSuggestion(moduleName)}`);
      }
      requirePattern.lastIndex = 0;

      // Check for module.exports
      if (moduleExportsPattern.test(content)) {
        issues.push(`${relPath}:\n    FOUND:  module.exports = something\n    FIX:    export default something`);
      }

      // Check for exports.something =
      if (exportsPattern.test(content)) {
        issues.push(`${relPath}:\n    FOUND:  exports.foo = bar\n    FIX:    export { bar as foo }`);
      }
    }

    const errorMessage = issues.length > 0 
      ? `\n` +
        `═══════════════════════════════════════════════════════════════════\n` +
        ` CommonJS DETECTED - Must use ES Modules (import/export)\n` +
        `═══════════════════════════════════════════════════════════════════\n\n` +
        `${issues.map((i, idx) => `❌ ${idx + 1}. ${i}`).join('\n\n')}\n\n` +
        `───────────────────────────────────────────────────────────────────\n` +
        ` HOW TO FIX:\n` +
        `───────────────────────────────────────────────────────────────────\n` +
        `1. Replace require() with import:\n` +
        `   BEFORE: const fs = require('fs');\n` +
        `   AFTER:  import fs from 'fs';\n\n` +
        `2. Replace module.exports with export:\n` +
        `   BEFORE: module.exports = myFunction;\n` +
        `   AFTER:  export default myFunction;\n\n` +
        `3. If using __dirname, add this to top of file:\n` +
        `   import { fileURLToPath } from 'url';\n` +
        `   import path from 'path';\n` +
        `   const __filename = fileURLToPath(import.meta.url);\n` +
        `   const __dirname = path.dirname(__filename);\n\n` +
        `4. Ensure package.json has: "type": "module"\n` +
        `═══════════════════════════════════════════════════════════════════\n`
      : '';

    expect(issues.length, errorMessage).toBe(0);
  });

  test('no .cjs files exist', () => {
    const cjsFiles = [
      ...getFiles(PATHS.src, ['.cjs']),
      ...getFiles(path.join(ROOT, 'scripts'), ['.cjs'])
    ];

    const errorMessage = cjsFiles.length > 0
      ? `\n` +
        `═══════════════════════════════════════════════════════════════════\n` +
        ` .cjs FILES FOUND - Must use .js with ES Modules\n` +
        `═══════════════════════════════════════════════════════════════════\n\n` +
        `${cjsFiles.map(f => `❌ ${relativePath(f)}`).join('\n')}\n\n` +
        `───────────────────────────────────────────────────────────────────\n` +
        ` HOW TO FIX:\n` +
        `───────────────────────────────────────────────────────────────────\n` +
        `1. Rename the file from .cjs to .js\n` +
        `2. Convert all require() to import statements\n` +
        `3. Convert module.exports to export default\n` +
        `═══════════════════════════════════════════════════════════════════\n`
      : '';

    expect(cjsFiles.length, errorMessage).toBe(0);
  });

  test('package.json has type: module', () => {
    const pkgPath = path.join(ROOT, 'package.json');
    const pkg = JSON.parse(readFile(pkgPath));

    const errorMessage = pkg.type !== 'module'
      ? `\n` +
        `═══════════════════════════════════════════════════════════════════\n` +
        ` package.json MISSING "type": "module"\n` +
        `═══════════════════════════════════════════════════════════════════\n\n` +
        `───────────────────────────────────────────────────────────────────\n` +
        ` HOW TO FIX:\n` +
        `───────────────────────────────────────────────────────────────────\n` +
        `Add "type": "module" to package.json:\n\n` +
        `  {\n` +
        `    "name": "wb-starter",\n` +
        `    "version": "1.0.0",\n` +
        `    "type": "module",   ← ADD THIS LINE\n` +
        `    "description": "...",\n` +
        `    ...\n` +
        `  }\n` +
        `═══════════════════════════════════════════════════════════════════\n`
      : '';

    expect(pkg.type, errorMessage).toBe('module');
  });

});

/**
 * Generate import suggestion based on module name
 */
function getImportSuggestion(moduleName: string): string {
  const builtins: Record<string, string> = {
    'fs': "fs from 'fs'",
    'path': "path from 'path'",
    'url': "{ fileURLToPath } from 'url'",
    'child_process': "{ exec, execSync } from 'child_process'",
    'os': "os from 'os'",
    'http': "http from 'http'",
    'https': "https from 'https'",
    'crypto': "crypto from 'crypto'",
    'util': "util from 'util'",
    'events': "{ EventEmitter } from 'events'",
    'stream': "stream from 'stream'",
  };

  const packages: Record<string, string> = {
    'express': "express from 'express'",
    'compression': "compression from 'compression'",
    'ws': "{ WebSocketServer } from 'ws'",
    'sharp': "sharp from 'sharp'",
  };

  if (builtins[moduleName]) return builtins[moduleName];
  if (packages[moduleName]) return packages[moduleName];
  
  // Default: assume default export
  const varName = moduleName.replace(/[^a-zA-Z]/g, '');
  return `${varName} from '${moduleName}'`;
}
