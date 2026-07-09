#!/usr/bin/env node
/**
 * WB Framework - <wb-demo> Markup Integrity Check
 * Runs as: npm run test:wb-demo-integrity
 * Part of: npm test (compliance checks)
 *
 * FAST-FAIL: Exits with code 1 if any pages/*.html or demos/*.html file has
 * unbalanced <wb-demo>/</wb-demo> tags or a <wb-demo> with no content.
 *
 * Written after a real bug (#behaviors.html "Special Input Types" and
 * "Masked Inputs"): a stray self-closed <wb-demo></wb-demo> rendered as a
 * blank box, and an orphaned closing tag left three <input> elements as bare
 * siblings with no wrapper (no spacing). Nothing caught it — this does.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, '..');
const SCAN_DIRS = ['pages', 'demos'];

const OPEN_RE = /<wb-demo(?:\s[^>]*)?>/g;
const CLOSE_RE = /<\/wb-demo>/g;
const EMPTY_RE = /<wb-demo(?:\s[^>]*)?>\s*<\/wb-demo>/g;

function stripComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

function getAllHtmlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...getAllHtmlFiles(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/**
 * Pure function, no filesystem access — scans an HTML string for <wb-demo>
 * markup issues. Exported so tests/compliance/wb-demo-integrity.spec.ts can
 * exercise it directly against example fixtures, independent of which real
 * files currently exist on disk.
 */
export function scanHtml(rawHtml) {
  const html = stripComments(rawHtml);
  const issues = [];

  const opens = (html.match(OPEN_RE) || []).length;
  const closes = (html.match(CLOSE_RE) || []).length;
  if (opens !== closes) {
    issues.push(`unbalanced <wb-demo> tags: ${opens} open vs ${closes} close`);
  }

  const emptyMatches = html.match(EMPTY_RE) || [];
  if (emptyMatches.length > 0) {
    issues.push(`${emptyMatches.length} empty <wb-demo></wb-demo> block(s) — renders as a blank box`);
  }

  return issues;
}

function scanFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(PROJECT_DIR, filePath);
  return { relativePath, issues: scanHtml(raw) };
}

function main() {
  console.log('\n🔍 WB Framework - <wb-demo> Markup Integrity Check\n');

  const files = SCAN_DIRS.flatMap((dir) => getAllHtmlFiles(path.join(PROJECT_DIR, dir)));
  console.log(`📊 Scanning ${files.length} page/demo HTML files...\n`);

  const results = files.map(scanFile).filter((r) => r.issues.length > 0);

  if (results.length === 0) {
    console.log('✅ All <wb-demo> tags are balanced and non-empty!\n');
    process.exit(0);
  }

  console.error(`❌ Found <wb-demo> markup issues in ${results.length} file(s):\n`);
  results.forEach(({ relativePath, issues }) => {
    console.error(`   ${relativePath}`);
    issues.forEach((issue) => console.error(`      ⚠️  ${issue}`));
  });
  console.error('\n   Fix: each <wb-demo> needs exactly one matching </wb-demo>, with content between them.\n');
  process.exit(1);
}

// Only run the CLI scan (and its process.exit calls) when this file is
// executed directly — not when tests/compliance/wb-demo-integrity.spec.ts
// imports scanHtml() for fixture-based assertions. Resolve both sides to
// real filesystem paths before comparing — raw import.meta.url vs
// process.argv[1] string comparison silently mismatches on Windows
// (drive-letter casing, backslash vs forward-slash).
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main();
}
