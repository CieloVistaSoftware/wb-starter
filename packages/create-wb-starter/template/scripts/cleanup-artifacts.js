#!/usr/bin/env node
/* eslint-disable no-console */
// Remove local heavy test artifacts that slow down repo operations.
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const targets = [
  path.join(ROOT, 'tmp', 'playwright-*'),
  path.join(ROOT, 'tmp', 'run-*-artifacts'),
  path.join(ROOT, 'test-results'),
  path.join(ROOT, '.playwright-artifacts')
];
let removed = 0;
for (const t of targets) {
  // best-effort glob-like removal for common dirs
  const dir = t.replace(/\*.*$/, '');
  if (!fs.existsSync(dir)) continue;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('playwright-') || e.name.endsWith('-artifacts') || e.name === 'test-results' || e.name === '.playwright-artifacts') {
      const full = path.join(dir, e.name);
      try { fs.rmSync(full, { recursive: true, force: true }); removed++; } catch (err) { /* ignore */ }
    }
  }
}
console.log(`cleanup-artifacts: removed ~${removed} artifact entries (best-effort).`);
process.exit(0);
