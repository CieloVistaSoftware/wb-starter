#!/usr/bin/env node
/**
 * The official attribute audit — one record per behavior.
 *
 *   node scripts/attr-audit.mjs                 summary + non-compliant list
 *   node scripts/attr-audit.mjs --all           every behavior, compliant too
 *   node scripts/attr-audit.mjs x-tooltip       one behavior, full detail
 *   node scripts/attr-audit.mjs --undeclared    attributes read but not declared
 *   node scripts/attr-audit.mjs --json          machine-readable
 *
 * Exits 1 when any behavior is non-compliant, so it can gate a build.
 * All logic lives in scripts/lib/attribute-audit.mjs — this file only prints.
 */
import fs from 'node:fs';
import { auditAll, RULES } from './lib/attribute-audit.mjs';

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const target = args.find((a) => !a.startsWith('--'));

const { behaviors, undeclared, totals } = auditAll();

if (has('--json')) {
  console.log(JSON.stringify({ behaviors, undeclared, totals }, null, 2));
  process.exit(totals.compliant === totals.behaviors ? 0 : 1);
}

const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

if (target) {
  const key = target.replace(/^x-/, '');
  const b = behaviors.find((x) => x.name === key);
  if (!b) {
    console.error('No behavior schema for "' + target + '".');
    process.exit(2);
  }
  console.log('x-' + b.name + '   (' + b.file + ')');
  console.log('  declared: ' + b.declared.length + '   ' + b.declared.join(', '));
  if (b.aliases.length) console.log('  aliases:  ' + b.aliases.join(', '));
  console.log('  verdict:  ' + (b.compliant ? 'COMPLIANT' : b.violations.length + ' violation(s)'));
  for (const v of b.violations) console.log('    [' + v.rule + '] ' + v.attr + '\n          ' + v.detail);
  process.exit(b.compliant ? 0 : 1);
}

if (has('--undeclared')) {
  console.log('READ BY CODE, DECLARED BY NO SCHEMA: ' + undeclared.length);
  console.log('(invisible to the docs, the showcase and autocomplete)\n');
  for (const u of undeclared) console.log('  ' + u.attr.padEnd(26) + u.readBy.join(', '));
  process.exit(undeclared.length ? 1 : 0);
}

console.log('OFFICIAL ATTRIBUTE AUDIT');
console.log('  behaviors audited:     ' + totals.behaviors);
console.log('  attributes declared:   ' + totals.declared);
console.log('  COMPLIANT behaviors:   ' + totals.compliant + ' / ' + totals.behaviors + '  (' + pct(totals.compliant, totals.behaviors) + '%)');
console.log('  violations:            ' + totals.violations);
console.log('');
for (const [r, text] of Object.entries(RULES)) {
  console.log('  ' + r + '  ' + String(totals.byRule[r]).padStart(4) + '   ' + text);
}
console.log('');

const bad = behaviors.filter((b) => !b.compliant);
const list = has('--all') ? behaviors : bad;
console.log((has('--all') ? 'ALL BEHAVIORS' : 'NON-COMPLIANT BEHAVIORS') + ' (' + list.length + ')');
for (const b of list) {
  const counts = ['R1', 'R2', 'R3']
    .map((r) => [r, b.violations.filter((v) => v.rule === r).length])
    .filter(([, n]) => n)
    .map(([r, n]) => r + ':' + n)
    .join(' ');
  console.log(
    '  ' + ('x-' + b.name).padEnd(22) +
    String(b.declared.length).padStart(3) + ' declared   ' +
    (b.compliant ? 'ok' : counts),
  );
}

fs.writeFileSync('data/attribute-audit.json', JSON.stringify({ behaviors, undeclared, totals }, null, 2));
console.log('\n-> data/attribute-audit.json     (one record per behavior)');
console.log('   detail:  node scripts/attr-audit.mjs x-tooltip');

process.exit(bad.length ? 1 : 0);
