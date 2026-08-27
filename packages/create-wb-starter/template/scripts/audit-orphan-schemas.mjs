/**
 * audit-orphan-schemas.mjs — schemas with no implementation anywhere (#670).
 *
 * John: "ok remove cardfile. Are there any others like it".
 *
 * The earlier audit (audit-schema-vs-behavior.mjs) reported 45 schemas as
 * "no behavior source found", but that was a FILENAME-matching artifact --
 * several behaviors legitimately live in grouped files (alert in feedback.js,
 * and so on). Deleting on that basis would remove working behaviors.
 *
 * This checks for a real implementation by four independent routes:
 *   1. `export function <name>` anywhere under src/wb-viewmodels
 *   2. an export alias (`export { x as <name> }`)
 *   3. registration in src/wb-viewmodels/index.js
 *   4. a tag-map entry pointing at a behavior of that name
 *
 * A schema is only reported as orphaned when ALL FOUR find nothing.
 *
 * Usage: node scripts/audit-orphan-schemas.mjs [--json]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODELS = path.join(ROOT, 'src', 'wb-models');
const VM = path.join(ROOT, 'src', 'wb-viewmodels');
const CORE = path.join(ROOT, 'src', 'core');

function readAll(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) readAll(full, acc);
    else if (e.name.endsWith('.js')) acc.push({ file: path.relative(ROOT, full), src: fs.readFileSync(full, 'utf8') });
  }
  return acc;
}

const vmFiles = readAll(VM);
const allVm = vmFiles.map((f) => f.src).join('\n');
const indexSrc = vmFiles.find((f) => f.file.endsWith(path.join('wb-viewmodels', 'index.js')))?.src ?? '';
const tagMap = fs.readFileSync(path.join(CORE, 'tag-map.js'), 'utf8');
const lazy = fs.readFileSync(path.join(CORE, 'wb-lazy.js'), 'utf8');

/**
 * Schemas that are NOT behaviors and must never be treated as deletable:
 *
 *   demofile  -- the declared source of truth for
 *                tests/compliance/demo-file-validation.spec.ts, which cites it
 *                three times. It drives a live compliance gate; deleting it
 *                because "no behavior implements it" would break that gate.
 *   card.base -- the inheritance holdover tracked in #465/#462/#418. Goes with
 *                that work, not with an orphan sweep.
 *
 * Both are reported below rather than hidden, so the list stays honest -- but
 * check what reads a schema before removing it. A schema can have no behavior
 * and still have a job.
 */

/** Schema names that are not behaviors at all. */
const NOT_COMPONENTS = new Set([
  'schema', 'views', 'search-index', 'home-page', 'behaviors',
  'x-behavior', 'x-collapse', 'x-copy', 'x-draggable', 'x-effects', 'x-enhancements',
]);

const rows = [];
for (const file of fs.readdirSync(MODELS).filter((f) => f.endsWith('.schema.json'))) {
  const name = file.replace('.schema.json', '');
  if (NOT_COMPONENTS.has(name)) continue;

  const camel = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const evidence = {
    exportFn: new RegExp(`export\\s+function\\s+(${name}|${camel})\\b`).test(allVm),
    exportAlias: new RegExp(`as\\s+(${name}|${camel})\\b`).test(allVm),
    registered: new RegExp(`['"\`]?(${name}|${camel})['"\`]?\\s*[,:}]`).test(indexSrc),
    inTagMap: new RegExp(`['"\`](${name}|${camel})['"\`]`).test(tagMap) ||
              new RegExp(`['"\`](${name}|${camel})['"\`]`).test(lazy),
  };
  const implemented = Object.values(evidence).some(Boolean);
  if (!implemented) rows.push({ schema: name, file, evidence });
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ count: rows.length, orphans: rows }, null, 2));
  process.exit(0);
}

console.log('Schemas with NO implementation by any route\n');
if (!rows.length) {
  console.log('  none — every schema resolves to a behavior somewhere.');
} else {
  rows.forEach((r) => console.log('  ' + r.schema.padEnd(22) + r.file));
  console.log(`\n  ${rows.length} orphaned schema(s).`);
}
