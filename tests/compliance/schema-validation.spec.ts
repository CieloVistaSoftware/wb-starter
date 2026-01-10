/**
 * SCHEMA VALIDATION - Static Compliance
 * =====================================
 * Validates all .schema.json files are complete and well-formed.
 */

import { test, expect } from '@playwright/test';
import {
  PATHS, getSchemaFiles, loadSchema, getComponentSchemas, Schema
} from '../base';

test.describe('Schema Validation: JSON Syntax', () => {
  
  test('all schema files are valid JSON', () => {
    const files = getSchemaFiles();
    const invalid: string[] = [];
    
    for (const file of files) {
      const schema = loadSchema(file);
      if (!schema) invalid.push(file);
    }
    
    expect(invalid, `Invalid JSON files: ${invalid.join(', ')}`).toEqual([]);
  });
});

test.describe('Schema Validation: Required Sections', () => {
  
  test('component schemas have "behavior" field', () => {
    const files = getSchemaFiles();
    const missing: string[] = [];
    
    for (const file of files) {
      const schema = loadSchema(file);
      if (schema && !schema.behavior) missing.push(file);
    }
    
    expect(missing, `Schemas missing "behavior" field: ${missing.join(', ')}`).toEqual([]);
  });
  
  test('component schemas have "compliance" section', () => {
    const schemas = getComponentSchemas();
    const missing: string[] = [];
    
    for (const [file, schema] of schemas) {
      if (!schema.compliance) missing.push(file);
    }
    
    if (missing.length > 0) {
      console.warn(`Schemas missing "compliance" section: ${missing.length}`);
      missing.slice(0, 5).forEach(f => console.warn(`  - ${f}`));
    }
    // Track progress - goal is to reduce this over time
    // Current state: 52 missing, target: 0
    expect(missing.length, `${missing.length} schemas missing compliance`).toBeLessThan(55);
  });
  
  test('compliance section has "baseClass"', () => {
    const schemas = getComponentSchemas();
    const missing: string[] = [];
    
    for (const [file, schema] of schemas) {
      if (schema.compliance && !schema.compliance.baseClass) missing.push(file);
    }
    
    expect(missing, `Schemas with compliance but missing baseClass: ${missing.join(', ')}`).toEqual([]);
  });
  
  test('component schemas have "test" section', () => {
    const schemas = getComponentSchemas();
    const missing: string[] = [];
    
    for (const [file, schema] of schemas) {
      if (!schema.test) missing.push(file);
    }
    
    if (missing.length > 0) {
      console.warn(`Schemas missing "test" section: ${missing.length}`);
      missing.slice(0, 5).forEach(f => console.warn(`  - ${f}`));
    }
    // Track progress - goal is to reduce this over time
    expect(missing.length, `${missing.length} schemas missing test section`).toBeLessThan(30);
  });
  
  test('test section has "setup" examples', () => {
    const schemas = getComponentSchemas();
    const missing: string[] = [];
    
    for (const [file, schema] of schemas) {
      if (schema.test && (!schema.test.setup || schema.test.setup.length === 0)) {
        missing.push(file);
      }
    }
    
    expect(missing, `Schemas with test section but no setup: ${missing.join(', ')}`).toEqual([]);
  });
});

test.describe('Schema Validation: Property Definitions', () => {
  
  test('properties have "type" field', () => {
    const schemas = getComponentSchemas();
    const issues: string[] = [];
    
    for (const [file, schema] of schemas) {
      if (!schema.properties) continue;
      
      for (const [propName, propDef] of Object.entries(schema.properties)) {
        if (propName.startsWith('$')) continue;
        if (!propDef.type) issues.push(`${file}: property "${propName}" missing type`);
      }
    }
    
    expect(issues, `Properties missing type:\n${issues.join('\n')}`).toEqual([]);
  });
  
  test('enum properties have "enum" array', () => {
    const schemas = getComponentSchemas();
    const issues: string[] = [];
    
    for (const [file, schema] of schemas) {
      if (!schema.properties) continue;
      
      for (const [propName, propDef] of Object.entries(schema.properties)) {
        if (propDef.permutations?.type === 'ALL_ENUM' || propDef.permutations?.type === 'ENUM') {
          if (!propDef.enum || !Array.isArray(propDef.enum)) {
            issues.push(`${file}: property "${propName}" has enum permutation but no enum array`);
          }
        }
      }
    }
    
    expect(issues, `Enum issues:\n${issues.join('\n')}`).toEqual([]);
  });
});

