#!/usr/bin/env node
/**
 * WB Framework - Schema Test Audit
 * Checks behavior schemas have at least 5 setup tests using their declared
 * wb-* or x-* surface.
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

function listSchemaFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) listSchemaFiles(fullPath, files);
    else if (entry.name.endsWith('.schema.json')) files.push(fullPath);
  }
  return files;
}

function getBehaviorSurface(schema) {
  const behavior = schema.behavior || schema.schemaFor;
  if (!behavior) return [];
  const kebab = behavior.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  return [`<wb-${kebab}`, `x-${kebab}`];
}

function countSurfaceTests(testSetup, schema) {
  if (!Array.isArray(testSetup)) return 0;
  const surface = getBehaviorSurface(schema);
  return testSetup.filter(html => surface.some(marker => html.includes(marker))).length;
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
  const behavior = schema.behavior || schema.schemaFor;
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
  console.log(`Checking schemas for at least ${MIN_PERMUTATION_TESTS} setup tests using their wb-* or x-* surface...\n`);
  
  const files = listSchemaFiles(SCHEMA_DIR);
  
  const results = {
    timestamp: new Date().toISOString(),
    totalSchemas: files.length,
    passing: [],
    failing: [],
    details: {}
  };
  
  for (const fullPath of files) {
    const file = path.relative(SCHEMA_DIR, fullPath);
    const schema = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    if (!schema || (schema.schemaType || 'behavior') !== 'behavior' || file.includes('.base.')) continue;
    
    const behavior = schema.behavior || schema.schemaFor;
    if (!behavior) continue;
    const testSetup = schema.test?.setup || [];
    const wbPrefixCount = countSurfaceTests(testSetup, schema);
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
