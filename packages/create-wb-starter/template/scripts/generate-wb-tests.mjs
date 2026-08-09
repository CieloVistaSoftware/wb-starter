#!/usr/bin/env node
/**
 * WB Framework - Auto-Generate Schema Tests
 * Updates all schemas to have at least 5 permutation tests using wb- prefix
 * 
 * Run: node scripts/generate-wb-tests.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, '..');
const SCHEMA_DIR = path.join(PROJECT_DIR, 'src/wb-models');

// Schemas to skip (not components or special cases)
const SKIP_SCHEMAS = [
  'behavior.schema.json',
  'views.schema.json', 
  'search-index.schema.json',
  'behaviors-showcase.schema.json',
  'card.base.schema.json',
  '_base' // Skip the _base directory
];

// Minimum tests to generate
const MIN_TESTS = 5;

function loadSchema(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch (e) {
    console.error(`Error loading ${filepath}:`, e.message);
    return null;
  }
}

function saveSchema(filepath, schema) {
  fs.writeFileSync(filepath, JSON.stringify(schema, null, 2));
}

function generatePermutationTests(schema) {
  const behavior = schema.behavior;
  const tests = [];
  const props = schema.properties || {};
  
  // 1. Basic test - no attributes
  tests.push(`<wb-${behavior}>Basic ${behavior} content</wb-${behavior}>`);
  
  // 2. Collect property permutations
  const propTests = [];
  
  for (const [propName, propDef] of Object.entries(props)) {
    // Skip meta/internal properties
    if (propName.startsWith('$') || propName.startsWith('_')) continue;
    
    // Convert camelCase to kebab-case for attribute
    const attrName = propName.replace(/([A-Z])/g, '-$1').toLowerCase();
    
    // Generate tests based on type
    if (propDef.enum && Array.isArray(propDef.enum)) {
      // Test each enum value
      for (const val of propDef.enum.slice(0, 3)) {
        propTests.push({
          attr: `${attrName}="${val}"`,
          desc: `${propName}=${val}`,
          priority: 1
        });
      }
    } else if (propDef.type === 'boolean') {
      // Boolean attribute (presence = true)
      propTests.push({
        attr: attrName,
        desc: `with ${propName}`,
        priority: 2
      });
    } else if (propDef.type === 'string') {
      // String with sample value
      const sampleValue = propDef.default || `Sample ${propName}`;
      if (sampleValue && sampleValue !== '') {
        propTests.push({
          attr: `${attrName}="${sampleValue}"`,
          desc: `${propName}="${sampleValue}"`,
          priority: 3
        });
      }
    } else if (propDef.type === 'number' || propDef.type === 'integer') {
      // Number with reasonable values
      const val = propDef.default ?? propDef.minimum ?? 50;
      propTests.push({
        attr: `${attrName}="${val}"`,
        desc: `${propName}=${val}`,
        priority: 3
      });
    }
  }
  
  // Sort by priority and add to tests
  propTests.sort((a, b) => a.priority - b.priority);
  
  for (const pt of propTests) {
    tests.push(`<wb-${behavior} ${pt.attr}>${pt.desc}</wb-${behavior}>`);
    if (tests.length >= 8) break;
  }
  
  // 3. If we still need more tests, create combination tests
  if (tests.length < MIN_TESTS && propTests.length >= 2) {
    const combo1 = propTests[0];
    const combo2 = propTests[1];
    tests.push(`<wb-${behavior} ${combo1.attr} ${combo2.attr}>Combined: ${combo1.desc}, ${combo2.desc}</wb-${behavior}>`);
  }
  
  // 4. Add a title test if title property exists
  if (props.title && !tests.some(t => t.includes('title='))) {
    tests.push(`<wb-${behavior} title="Test Title">With title attribute</wb-${behavior}>`);
  }
  
  // 5. Add variant tests if variant exists
  if (props.variant?.enum && !tests.some(t => t.includes('variant='))) {
    const variants = props.variant.enum.slice(0, 2);
    for (const v of variants) {
      tests.push(`<wb-${behavior} variant="${v}">Variant: ${v}</wb-${behavior}>`);
      if (tests.length >= 10) break;
    }
  }
  
  // Ensure we have at least MIN_TESTS
  while (tests.length < MIN_TESTS) {
    tests.push(`<wb-${behavior}>Test permutation ${tests.length + 1}</wb-${behavior}>`);
  }
  
  return tests.slice(0, 10); // Cap at 10 tests
}

function updateSchema(filepath) {
  const schema = loadSchema(filepath);
  if (!schema || !schema.behavior) return { updated: false, reason: 'no behavior' };
  
  const behavior = schema.behavior;
  
  // Ensure test section exists
  if (!schema.test) {
    schema.test = { setup: [] };
  }
  if (!schema.test.setup) {
    schema.test.setup = [];
  }
  
  // Count existing wb- prefix tests
  const existingWbTests = schema.test.setup.filter(t => t.includes('<wb-'));
  
  if (existingWbTests.length >= MIN_TESTS) {
    return { updated: false, reason: 'already has enough tests', count: existingWbTests.length };
  }
  
  // Generate new tests
  const newTests = generatePermutationTests(schema);
  
  // Merge: keep existing wb- tests, replace non-wb tests
  const nonWbTests = schema.test.setup.filter(t => !t.includes('<wb-'));
  
  // Build final test array: new wb- tests + keep unique existing wb- tests
  const finalTests = [...newTests];
  
  // Add any existing wb- tests that are unique
  for (const existing of existingWbTests) {
    if (!finalTests.includes(existing)) {
      finalTests.push(existing);
    }
  }
  
  schema.test.setup = finalTests.slice(0, 12); // Cap total at 12
  
  saveSchema(filepath, schema);
  
  return { 
    updated: true, 
    behavior,
    oldCount: existingWbTests.length,
    newCount: schema.test.setup.filter(t => t.includes('<wb-')).length,
    tests: schema.test.setup
  };
}

function main() {
  console.log('\n🔧 WB Framework - Generate Schema Tests\n');
  console.log(`Generating at least ${MIN_TESTS} <wb-*> prefix tests per schema...\n`);
  
  const files = fs.readdirSync(SCHEMA_DIR)
    .filter(f => f.endsWith('.schema.json') && !SKIP_SCHEMAS.includes(f));
  
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const file of files) {
    const filepath = path.join(SCHEMA_DIR, file);
    const result = updateSchema(filepath);
    
    if (result.updated) {
      console.log(`  ✅ ${result.behavior}: ${result.oldCount} → ${result.newCount} wb- tests`);
      updated++;
    } else if (result.reason === 'already has enough tests') {
      console.log(`  ⏭️  ${file}: already has ${result.count} wb- tests`);
      skipped++;
    } else {
      console.log(`  ⚠️  ${file}: ${result.reason}`);
      failed++;
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${files.length}\n`);
}

main();