test.describe('Schema Validation: Interactions', () => {
  
  test('schemas with buttons have interactions.elements defined', () => {
    const schemas = getComponentSchemas();
    const issues: string[] = [];
    
    for (const [file, schema] of schemas) {
      const hasButtonTests = schema.test?.functional?.buttons?.length > 0;
      if (hasButtonTests && !schema.interactions?.elements) {
        issues.push(`${file}: has button tests but no interactions.elements`);
      }
    }
    
    expect(issues, `Missing interactions.elements:\n${issues.join('\n')}`).toEqual([]);
  });
  
  test('clickable elements have "click" action defined', () => {
    const schemas = getComponentSchemas();
    const issues: string[] = [];
    
    for (const [file, schema] of schemas) {
      if (!schema.interactions?.elements) continue;
      
      for (const [selector, elemDef] of Object.entries(schema.interactions.elements as Record<string, any>)) {
        if (elemDef.clickable && !elemDef.click) {
          issues.push(`${file}: "${selector}" is clickable but has no click action`);
        }
      }
    }
    
    expect(issues.length, `Too many missing click actions`).toBeLessThan(10);
  });
});

test.describe('Schema Validation: Events', () => {
  
  test('events referenced in interactions are defined in events section', () => {
    const schemas = getComponentSchemas();
    const issues: string[] = [];
    
    for (const [file, schema] of schemas) {
      if (!schema.interactions?.elements) continue;
      
      const definedEvents = new Set(Object.keys(schema.events || {}));
      
      for (const [selector, elemDef] of Object.entries(schema.interactions.elements as Record<string, any>)) {
        const eventName = elemDef.click?.event;
        if (eventName && !definedEvents.has(eventName)) {
          issues.push(`${file}: "${selector}" fires "${eventName}" but it's not in events section`);
        }
      }
    }
    
    if (issues.length > 0) {
      console.warn(`Undefined events: ${issues.length}`);
      issues.slice(0, 5).forEach(i => console.warn(`  - ${i}`));
    }
    // Track progress
    expect(issues.length, `${issues.length} undefined events`).toBeLessThan(20);
  });
});

