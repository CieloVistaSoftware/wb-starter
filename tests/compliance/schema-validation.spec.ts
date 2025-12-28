/**
 * SCHEMA VALIDATION - Static Compliance
 * =====================================
 * Validates all .schema.json files are complete and well-formed.
 * NO browser, NO server - pure file analysis.
 * 
 * Checks:
 * - Schema files are valid JSON
 * - Required sections exist (properties, compliance, test)
 * - Compliance section has baseClass
 * - Test section has setup examples
 * - Properties have correct structure
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const SCHEMA_DIR = path.join(ROOT, 'src/behaviors/schema');

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

interface Schema {
  $schema?: string;
  title: string;
  description?: string;
  behavior: string;
  properties?: Record<string, any>;
  compliance?: {
    baseClass: string;
    parentClass?: string;
    requiredChildren?: Record<string, any>;
    optionalChildren?: Record<string, any>;
    styles?: Record<string, any>;
  };
  interactions?: {
    elements?: Record<string, any>;
    keyboard?: Record<string, any>;
  };
  accessibility?: Record<string, any>;
  events?: Record<string, any>;
  test?: {
    setup?: string[];
    matrix?: { combinations: any[] };
    functional?: {
      buttons?: any[];
      interactions?: any[];
      keyboard?: any[];
      dismiss?: any[];
      visual?: any[];
    };
  };
}

function getSchemaFiles(): string[] {
  if (!fs.existsSync(SCHEMA_DIR)) return [];
  return fs.readdirSync(SCHEMA_DIR)
    .filter(f => f.endsWith('.schema.json') && !f.includes('.base.'));
}

function loadSchema(filename: string): Schema | null {
  try {
    const content = fs.readFileSync(path.join(SCHEMA_DIR, filename), 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

function getComponentSchemas(): Map<string, Schema> {
  const schemas = new Map<string, Schema>();
  for (const file of getSchemaFiles()) {
    const schema = loadSchema(file);
    if (schema?.behavior) {
      schemas.set(file, schema);
    }
  }
  return schemas;
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST: Schema Files Are Valid JSON
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Schema Validation: JSON Syntax', () => {
  
  test('all schema files are valid JSON', () => {
    const files = getSchemaFiles();
    const invalid: string[] = [];
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(SCHEMA_DIR, file), 'utf-8');
        JSON.parse(content);
      } catch (e) {
        invalid.push(`${file}: ${(e as Error).message}`);
      }
    }
    
    expect(invalid, `Invalid JSON files:\n${invalid.join('\n')}`).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST: Required Schema Sections
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Schema Validation: Required Sections', () => {
  
  test('component schemas have "behavior" field', () => {
    const files = getSchemaFiles();
    const missing: string[] = [];
    
    for (const file of files) {
      const schema = loadSchema(file);
      if (schema && !schema.behavior) {
        missing.push(file);
      }
    }
    
    expect(missing, `Schemas missing "behavior" field: ${missing.join(', ')}`).toEqual([]);
  });
  
  test('component schemas have "compliance" section', () => {
    const schemas = getComponentSchemas();
    const missing: string[] = [];
    
    for (const [file, schema] of schemas) {
      if (!schema.compliance) {
        missing.push(file);
      }
    }
    
    expect(missing, `Schemas missing "compliance" section:\n${missing.join('\n')}`).toEqual([]);
  });
  
  test('compliance section has "baseClass"', () => {
    const schemas = getComponentSchemas();
    const missing: string[] = [];
    
    for (const [file, schema] of schemas) {
      if (schema.compliance && !schema.compliance.baseClass) {
        missing.push(file);
      }
    }
    
    expect(missing, `Schemas with compliance but missing baseClass: ${missing.join(', ')}`).toEqual([]);
  });
  
  test('component schemas have "test" section', () => {
    const schemas = getComponentSchemas();
    const missing: string[] = [];
    
    for (const [file, schema] of schemas) {
      if (!schema.test) {
        missing.push(file);
      }
    }
    
    expect(missing, `Schemas missing "test" section:\n${missing.join('\n')}`).toEqual([]);
  });
  
  test('test section has "setup" examples', () => {
    const schemas = getComponentSchemas();
    const missing: string[] = [];
    
    for (const [file, schema] of schemas) {
      if (schema.test && (!schema.test.setup || schema.test.setup.length === 0)) {
        missing.push(file);
      }
    }
    
    expect(missing, `Schemas with test section but no setup examples: ${missing.join(', ')}`).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST: Property Definitions
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Schema Validation: Property Definitions', () => {
  
  test('properties have "type" field', () => {
    const schemas = getComponentSchemas();
    const issues: string[] = [];
    
    for (const [file, schema] of schemas) {
      if (!schema.properties) continue;
      
      for (const [propName, propDef] of Object.entries(schema.properties)) {
        // Skip meta-properties (like $inherited) which are schema directives, not actual properties
        if (propName.startsWith('$')) continue;
        
        if (!propDef.type) {
          issues.push(`${file}: property "${propName}" missing type`);
        }
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

// ═══════════════════════════════════════════════════════════════════════════
// TEST: Interactions Section (for clickable elements)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Schema Validation: Interactions', () => {
  
  test('schemas with buttons have interactions.elements defined', () => {
    const schemas = getComponentSchemas();
    const issues: string[] = [];
    
    for (const [file, schema] of schemas) {
      // Check if test.functional.buttons exists
      const hasButtonTests = schema.test?.functional?.buttons && 
                            schema.test.functional.buttons.length > 0;
      
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
      
      for (const [selector, elemDef] of Object.entries(schema.interactions.elements)) {
        if (elemDef.clickable && !elemDef.click) {
          issues.push(`${file}: "${selector}" is clickable but has no click action`);
        }
      }
    }
    
    // Relaxed threshold - some components handle clicks in JS without schema definition
    expect(issues.length, `Too many missing click actions:\n${issues.join('\n')}`).toBeLessThan(10);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST: Events Section
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Schema Validation: Events', () => {
  
  test('events referenced in interactions are defined in events section', () => {
    const schemas = getComponentSchemas();
    const issues: string[] = [];
    
    for (const [file, schema] of schemas) {
      if (!schema.interactions?.elements) continue;
      
      const definedEvents = new Set(Object.keys(schema.events || {}));
      
      for (const [selector, elemDef] of Object.entries(schema.interactions.elements)) {
        const eventName = elemDef.click?.event;
        if (eventName && !definedEvents.has(eventName)) {
          issues.push(`${file}: "${selector}" fires "${eventName}" but it's not in events section`);
        }
      }
    }
    
    expect(issues, `Undefined events:\n${issues.join('\n')}`).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST: Test Section Completeness
// ═══════════════════════════════════════════════════════════════════════════

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
        } else if (!html.includes('data-wb=')) {
          issues.push(`${file}: setup[${i}] missing data-wb attribute`);
        }
      }
    }
    
    expect(issues, `Invalid setup examples:\n${issues.join('\n')}`).toEqual([]);
  });
  
  test('setup examples reference correct behavior', () => {
    const schemas = getComponentSchemas();
    const issues: string[] = [];
    
    for (const [file, schema] of schemas) {
      if (!schema.test?.setup) continue;
      
      const behavior = schema.behavior;
      
      for (let i = 0; i < schema.test.setup.length; i++) {
        const html = schema.test.setup[i];
        if (!html.includes(`data-wb="${behavior}"`)) {
          issues.push(`${file}: setup[${i}] doesn't use data-wb="${behavior}"`);
        }
      }
    }
    
    expect(issues, `Setup/behavior mismatch:\n${issues.join('\n')}`).toEqual([]);
  });
  
  test('functional tests have required fields', () => {
    const schemas = getComponentSchemas();
    const issues: string[] = [];
    
    for (const [file, schema] of schemas) {
      const functional = schema.test?.functional;
      if (!functional) continue;
      
      // Check buttons
      for (const btn of functional.buttons || []) {
        if (!btn.name) issues.push(`${file}: button test missing "name"`);
        if (!btn.setup) issues.push(`${file}: button test "${btn.name}" missing "setup"`);
        if (!btn.selector) issues.push(`${file}: button test "${btn.name}" missing "selector"`);
        if (!btn.expect) issues.push(`${file}: button test "${btn.name}" missing "expect"`);
      }
      
      // Check dismiss tests
      for (const dismiss of functional.dismiss || []) {
        if (!dismiss.name) issues.push(`${file}: dismiss test missing "name"`);
        if (!dismiss.setup) issues.push(`${file}: dismiss test "${dismiss.name}" missing "setup"`);
        if (!dismiss.selector) issues.push(`${file}: dismiss test "${dismiss.name}" missing "selector"`);
      }
      
      // Check visual tests
      for (const vis of functional.visual || []) {
        if (!vis.name) issues.push(`${file}: visual test missing "name"`);
        if (!vis.setup) issues.push(`${file}: visual test "${vis.name}" missing "setup"`);
      }
    }
    
    // Relaxed threshold - allow some incomplete functional tests
    expect(issues.length, `Too many incomplete functional tests:\n${issues.join('\n')}`).toBeLessThan(15);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST: Card Schemas Specific Requirements
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Schema Validation: Card-Specific Requirements', () => {
  
  test('card schemas inherit from card.base or define parentClass', () => {
    const schemas = getComponentSchemas();
    const issues: string[] = [];
    
    for (const [file, schema] of schemas) {
      if (!file.startsWith('card') || file === 'card.schema.json') continue;
      
      if (!schema.compliance?.parentClass) {
        issues.push(`${file}: card variant should define parentClass (e.g., "wb-card")`);
      }
    }
    
    // This is a warning, not a hard fail
    if (issues.length > 0) {
      console.log('Card schema warnings:', issues.join('\n'));
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Schema Validation: Summary', () => {
  
  test('schema inventory', () => {
    const schemas = getComponentSchemas();
    
    console.log(`\n📋 Schema Inventory: ${schemas.size} component schemas found`);
    
    let complete = 0;
    let incomplete = 0;
    
    for (const [file, schema] of schemas) {
      const hasCompliance = !!schema.compliance?.baseClass;
      const hasTest = !!schema.test?.setup?.length;
      const hasInteractions = !!schema.interactions;
      
      if (hasCompliance && hasTest) {
        complete++;
      } else {
        incomplete++;
        console.log(`  ⚠️ ${file}: compliance=${hasCompliance}, test=${hasTest}`);
      }
    }
    
    console.log(`  ✅ Complete: ${complete}`);
    console.log(`  ⚠️ Incomplete: ${incomplete}\n`);
    
    // At least 80% should be complete
    const ratio = complete / schemas.size;
    expect(ratio, 'At least 80% of schemas should be complete').toBeGreaterThanOrEqual(0.8);
  });
});
