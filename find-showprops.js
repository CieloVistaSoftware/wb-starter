#!/usr/bin/env node
// find-showprops.js — ESM version of find-showprops.cjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const content = fs.readFileSync(path.resolve(__dirname, 'builder.html'), 'utf8');
const lines = content.split('\n');

// Find showProperties function
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function showProperties')) {
    console.log('Found showProperties at line:', i + 1);
    // Print 5 lines before and 30 lines after
    for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 40); j++) {
      console.log((j + 1) + ': ' + lines[j]);
    }
    break;
  }
}
