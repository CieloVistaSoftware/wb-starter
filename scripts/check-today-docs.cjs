#!/usr/bin/env node
// scripts/check-today-docs.cjs
// Fail if docs/_today/TODO.md looks unexpectedly old or missing recent sections.
const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '../docs/_today/TODO.md');
if (!fs.existsSync(file)) { console.error('missing TODO.md'); process.exit(2); }
const txt = fs.readFileSync(file, 'utf8');
const ok = /Related migration tasks|CSS ownership migration|Break up `feedback\.js` monolith/i.test(txt);
if (!ok) {
  console.error('docs/_today/TODO.md looks regressed or missing recent entries.');
  console.error('Expected one of: "Related migration tasks", "CSS ownership migration", or "Break up `feedback.js` monolith".');
  process.exit(1);
}
console.log('docs/_today sanity check: OK');
process.exit(0);
