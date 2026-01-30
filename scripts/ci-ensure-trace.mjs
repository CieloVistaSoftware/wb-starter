#!/usr/bin/env node
/*
  ci-ensure-trace.mjs
  Usage: node scripts/ci-ensure-trace.mjs <results-dir> [--retries=3] [--wait=2000]
  Verifies Playwright trace.zip artifacts exist for test-result folders; retries if missing.
*/
import fs from 'fs/promises';
import path from 'path';

const argv = Object.fromEntries(process.argv.slice(2).map(a => a.includes('=') ? a.split('=') : [a, true]));
const resultsDir = process.argv[2] || argv['resultsDir'] || 'data/test-results';
const retries = parseInt((argv['--retries'] || argv.retries || 3), 10) || 3;
const waitMs = parseInt((argv['--wait'] || argv.wait || 2000), 10) || 2000;

async function listResultDirs(dir) {
  try {
    const names = await fs.readdir(dir, { withFileTypes: true });
    return names.filter(d => d.isDirectory()).map(d => path.join(dir, d.name));
  } catch (err) {
    console.error('Failed to read results dir', dir, err.message);
    return [];
  }
}

async function hasTrace(dir) {
  try {
    const files = await fs.readdir(dir);
    return files.some(f => f.endsWith('trace.zip'));
  } catch (e) {
    return false;
  }
}

(async () => {
  const dirs = await listResultDirs(resultsDir);
  if (dirs.length === 0) {
    console.warn('No test-result directories found under', resultsDir);
    process.exit(0);
  }

  const missing = new Set();
  for (const d of dirs) {
    if (!(await hasTrace(d))) missing.add(d);
  }

  for (let i = 0; i < retries && missing.size > 0; i++) {
    console.log(`trace-check: retry ${i+1}/${retries} — missing: ${missing.size}`);
    await new Promise(r => setTimeout(r, waitMs));
    for (const d of Array.from(missing)) {
      if (await hasTrace(d)) missing.delete(d);
    }
  }

  if (missing.size > 0) {
    console.error('Missing trace.zip for the following result folders:');
    console.error(Array.from(missing).join('\n'));
    console.error('\nIf this appears in CI, ensure Playwright trace:on is enabled and that artifacts are not cleaned before upload.');
    process.exit(2);
  }

  console.log('All result folders contain trace.zip (or none were expected).');
  process.exit(0);
})();
