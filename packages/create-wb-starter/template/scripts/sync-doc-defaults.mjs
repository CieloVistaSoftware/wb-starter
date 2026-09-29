#!/usr/bin/env node
/**
 * sync-doc-defaults.mjs — carry the schema defaults into the docs
 * ============================================================================
 * The schemas now state a default for every attribute, but every existing doc
 * still shows "—" in its Default column, because generate-behavior-docs.mjs
 * deliberately never overwrites a doc that exists.
 *
 * Same narrow, safe move as sync-attribute-descriptions.mjs (#1093): replace
 * ONLY the generator's own filler. A Default cell holding "—" says "no value
 * stated"; where the schema now states one, that cell is simply out of date.
 * A cell with a value in it is left alone.
 *
 *   node scripts/sync-doc-defaults.mjs --dry    report, write nothing
 *   node scripts/sync-doc-defaults.mjs          write
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs', 'behaviors');
const MODELS = join(ROOT, 'src', 'wb-models');
const DRY = process.argv.includes('--dry');

/** heading-level -> headingLevel, so a doc row finds its schema property. */
function camel(name) {
  return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function defaultsFor(docName) {
  const path = join(MODELS, `${docName}.schema.json`);
  if (!existsSync(path)) { return null; }

  let schema;
  try { schema = JSON.parse(readFileSync(path, 'utf8')); }
  catch { return null; }

  const out = new Map();
  for (const [name, prop] of Object.entries(schema.properties || {})) {
    if (!prop || typeof prop !== 'object' || prop.default === undefined) { continue; }
    // An empty default is a real statement — "nothing by default" — but there is
    // no way to render it in a table cell that reads better than the em dash
    // already there, so it stays.
    if (prop.default === '') { continue; }
    out.set(name.toLowerCase(), prop.default);
  }
  return out;
}

/** `| `attr` | values | — | description |` — only the Default cell moves. */
const ROW = /^(\|\s*`([^`]+)`\s*\|[^|]*\|\s*)—(\s*\|)/;

let touchedFiles = 0;
let touchedRows = 0;
const noSchema = [];

for (const file of readdirSync(DOCS).filter((f) => f.endsWith('.md'))) {
  const docName = file.replace(/\.md$/, '');
  const defaults = defaultsFor(docName);
  if (!defaults) { noSchema.push(docName); continue; }

  const path = join(DOCS, file);
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);

  let changed = 0;
  const next = lines.map((line) => {
    const m = line.match(ROW);
    if (!m) { return line; }

    const attr = m[2].trim();
    const value = defaults.get(attr.toLowerCase()) ?? defaults.get(camel(attr).toLowerCase());
    if (value === undefined) { return line; }

    changed++;
    return line.replace(ROW, `$1\`${String(value)}\`$3`);
  });

  if (!changed) { continue; }
  touchedFiles++;
  touchedRows += changed;
  if (!DRY) { writeFileSync(path, next.join('\n')); }
}

console.log(`${DRY ? '[dry] ' : ''}docs updated  : ${touchedFiles}`);
console.log(`${DRY ? '[dry] ' : ''}rows filled   : ${touchedRows}`);
if (noSchema.length) { console.log(`no schema (skipped): ${noSchema.length}`); }
