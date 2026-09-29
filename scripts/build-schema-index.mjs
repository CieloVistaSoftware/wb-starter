/**
 * Build Schema Index (Phase 5)
 * ============================
 * Bundles all component schemas into a single data/schema-index.json
 * for the Interactive Schema Wizard to consume in the browser.
 *
 * Output: data/schema-index.json
 *
 * Usage:
 *   node scripts/build-schema-index.mjs
 */

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';

const MODELS_DIR = resolve('src/wb-models');
const OUTPUT = resolve('data/schema-index.json');

const files = readdirSync(MODELS_DIR)
  .filter(f => f.endsWith('.schema.json'))
  .filter(f => !f.includes('.base.'))
  .filter(f => !['views.schema.json', 'behavior.schema.json', 'behaviors-showcase.schema.json', 'search-index.schema.json'].includes(f))
  .sort();

const schemas = [];

for (const file of files) {
  try {
    const raw = readFileSync(join(MODELS_DIR, file), 'utf-8');
    const schema = JSON.parse(raw);

    // Extract only what the wizard needs
    // #1150: a behavior schema says which behavior it is. One without
    // schemaFor is an aggregate or meta schema (schema, demofile, x-effects,
    // x-enhancements), not a behavior, and wb.js dropped every nameless
    // entry anyway. otp/password/stepper were the behaviors among them and
    // now carry schemaFor.
    if (!schema.schemaFor) continue;
    // #1147: x-, not the wb- that 4.0.0 retired -- wb.js builds modifier
    // classes from baseClass, so wb-hero--cosmic matched no stylesheet.
    const name = schema.schemaFor;
    schemas.push({
      file,
      name,
      title: schema.title || name,
      description: schema.description || '',
      tag: `x-${name}`,
      baseClass: schema.baseClass || `x-${name}`,
      properties: schema.properties || {},
      // "scroll": every option of this behavior only shows while its box scrolls
      // (x-sticky); the behaviors page renders its examples in a scroll box (#750).
      ...(schema.demo ? { demo: schema.demo } : {}),
      matrix: schema.test?.matrix?.combinations || [],
      _metadata: schema._metadata || {}
    });
  } catch (e) {
    console.warn(`  ⚠️ Skipping ${file}: ${e.message}`);
  }
}

// Sort by title
schemas.sort((a, b) => a.title.localeCompare(b.title));

const index = {
  generatedAt: new Date().toISOString(),
  count: schemas.length,
  schemas
};

writeFileSync(OUTPUT, JSON.stringify(index, null, 2), 'utf-8');

console.log(`\n📋 Schema Index Built`);
console.log(`   Components: ${schemas.length}`);
console.log(`   Output: ${OUTPUT}\n`);
