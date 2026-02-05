#!/usr/bin/env node
/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';

const LOCK_DIR = path.join(process.cwd(), 'Lock');
if (!fs.existsSync(LOCK_DIR)) {
  console.log('No Lock/ directory present — OK');
  process.exit(0);
}
const files = fs.readdirSync(LOCK_DIR).filter(f => !f.startsWith('.'));
if (files.length === 0) {
  console.log('Lock/ directory empty — OK');
  process.exit(0);
}
console.error(`Found ${files.length} file(s) in Lock/:\n${files.join('\n')}`);
console.error('Lock/ entries must be short-lived and removed before merging. See CONTRIBUTING.md for the lifecycle.');
process.exit(1);