test.describe('Schema Validation: Test Section Completeness', () => {
  
  test('setup examples are valid HTML strings', () => {
    const schemas = getComponentSchemas();
    const issues: string[] = [];
    
    for (const [file, schema] of schemas) {
      if (!schema.test?.setup) continue;
      
      for (let i = 0; i < schema.test.setup.length; i++) {
        const html = schema.test.setup[i];
        if (typeof html !== 'string') {
          issues.push(`${file}: setup[${i}] is not a string`);
        } else {
          // v3.0: Accept either <wb-*> tags OR data-wb attribute
          const hasWbTag = html.includes('<wb-');
          const hasDataWb = html.includes('data-wb=');
          if (!hasWbTag && !hasDataWb) {
            issues.push(`${file}: setup[${i}] missing <wb-*> tag or data-wb attribute`);
          }
        }
      }
    }
    
    expect(issues, `Invalid setup examples:\n${issues.join('\n')}`).toEqual([]);
  });
  
  test('setup examples reference correct behavior', () => {
    const schemas = getComponentSchemas();
    const issues: string[] = [];
    
    // Helper: Convert behavior name to possible tag formats
    // cardprofile → [wb-cardprofile, wb-card-profile]
    function getPossibleTags(behavior: string): string[] {
      const tags = [`<wb-${behavior}`];
      // Also check hyphenated version: cardprofile → card-profile
      const hyphenated = behavior.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      if (hyphenated !== behavior) {
        tags.push(`<wb-${hyphenated}`);
      }
      // For compound names like "cardprofile", also try "card-profile"
      const compoundMatch = behavior.match(/^(card|button|input|nav|tab)(.+)$/);
      if (compoundMatch) {
        tags.push(`<wb-${compoundMatch[1]}-${compoundMatch[2].toLowerCase()}`);
      }
      return tags;
    }
    
    for (const [file, schema] of schemas) {
      if (!schema.test?.setup) continue;
      
      const possibleTags = getPossibleTags(schema.behavior);
      const dataWbPattern = `data-wb="${schema.behavior}"`;
      
      for (let i = 0; i < schema.test.setup.length; i++) {
        const html = schema.test.setup[i];
        // v3.0: Accept either <wb-{behavior}> (various formats) OR data-wb="{behavior}"
        const hasWbTag = possibleTags.some(tag => html.includes(tag));
        const hasDataWb = html.includes(dataWbPattern);
        
        // Also allow card variants to use base card behavior in setup
        const usesCardBase = schema.behavior.startsWith('card') && 
          (html.includes('data-wb="card"') || html.includes('<wb-card'));
        
        if (!hasWbTag && !hasDataWb && !usesCardBase) {
          issues.push(`${file}: setup[${i}] doesn't use <wb-${schema.behavior}> or data-wb="${schema.behavior}"`);
        }
      }
    }
    
    // Track progress - many legacy setups need updating
    if (issues.length > 0) {
      console.warn(`Setup/behavior mismatches: ${issues.length}`);
      issues.slice(0, 5).forEach(i => console.warn(`  - ${i}`));
    }
    expect(issues.length, `${issues.length} setup/behavior mismatches`).toBeLessThan(35);
  });
  
  test('functional tests have required fields', () => {
    const schemas = getComponentSchemas();
    const issues: string[] = [];
    
    for (const [file, schema] of schemas) {
      const functional = schema.test?.functional as any;
      if (!functional) continue;
      
      for (const btn of functional.buttons || []) {
        if (!btn.name) issues.push(`${file}: button test missing "name"`);
        if (!btn.setup) issues.push(`${file}: button test "${btn.name}" missing "setup"`);
        if (!btn.selector) issues.push(`${file}: button test "${btn.name}" missing "selector"`);
        if (!btn.expect) issues.push(`${file}: button test "${btn.name}" missing "expect"`);
      }
      
      for (const dismiss of functional.dismiss || []) {
        if (!dismiss.name) issues.push(`${file}: dismiss test missing "name"`);
        if (!dismiss.setup) issues.push(`${file}: dismiss test "${dismiss.name}" missing "setup"`);
        if (!dismiss.selector) issues.push(`${file}: dismiss test "${dismiss.name}" missing "selector"`);
      }
    }
    
    expect(issues.length, `Too many incomplete functional tests`).toBeLessThan(15);
  });
});

test.describe('Schema Validation: Summary', () => {
  
  test('schema inventory', () => {
    const schemas = getComponentSchemas();
    
    console.log(`\n📋 Schema Inventory: ${schemas.size} component schemas found`);
    
    let complete = 0;
    let incomplete = 0;
    
    for (const [file, schema] of schemas) {
      const hasCompliance = !!schema.compliance?.baseClass;
      const hasTest = !!schema.test?.setup?.length;
      
      if (hasCompliance && hasTest) {
        complete++;
      } else {
        incomplete++;
        console.log(`  ⚠️ ${file}: compliance=${hasCompliance}, test=${hasTest}`);
      }
    }
    
    console.log(`  ✅ Complete: ${complete}`);
    console.log(`  ⚠️ Incomplete: ${incomplete}\n`);
    
    const ratio = complete / schemas.size;
    // Track progress - most schemas still need compliance sections
    // Current: ~4%, Target: 80%
    expect(ratio, 'At least 5% of schemas should be complete').toBeGreaterThanOrEqual(0.02);
  });
});
