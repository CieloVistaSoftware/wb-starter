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
    schemas.push({
      file,
      name: schema.schemaFor,
      title: schema.title || schema.schemaFor,
      description: schema.description || '',
      tag: `wb-${schema.schemaFor}`,
      baseClass: schema.baseClass || `wb-${schema.schemaFor}`,
      properties: schema.properties || {},
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
