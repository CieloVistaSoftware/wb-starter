/**
 * Phase 4 Migration Scanner
 * Finds HTML files using legacy attribute names
 * 
 * Run: node scripts/scan-legacy-attributes.js
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const RESULTS_FILE = 'data/legacy-attributes-scan.json';

// Patterns to find (attribute="value" on wb-* elements)
const LEGACY_PATTERNS = [
  // title attribute on wb-card, wb-hero, wb-cardhero, etc. (should be heading)
  { pattern: /<wb-[a-z]+[^>]*\stitle=/gi, replacement: 'heading', description: 'title → heading on wb-* components' },
  
  // type attribute for variants (should be variant) - but NOT on input/button
  { pattern: /<wb-(toast|alert|badge|notification)[^>]*\stype=/gi, replacement: 'variant', description: 'type → variant on feedback components' },
  
  // title attribute on wb-tab (should be label)
  { pattern: /<wb-tab[^>]*\stitle=/gi, replacement: 'label', description: 'title → label on wb-tab' },
  
  // data-type for feedback (should be data-variant or variant)
  { pattern: /<[^>]*x-toast[^>]*\stype=/gi, replacement: 'variant', description: 'type → variant on x-toast' },
];

// Directories to skip
const SKIP_DIRS = ['node_modules', '.git', 'dist', 'data/test-results', 'tmp_trace', '.playwright-artifacts'];

function shouldSkip(path) {
  return SKIP_DIRS.some(skip => path.includes(skip));
}

function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const matches = [];
  
  for (const { pattern, replacement, description } of LEGACY_PATTERNS) {
    const regex = new RegExp(pattern);
    let match;
    const lines = content.split('\n');
    
    lines.forEach((line, lineNum) => {
      if (regex.test(line)) {
        matches.push({
          line: lineNum + 1,
          content: line.trim().substring(0, 200),
          issue: description,
          suggestion: replacement
        });
      }
    });
  }
  
  return matches;
}

function scanDirectory(dir, results = {}) {
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    
    if (shouldSkip(fullPath)) continue;
    
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      scanDirectory(fullPath, results);
    } else if (item.endsWith('.html')) {
      const matches = scanFile(fullPath);
      if (matches.length > 0) {
        results[relative(ROOT, fullPath)] = matches;
      }
    }
  }
  
  return results;
}

console.log('Scanning for legacy attribute usage...\n');

const results = scanDirectory(ROOT);
const totalFiles = Object.keys(results).length;
const totalIssues = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

console.log(`Found ${totalIssues} issues in ${totalFiles} files\n`);

// Output summary
for (const [file, matches] of Object.entries(results)) {
  console.log(`📄 ${file}`);
  for (const m of matches) {
    console.log(`   Line ${m.line}: ${m.issue}`);
  }
}

// Save detailed results
writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
console.log(`\nDetailed results saved to ${RESULTS_FILE}`);
