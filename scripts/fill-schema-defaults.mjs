#!/usr/bin/env node
/**
 * fill-schema-defaults.mjs — every attribute states its default
 * ============================================================================
 * John: "all the default values should be specified", with the shape spelled
 * out: `title: "this is the title"`.
 *
 * 304 of 708 attributes across 156 schemas had no default, so the docs' Default
 * column read "—" for every field that carries content, and an unconfigured
 * behavior rendered nothing at all — <div x-cardhero></div> was a 400px empty
 * box.
 *
 * A default that names its own field fixes both at once. The doc shows a value,
 * and an empty invocation renders text that says exactly which attribute each
 * piece of it came from.
 *
 * WHAT GETS WHAT
 *
 *   string    "this is the <field>"    — plain and self-identifying
 *   boolean   false                    — the resting state
 *   number    0
 *   enum      its first declared value — the vocabulary decides, not us
 *   url/href  "#"                      — a real, inert link target
 *
 * Only fills what is MISSING. An existing default is a decision someone made
 * and is never overwritten.
 *
 *   node scripts/fill-schema-defaults.mjs --dry    report, write nothing
 *   node scripts/fill-schema-defaults.mjs          write
 */
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODELS = join(ROOT, 'src', 'wb-models');
const DRY = process.argv.includes('--dry');

/** ctaSecondaryHref -> "cta secondary href"; heading-level -> "heading level" */
function words(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .toLowerCase()
    .trim();
}

const URLISH = /url|href|src|poster|thumb/i;

function defaultFor(name, prop) {
  if (Array.isArray(prop.enum) && prop.enum.length) { return prop.enum[0]; }

  switch (prop.type) {
    case 'boolean': return false;
    case 'number':
    case 'integer': return 0;
    case 'string':
      // A URL rendered as a sentence produces a broken link; "#" is inert and
      // obviously a placeholder.
      return URLISH.test(name) ? '#' : `this is the ${words(name)}`;
    default:
      return undefined;   // object/array — no sensible one-size default
  }
}

let touchedFiles = 0;
let touchedProps = 0;
const skipped = [];

for (const file of readdirSync(MODELS).filter((f) => f.endsWith('.schema.json'))) {
  const path = join(MODELS, file);
  const raw = readFileSync(path, 'utf8');
  const schema = JSON.parse(raw);
  const props = schema.properties || {};

  let changed = 0;
  for (const [name, prop] of Object.entries(props)) {
    if (!prop || typeof prop !== 'object') { continue; }
    // An empty string is "no default stated", not a stated empty default —
    // that is exactly what rendered as "—" in the docs.
    if (prop.default !== undefined && prop.default !== '') { continue; }

    const value = defaultFor(name, prop);
    if (value === undefined) { skipped.push(`${file}: ${name} (${prop.type || 'no type'})`); continue; }

    prop.default = value;
    changed++;
  }

  if (!changed) { continue; }
  touchedFiles++;
  touchedProps += changed;

  if (!DRY) {
    // Trailing newline preserved: these files are diffed constantly and a
    // missing one turns every write into a whole-file change.
    writeFileSync(path, `${JSON.stringify(schema, null, 2)}\n`);
  }
}

console.log(`${DRY ? '[dry] ' : ''}schemas updated : ${touchedFiles}`);
console.log(`${DRY ? '[dry] ' : ''}defaults added  : ${touchedProps}`);
if (skipped.length) {
  console.log(`no sensible default (left alone): ${skipped.length}`);
  skipped.slice(0, 8).forEach((s) => console.log(`   ${s}`));
}
