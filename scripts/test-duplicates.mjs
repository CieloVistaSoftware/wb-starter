#!/usr/bin/env node
/**
 * WB Framework - Duplicate Detection Test Runner
 * Runs as: npm run test:duplicates
 * Part of: npm test (compliance checks)
 * 
 * FAST-FAIL: Exits with code 1 if duplicates found
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, '..');

class DuplicateDetector {
  constructor() {
    this.issues = [];
    this.files = [];
  }

  async run() {
    console.log('\n🔍 WB Framework - Duplicate Variable Detection\n');
    
    const viewmodelsDir = path.join(PROJECT_DIR, 'src/wb-viewmodels');
    
    if (!fs.existsSync(viewmodelsDir)) {
      console.log('✅ No duplicates found (src/wb-viewmodels directory exists)');
      return { passed: true, duplicatesFound: 0 };
    }

    this.files = this.getAllJSFiles(viewmodelsDir);
    console.log(`📊 Scanning ${this.files.length} JavaScript files...\n`);

    for (const file of this.files) {
      this.scanFile(file);
    }

    const passed = this.issues.length === 0;
    
    if (!passed) {
      this.reportIssues();
    } else {
      console.log('✅ No duplicate variable declarations found!\n');
    }

    return { passed, duplicatesFound: this.issues.length };
  }

  scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(PROJECT_DIR, filePath);
    const fileVars = new Map();
    const varPattern = /(?:const|let|var)\s+(\w+)\s*=/g;
    let match;

    while ((match = varPattern.exec(content)) !== null) {
      const varName = match[1];
      const line = content.substring(0, match.index).split('\n').length;

      if (!fileVars.has(varName)) {
        fileVars.set(varName, []);
      }

      fileVars.get(varName).push({
        file: relativePath,
        line
      });
    }

    for (const [varName, occurrences] of fileVars) {
      if (occurrences.length > 1) {
        this.issues.push({
          type: 'DUPLICATE_IN_SCOPE',
          severity: 'HIGH',
          variable: varName,
          file: relativePath,
          locations: occurrences.map(o => `line ${o.line}`).join(', '),
          count: occurrences.length,
          suggestion: `Variable "${varName}" declared ${occurrences.length} times in same scope`
        });
      }
    }
  }

  getAllJSFiles(dir) {
    const files = [];
    const walk = (directory) => {
      try {
        const items = fs.readdirSync(directory);
        for (const item of items) {
          const fullPath = path.join(directory, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            if (!item.startsWith('.') && item !== 'node_modules') {
              walk(fullPath);
            }
          } else if (item.endsWith('.js')) {
            files.push(fullPath);
          }
        }
      } catch (e) {
        // Silently skip
      }
    };
    walk(dir);
    return files;
  }

  reportIssues() {
    console.error(`\n❌ FAST-FAIL: DUPLICATE DETECTION\n`);
    console.error(`   Found: ${this.issues.length} duplicate variable patterns\n`);

    const byFile = {};
    this.issues.forEach(issue => {
      if (!byFile[issue.file]) {
        byFile[issue.file] = [];
      }
      byFile[issue.file].push(issue);
    });

    let fileNum = 1;
    for (const [file, issues] of Object.entries(byFile)) {
      console.error(`   ${fileNum}. ${file}`);
      issues.forEach(issue => {
        console.error(`      ⚠️  "${issue.variable}" declared ${issue.count} times`);
        console.error(`          Lines: ${issue.locations}`);
      });
      fileNum++;
    }
    console.error('');
  }
}

async function main() {
  const detector = new DuplicateDetector();
  const result = await detector.run();
  
  if (!result.passed) {
    console.error(`\n   Fix: Rename duplicate variables or extract to src/wb-services/\n`);
    process.exit(1);
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Detection error:', err);
  process.exit(1);
});
