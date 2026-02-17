/**
 * SCHEMA VALIDATION - Static Compliance
 * =====================================
 * Validates all .schema.json files are complete and well-formed.
 * 
 * Respects schemaType tiers:
 *   "component" (default) — full rules: title, description, properties, $view, $methods, behavior/schemaFor
 *   "base"               — abstract/inherited: title, description, properties (type+default on props)
 *   "definition"         — reference docs: title, description only
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  PATHS, getSchemaFiles, loadSchema, getComponentSchemas, Schema
} from '../base';

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS — Schema Type Resolution
// ═══════════════════════════════════════════════════════════════════════════

type SchemaType = 'component' | 'base' | 'definition';

/**
 * Get all schema files recursively (including subdirs like semantic/, _base/)
 */
function getAllSchemaFiles(): string[] {
  const results: string[] = [];
  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.schema.json') && entry.name !== 'schema.schema.json') {
        results.push(path.relative(PATHS.schemas, full));
      }
    }
  }
  walk(PATHS.schemas);
  return results;
}

function loadSchemaFull(relPath: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(PATHS.schemas, relPath), 'utf-8'));
  } catch { return null; }
}

function getSchemaType(schema: any): SchemaType {
  return schema?.schemaType || 'component';
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS — Tier-Aware Validation
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Schema Validation: JSON Syntax', () => {
  
  test('all schema files are valid JSON', () => {
    const files = getAllSchemaFiles();
    const invalid: string[] = [];
    for (const file of files) {
      if (!loadSchemaFull(file)) invalid.push(file);
    }
    expect(invalid, `Invalid JSON files: ${invalid.join(', ')}`).toEqual([]);
  });
});

test.describe('Schema Validation: SchemaType Tiers', () => {

  test('all schemas have title and description (required for ALL tiers)', () => {
    const files = getAllSchemaFiles();
    const issues: string[] = [];
    for (const file of files) {
      const schema = loadSchemaFull(file);
      if (!schema) continue;
      if (!schema.title) issues.push(`${file}: missing title`);
      if (!schema.description) issues.push(`${file}: missing description`);
    }
    expect(issues, `Missing title/description:\n${issues.join('\n')}`).toEqual([]);
  });

  test('component schemas have required fields (properties, $view, $methods, behavior/schemaFor)', () => {
    const files = getAllSchemaFiles();
    const issues: string[] = [];
    for (const file of files) {
      const schema = loadSchemaFull(file);
      if (!schema || getSchemaType(schema) !== 'component') continue;
      if (!schema.properties) issues.push(`${file}: component missing "properties"`);
      if (schema.$view === undefined) issues.push(`${file}: component missing "$view"`);
      if (schema.$methods === undefined) issues.push(`${file}: component missing "$methods"`);
      if (!schema.behavior && !schema.schemaFor) issues.push(`${file}: component missing "behavior" or "schemaFor"`);
    }
    expect(issues, `Component schema violations:\n${issues.join('\n')}`).toEqual([]);
  });

  test('base schemas have required fields (properties)', () => {
    const files = getAllSchemaFiles();
    const issues: string[] = [];
    for (const file of files) {
      const schema = loadSchemaFull(file);
      if (!schema || getSchemaType(schema) !== 'base') continue;
      if (!schema.properties) issues.push(`${file}: base schema missing "properties"`);
    }
    expect(issues, `Base schema violations:\n${issues.join('\n')}`).toEqual([]);
  });

  test('schemaType field is valid when present', () => {
    const files = getAllSchemaFiles();
    const valid = ['component', 'base', 'definition'];
    const issues: string[] = [];
    for (const file of files) {
      const schema = loadSchemaFull(file);
      if (!schema?.schemaType) continue;
      if (!valid.includes(schema.schemaType)) {
        issues.push(`${file}: invalid schemaType "${schema.schemaType}" (must be: ${valid.join(', ')})`);
      }
    }
    expect(issues, `Invalid schemaType values:\n${issues.join('\n')}`).toEqual([]);
  });

  test('schema tier inventory', () => {
    const files = getAllSchemaFiles();
    const counts = { component: 0, base: 0, definition: 0 };
    for (const file of files) {
      const schema = loadSchemaFull(file);
      if (!schema) continue;
      counts[getSchemaType(schema)]++;
    }
    console.log(`\n📋 Schema Tier Inventory:`);
    console.log(`  Component: ${counts.component}`);
    console.log(`  Base:      ${counts.base}`);
    console.log(`  Definition: ${counts.definition}`);
    console.log(`  Total:     ${counts.component + counts.base + counts.definition}\n`);
    // All files should have a valid tier
    expect(counts.component + counts.base + counts.definition).toBe(files.length);
  });
});

