#!/usr/bin/env node
/**
 * WB Framework - Schema Test Audit
 * Checks all schemas have at least 5 permutation tests using wb- prefix
 * 
 * Run: node scripts/audit-schema-tests.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, '..');
const SCHEMA_DIR = path.join(PROJECT_DIR, 'src/wb-models');
const OUTPUT_FILE = path.join(PROJECT_DIR, 'data/schema-test-audit.json');

// Schemas that are not components (behaviors/utilities)
const NON_COMPONENT_SCHEMAS = [
  'behavior.schema.json',
  'views.schema.json', 
  'search-index.schema.json',
  'behaviors-showcase.schema.json',
  'card.base.schema.json' // Base schema for card inheritance
];

// Minimum required permutation tests
const MIN_PERMUTATION_TESTS = 5;

function loadSchema(filename) {
  try {
    const content = fs.readFileSync(path.join(SCHEMA_DIR, filename), 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error(`Error loading ${filename}:`, e.message);
    return null;
  }
}

function countWbPrefixTests(testSetup) {
  if (!testSetup || !Array.isArray(testSetup)) return 0;
  return testSetup.filter(html => html.includes('<wb-')).length;
}

function getPropertyPermutations(schema) {
  const permutations = [];
  const props = schema.properties || {};
  
  for (const [propName, propDef] of Object.entries(props)) {
    if (propName.startsWith('$')) continue; // Skip meta properties
    
    const values = [];
    
    if (propDef.enum && Array.isArray(propDef.enum)) {
      values.push(...propDef.enum);
    } else if (propDef.type === 'boolean') {
      values.push(true, false);
    } else if (propDef.type === 'string') {
      values.push(propDef.default || 'Test Value');
    } else if (propDef.type === 'number') {
      values.push(propDef.default || 0, propDef.minimum || 0, propDef.maximum || 100);
    }
    
    if (values.length > 0) {
      permutations.push({ prop: propName, values, type: propDef.type });
    }
  }
  
  return permutations;
}

function generateWbPrefixTests(schema) {
  const behavior = schema.behavior;
  const tests = [];
  
  // Basic test
  tests.push(`<wb-${behavior}>Basic content</wb-${behavior}>`);
  
  // Generate tests from properties
  const perms = getPropertyPermutations(schema);
  
  for (const perm of perms) {
    for (const value of perm.values.slice(0, 2)) { // Max 2 values per prop
      const attrName = perm.prop.replace(/([A-Z])/g, '-$1').toLowerCase();
      let attrValue = value;
      
      if (typeof value === 'boolean') {
        if (value) {
          tests.push(`<wb-${behavior} ${attrName}>With ${perm.prop}</wb-${behavior}>`);
        }
      } else {
        tests.push(`<wb-${behavior} ${attrName}="${attrValue}">With ${perm.prop}=${attrValue}</wb-${behavior}>`);
      }
      
      if (tests.length >= 10) break;
    }
    if (tests.length >= 10) break;
  }
  
  // If we still don't have enough, add combined tests
  if (tests.length < MIN_PERMUTATION_TESTS && perms.length >= 2) {
    const combo = [];
    for (let i = 0; i < Math.min(2, perms.length); i++) {
      const p = perms[i];
      const attrName = p.prop.replace(/([A-Z])/g, '-$1').toLowerCase();
      const val = p.values[0];
      if (typeof val === 'boolean' && val) {
        combo.push(attrName);
      } else if (typeof val !== 'boolean') {
        combo.push(`${attrName}="${val}"`);
      }
    }
    if (combo.length > 0) {
      tests.push(`<wb-${behavior} ${combo.join(' ')}>Combined test</wb-${behavior}>`);
    }
  }
  
  return tests.slice(0, 10);
}

function auditSchemas() {
  console.log('\n🔍 WB Framework - Schema Test Audit\n');
  console.log(`Checking schemas for at least ${MIN_PERMUTATION_TESTS} tests using <wb-*> prefix...\n`);
  
  const files = fs.readdirSync(SCHEMA_DIR)
    .filter(f => f.endsWith('.schema.json') && !NON_COMPONENT_SCHEMAS.includes(f));
  
  const results = {
    timestamp: new Date().toISOString(),
    totalSchemas: files.length,
    passing: [],
    failing: [],
    details: {}
  };
  
  for (const file of files) {
    const schema = loadSchema(file);
    if (!schema || !schema.behavior) continue;
    
    const behavior = schema.behavior;
    const testSetup = schema.test?.setup || [];
    const wbPrefixCount = countWbPrefixTests(testSetup);
    const totalTests = testSetup.length;
    
    const detail = {
      file,
      behavior,
      totalTests,
      wbPrefixTests: wbPrefixCount,
      passing: wbPrefixCount >= MIN_PERMUTATION_TESTS,
      currentSetup: testSetup,
      suggestedTests: generateWbPrefixTests(schema)
    };
    
    results.details[behavior] = detail;
    
    if (detail.passing) {
      results.passing.push(behavior);
      console.log(`  ✅ ${behavior}: ${wbPrefixCount}/${totalTests} tests use <wb-*> prefix`);
    } else {
      results.failing.push(behavior);
      console.log(`  ❌ ${behavior}: ${wbPrefixCount}/${totalTests} tests use <wb-*> prefix (need ${MIN_PERMUTATION_TESTS})`);
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   Total schemas: ${results.totalSchemas}`);
  console.log(`   Passing (≥${MIN_PERMUTATION_TESTS} wb- tests): ${results.passing.length}`);
  console.log(`   Failing (<${MIN_PERMUTATION_TESTS} wb- tests): ${results.failing.length}`);
  
  // Write results
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`\n📁 Details written to: ${OUTPUT_FILE}\n`);
  
  return results;
}

auditSchemas();
