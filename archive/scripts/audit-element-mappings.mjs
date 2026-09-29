// Audit: which registered behaviors lack a wb-* custom-element mapping?
import fs from 'fs';

const idx = fs.readFileSync('src/wb-viewmodels/index.js', 'utf8');
const lazy = fs.readFileSync('src/core/wb-lazy.js', 'utf8');

// Extract behaviorModules registry keys
const start = idx.indexOf('const behaviorModules');
const bm = idx.slice(start, idx.indexOf('};', start));
const behaviors = [...new Set(
  [...bm.matchAll(/(?:^|[\s{,])([a-zA-Z][\w-]*)\s*:/g)].map(m => m[1])
)].filter(n => n !== 'behaviorModules');

// Extract all selector/behavior mappings from wb-lazy.js
const maps = [...lazy.matchAll(/selector:\s*'([^']+)'\s*,\s*behavior:\s*'([^']+)'/g)]
  .map(m => ({ sel: m[1], beh: m[2] }));

const wbEls = maps.filter(m => m.sel.startsWith('wb-'));
const attrEls = maps.filter(m => m.sel.startsWith('['));
const mapped = new Set(maps.map(m => m.beh));
const wbBehaviors = new Set(wbEls.map(m => m.beh));

console.log('TOTAL behaviors in registry :', behaviors.length);
console.log('TOTAL wb-* custom elements  :', wbEls.length);
console.log('TOTAL [x-*] attr mappings   :', attrEls.length);

const noMap = behaviors.filter(b => !mapped.has(b));
const attrOnly = behaviors.filter(b => mapped.has(b) && !wbBehaviors.has(b));

console.log('\n=== behaviors with NO mapping at all (unreachable) ===');
console.log(noMap.length ? noMap.join(', ') : '(none)');

console.log('\n=== behaviors mapped ONLY via [x-*] (no <wb-> tag) ===');
console.log(attrOnly.length ? attrOnly.join(', ') : '(none)');

console.log('\n=== DEFINITIVE list of all <wb-*> custom elements ===');
console.log(wbEls.map(m => m.sel).sort().join('\n'));