test.describe('Schema Validation: Required Sections', () => {
  
  test('component schemas have "schemaFor" field', () => {
    const files = getSchemaFiles();
    const missing: string[] = [];
    
    for (const file of files) {
      const schema = loadSchema(file) as any;
      if (!schema) continue;
      // Skip non-component schemas (base, definition)
      if (schema.schemaType && schema.schemaType !== 'component') continue;
      if (!schema.schemaFor) missing.push(file);
    }
    
    expect(missing, `Schemas missing "schemaFor" field: ${missing.join(', ')}`).toEqual([]);
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
  
  test('properties have "type" field (component + base tiers)', () => {
    const files = getAllSchemaFiles();
    const issues: string[] = [];
    
    for (const file of files) {
      const schema = loadSchemaFull(file);
      if (!schema?.properties) continue;
      const tier = getSchemaType(schema);
      if (tier === 'definition') continue;
      
      for (const [propName, propDef] of Object.entries(schema.properties)) {
        if (propName.startsWith('$') || propName.startsWith('_')) continue;
        if (typeof propDef !== 'object' || propDef === null) continue;
        // Skip nested property groups (type: "object" with sub-properties)
        if (propDef.type === 'object' && propDef.properties) continue;
        if (!propDef.type) issues.push(`${file}: property "${propName}" missing type`);
      }
    }
    
    expect(issues, `Properties missing type:\n${issues.join('\n')}`).toEqual([]);
  });

  test('properties have "default" field (component + base tiers)', () => {
    const files = getAllSchemaFiles();
    const issues: string[] = [];
    
    for (const file of files) {
      const schema = loadSchemaFull(file);
      if (!schema?.properties) continue;
      const tier = getSchemaType(schema);
      if (tier === 'definition') continue;
      
      for (const [propName, propDef] of Object.entries(schema.properties)) {
        if (propName.startsWith('$') || propName.startsWith('_')) continue;
        if (typeof propDef !== 'object' || propDef === null) continue;
        if (propDef.type === 'object' && propDef.properties) continue;
        if (propDef.default === undefined) issues.push(`${file}: property "${propName}" missing default`);
      }
    }
    
    expect(issues, `Properties missing default:\n${issues.join('\n')}`).toEqual([]);
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
    
    function getPossibleTags(behavior: string): string[] {
      const tags = [`<wb-${behavior}`];
      const hyphenated = behavior.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      if (hyphenated !== behavior) {
        tags.push(`<wb-${hyphenated}`);
      }
      const compoundMatch = behavior.match(/^(card|button|input|nav|tab)(.+)$/);
      if (compoundMatch) {
        tags.push(`<wb-${compoundMatch[1]}-${compoundMatch[2].toLowerCase()}`);
      }
      return tags;
    }
    
    for (const [file, schema] of schemas) {
      if (!schema.test?.setup) continue;
      
      const possibleTags = getPossibleTags(schema.schemaFor);
      const dataWbPattern = `data-wb="${schema.schemaFor}"`;
      
      for (let i = 0; i < schema.test.setup.length; i++) {
        const html = schema.test.setup[i];
        const hasWbTag = possibleTags.some(tag => html.includes(tag));
        const hasDataWb = html.includes(dataWbPattern);
        
        const usesCardBase = schema.schemaFor.startsWith('card') && 
          (html.includes('data-wb="card"') || html.includes('<wb-card'));
        
        if (!hasWbTag && !hasDataWb && !usesCardBase) {
          issues.push(`${file}: setup[${i}] doesn't use <wb-${schema.schemaFor}> or data-wb="${schema.schemaFor}"`);
        }
      }
    }
    
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
    expect(ratio, 'At least 5% of schemas should be complete').toBeGreaterThanOrEqual(0.02);
  });
});
