#!/usr/bin/env node
/**
 * R2 SINGULAR — collapse `foo` + `data-foo` pairs to one declared name.
 *
 * extractData() (schema-builder.js:231) strips the `data-` prefix before
 * camelCasing, so `data-lazy` and `lazy` produce the SAME data key. Declaring
 * both never gave the author a second option -- it only made the generated
 * docs list one option twice and the audit count one concept as two.
 *
 * Keeps the BARE name as canonical, records the `data-` spelling in `aliases`
 * (schema-builder.js:244 already honours aliases), and merges any field the
 * bare declaration was missing so nothing documented is lost.
 *
 *   node scripts/fix-attr-r2-duplicates.mjs --dry     show what would change
 *   node scripts/fix-attr-r2-duplicates.mjs           apply
 */
import fs from 'node:fs';
import path from 'node:path';
import { auditAll } from './lib/attribute-audit.mjs';

const MODELS = 'src/wb-models';
const DRY = process.argv.includes('--dry');

const { behaviors } = auditAll();
let filesChanged = 0;
let pairsFixed = 0;

for (const b of behaviors) {
  const r2 = b.violations.filter((v) => v.rule === 'R2');
  if (!r2.length) continue;

  const file = path.join(MODELS, b.file);
  const raw = fs.readFileSync(file, 'utf8');
  const schema = JSON.parse(raw);
  let touched = false;

  for (const v of r2) {
    const spellings = v.attr.split(' / ').map((s) => s.trim());
    const dashed = spellings.find((s) => s.startsWith('data-'));
    const bare = spellings.find((s) => !s.startsWith('data-'));

    // Only handle the bare/data- shape here. Anything else is a genuine
    // two-word disagreement and needs a human decision, not a rewrite.
    if (!dashed || !bare || spellings.length !== 2) {
      console.log('  SKIP  x-' + b.name + '  ' + v.attr + '  (not a data- pair)');
      continue;
    }

    const bareDef = schema.properties[bare];
    const dashedDef = schema.properties[dashed];
    if (!bareDef || !dashedDef) continue;

    // Merge anything the bare declaration lacks, so no documented detail is
    // lost when the duplicate goes away.
    for (const k of Object.keys(dashedDef)) {
      if (bareDef[k] === undefined) bareDef[k] = dashedDef[k];
    }

    const aliases = new Set(bareDef.aliases || []);
    aliases.add(dashed);
    bareDef.aliases = [...aliases];

    delete schema.properties[dashed];
    touched = true;
    pairsFixed++;
    console.log('  x-' + b.name.padEnd(16) + bare + '   <- absorbed ' + dashed + ' as an alias');
  }

  if (touched && !DRY) {
    // Preserve the file's trailing newline convention.
    const out = JSON.stringify(schema, null, 2) + (raw.endsWith('\n') ? '\n' : '');
    fs.writeFileSync(file, out);
    filesChanged++;
  } else if (touched) {
    filesChanged++;
  }
}

console.log('');
console.log((DRY ? 'WOULD FIX' : 'FIXED') + ': ' + pairsFixed + ' duplicate pair(s) across ' + filesChanged + ' schema(s)');
if (DRY) console.log('(dry run — nothing written)');
