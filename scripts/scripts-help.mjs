#!/usr/bin/env node
/**
 * scripts-help.mjs -- `npm run scripts:help`: every npm script, grouped, with
 * what it does and when to use it (#1911).
 *
 * John, 2026-10-16, on the 74-script list: "how can a user know what to use,
 * when to use it?" The words live in package.json -- `scripts-info` (name to
 * description) and `scripts-groups` (group to names, in reading order) -- so
 * an editor's script panel can show the same thing this prints.
 * tests/compliance/npm-scripts-are-described.spec.ts keeps both complete.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const info = pkg['scripts-info'] || {};
const groups = pkg['scripts-groups'] || { Scripts: Object.keys(pkg.scripts) };
const width = Math.max(...Object.keys(pkg.scripts).map((s) => s.length)) + 2;

for (const [group, names] of Object.entries(groups)) {
  console.log('\n' + group);
  console.log('-'.repeat(group.length));
  for (const name of names) console.log('  npm run ' + name.padEnd(width) + (info[name] || ''));
}
console.log('');
