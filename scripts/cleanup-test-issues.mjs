#!/usr/bin/env node
/**
 * Cleanup Test Issues
 * 
 * Removes garbage test entries from pending-issues.json that were created
 * during automated testing. These pollute the issues list and cause
 * "Skipped invalid paragraph" warnings in Issue Watcher.
 * 
 * Usage:
 *   node scripts/cleanup-test-issues.mjs          # Dry run (preview)
 *   node scripts/cleanup-test-issues.mjs --apply  # Actually delete
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ISSUES_PATH = resolve(__dirname, '../data/pending-issues.json');

// Patterns that indicate garbage test issues
const GARBAGE_PATTERNS = [
  /^retry-test-/i,
  /^lifecycle-test-/i,
  /^rejection-test-/i,
  /^approval-test-/i,
  /^full-flow-test-/i,
  /^direct-fix-test-/i,
  /^in-progress-test-/i,
  /^Test issue \d+/i,
  /^Delete test \d+/i,
  /^test-refresh-/i,
  /^test-window-refresh-/i,
  /^\[BUG\] Test issue from header/i,
  /^\[BUG\] Test failure for issue/i,
  /^\[BUG\] Test refresh validation/i,
  /^\[BUG\] Window refresh test/i,
];

// HTML fragment patterns (from bad issue submissions)
const HTML_FRAGMENT_PATTERNS = [
  /^<\/?div/i,
  /^<\/?button/i,
  /^<\/?span/i,
  /^<\/?pre/i,
  /^<\/?nav/i,
  /^<\/?main/i,
  /^<\/?footer/i,
  /^<\/?script/i,
  /^<body>/i,
  /^<header class=/i,
  /^\s*<\/div>/i,
  /^const \w+ =/,  // JavaScript code fragments
  /^function \w+/,
  /^window\.\w+ =/,
  /^let \w+ =/,
  /^try \{/,
  /^if \(!?filtered/,
  /^}\s*$/,  // Just closing braces
  /^Test:/i,
  /^Error:/i,
  /^Original Issue:/i,
  /^Test Results:/i,
];

function isGarbageIssue(issue) {
  const desc = issue.description || '';
  const id = issue.id || '';
  
  // Check ID and description against patterns
  for (const pattern of GARBAGE_PATTERNS) {
    if (pattern.test(id) || pattern.test(desc)) {
      return { garbage: true, reason: `Matches pattern: ${pattern}` };
    }
  }
  
  // Check for HTML/JS fragments
  for (const pattern of HTML_FRAGMENT_PATTERNS) {
    if (pattern.test(desc.trim())) {
      return { garbage: true, reason: `HTML/JS fragment` };
    }
  }
  
  // Check for paragraph fragments (note-*-p1, p2, etc. that aren't p0)
  if (/-p[1-9]\d*$/.test(id)) {
    // These are usually HTML fragments from bad submissions
    const firstLine = desc.split('\n')[0].trim();
    if (firstLine.startsWith('<') || firstLine.startsWith('</') || firstLine.length < 30) {
      return { garbage: true, reason: 'Paragraph fragment' };
    }
  }
  
  return { garbage: false };
}

function main() {
  const applyChanges = process.argv.includes('--apply');
  
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  🧹 Cleanup Test Issues                                       ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Mode: ${applyChanges ? '🔴 APPLY (will delete)' : '🟢 DRY RUN (preview only)   '}                       ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Read issues
  let data;
  try {
    data = JSON.parse(readFileSync(ISSUES_PATH, 'utf-8'));
  } catch (e) {
    console.error('❌ Failed to read pending-issues.json:', e.message);
    process.exit(1);
  }
  
  const original = data.issues || [];
  const keep = [];
  const remove = [];
  
  for (const issue of original) {
    const result = isGarbageIssue(issue);
    if (result.garbage) {
      remove.push({ issue, reason: result.reason });
    } else {
      keep.push(issue);
    }
  }
  
  // Report
  console.log(`📊 Analysis:`);
  console.log(`   Total issues: ${original.length}`);
  console.log(`   Keeping:      ${keep.length}`);
  console.log(`   Removing:     ${remove.length}`);
  console.log('');
  
  if (remove.length === 0) {
    console.log('✅ No garbage issues found!');
    return;
  }
  
  // Show what will be removed (limit to 20 for readability)
  console.log('🗑️  Issues to remove:');
  const showCount = Math.min(remove.length, 20);
  for (let i = 0; i < showCount; i++) {
    const { issue, reason } = remove[i];
    const shortId = issue.id.slice(-12);
    const shortDesc = (issue.description || '').slice(0, 40).replace(/\n/g, ' ');
    console.log(`   • ...${shortId}: "${shortDesc}..." (${reason})`);
  }
  if (remove.length > 20) {
    console.log(`   ... and ${remove.length - 20} more`);
  }
  console.log('');
  
  if (applyChanges) {
    // Write cleaned data
    data.issues = keep;
    data.lastUpdated = new Date().toISOString();
    
    writeFileSync(ISSUES_PATH, JSON.stringify(data, null, 2));
    console.log(`✅ Removed ${remove.length} garbage issues`);
    console.log(`📁 Updated: ${ISSUES_PATH}`);
  } else {
    console.log('ℹ️  This was a dry run. To apply changes, run:');
    console.log('   node scripts/cleanup-test-issues.mjs --apply');
  }
}

main();
