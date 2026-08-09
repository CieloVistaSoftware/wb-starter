/**
 * WB Schema Test Generator
 * ========================
 * Automatically generates test cases from JSON Schema definitions.
 * 
 * Usage:
 *   node scripts/generate-schema-tests.js
 *   node scripts/generate-schema-tests.js card
 *   node scripts/generate-schema-tests.js --all
 * 
 * Output:
 *   data/schema-tests.json - All generated test cases
 *   tests/generated/*.spec.js - Playwright test files (optional)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MODELS_DIR = join(ROOT, 'src/wb-models');
const OUTPUT_FILE = join(ROOT, 'data/schema-tests.json');
const TESTS_DIR = join(ROOT, 'tests/generated');

// =============================================================================
// SCHEMA LOADING
// =============================================================================

function loadSchema(name) {
  const filename = name.endsWith('.schema.json') ? name : `${name}.schema.json`;
  const filepath = join(MODELS_DIR, filename);
  
  if (!existsSync(filepath)) {
    console.warn(`Schema not found: ${filepath}`);
    return null;
  }
  
  return JSON.parse(readFileSync(filepath, 'utf-8'));
}

function loadAllSchemas() {
  const files = readdirSync(MODELS_DIR).filter(f => f.endsWith('.schema.json'));
  const schemas = {};
  
  for (const file of files) {
    const schema = loadSchema(file);
    if (schema?.behavior) {
      schemas[schema.behavior] = schema;
    }
  }
  
  return schemas;
}

// =============================================================================
// TEST GENERATION
// =============================================================================

/**
 * Generate all test cases for a schema
 */
function generateTests(schema) {
  const behavior = schema.behavior;
  const baseClass = schema.baseClass || `wb-${behavior}`;
  const props = schema.properties || {};
  const containment = schema.$containment || [];
  
  const tests = {
    behavior,
    baseClass,
    tagName: `wb-${behavior.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`,
    cases: []
  };
  
  // 1. Base case - no props
  tests.cases.push({
    name: 'renders with no props',
    input: {},
    html: `<${tests.tagName}></${tests.tagName}>`,
    expect: {
      hasClass: [baseClass],
      children: getExpectedChildren(containment, {}, baseClass)
    }
  });
  
  // 2. Generate cases for each property
  for (const [propName, propDef] of Object.entries(props)) {
    const propTests = generatePropertyTests(propName, propDef, schema);
    tests.cases.push(...propTests);
  }
  
  // 3. Generate containment tests
  const containmentTests = generateContainmentTests(containment, props, schema);
  tests.cases.push(...containmentTests);
  
  // 4. Generate combination tests
  const comboTests = generateCombinationTests(props, containment, schema);
  tests.cases.push(...comboTests);
  
  return tests;
}

/**
 * Generate tests for a single property
 */
function generatePropertyTests(propName, propDef, schema) {
  const tests = [];
  const baseClass = schema.baseClass || `wb-${schema.behavior}`;
  const tagName = `wb-${schema.behavior.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`;
  
  // Skip internal properties
  if (propName.startsWith('_')) return tests;
  
  switch (propDef.type) {
    case 'string':
      // Test with value
      tests.push({
        name: `renders with ${propName}`,
        input: { [propName]: `Test ${propName}` },
        html: `<${tagName} ${propName}="Test ${propName}"></${tagName}>`,
        expect: {
          hasClass: [baseClass],
          containsText: `Test ${propName}`
        }
      });
      break;
      
    case 'boolean':
      // Test true
      tests.push({
        name: `applies ${propName} when true`,
        input: { [propName]: true },
        html: `<${tagName} ${propName}></${tagName}>`,
        expect: {
          hasClass: propDef.appliesClass ? [baseClass, propDef.appliesClass] : [baseClass]
        }
      });
      // Test false (should NOT have class)
      if (propDef.appliesClass) {
        tests.push({
          name: `does not apply ${propName} class when false`,
          input: { [propName]: false },
          html: `<${tagName}></${tagName}>`,
          expect: {
            hasClass: [baseClass],
            notHasClass: [propDef.appliesClass]
          }
        });
      }
      break;
  }
  
  // Enum tests
  if (propDef.enum) {
    for (const value of propDef.enum) {
      if (value === 'default') continue; // Skip default
      tests.push({
        name: `applies ${propName}="${value}" modifier`,
        input: { [propName]: value },
        html: `<${tagName} ${propName}="${value}"></${tagName}>`,
        expect: {
          hasClass: [baseClass, `${baseClass}--${value}`]
        }
      });
    }
  }
  
  return tests;
}

/**
 * Generate tests for $containment rules
 */
function generateContainmentTests(containment, props, schema) {
  const tests = [];
  const baseClass = schema.baseClass || `wb-${schema.behavior}`;
  const tagName = `wb-${schema.behavior.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`;
  
  for (const part of containment) {
    if (!part.createdWhen) continue;
    
    const partClass = `${baseClass}__${part.name}`;
    
    // Parse condition
    const conditions = parseCondition(part.createdWhen);
    
    // Test: condition NOT met → element should NOT exist
    tests.push({
      name: `${part.name} not created when ${part.createdWhen} is false`,
      input: {},
      html: `<${tagName}></${tagName}>`,
      expect: {
        notHasSelector: `.${partClass}`
      }
    });
    
    // Test: condition MET → element SHOULD exist
    const inputForCondition = buildInputForCondition(conditions, props);
    tests.push({
      name: `${part.name} created when ${part.createdWhen}`,
      input: inputForCondition,
      html: buildHtml(tagName, inputForCondition),
      expect: {
        hasSelector: `.${partClass}`,
        selectorTag: { [`.${partClass}`]: part.tag }
      }
    });
  }
  
  return tests;
}

/**
 * Generate combination tests (all props, typical combos)
 */
function generateCombinationTests(props, containment, schema) {
  const tests = [];
  const baseClass = schema.baseClass || `wb-${schema.behavior}`;
  const tagName = `wb-${schema.behavior.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`;
  
  // All string props filled
  const allStrings = {};
  for (const [name, def] of Object.entries(props)) {
    if (def.type === 'string' && !name.startsWith('_')) {
      allStrings[name] = `Test ${name}`;
    }
  }
  
  if (Object.keys(allStrings).length > 1) {
    tests.push({
      name: 'renders with all string props',
      input: allStrings,
      html: buildHtml(tagName, allStrings),
      expect: {
        hasClass: [baseClass],
        children: getExpectedChildren(containment, allStrings, baseClass)
      }
    });
  }
  
  // All boolean props true
  const allBooleans = {};
  const expectedClasses = [baseClass];
  for (const [name, def] of Object.entries(props)) {
    if (def.type === 'boolean' && !name.startsWith('_')) {
      allBooleans[name] = true;
      if (def.appliesClass) {
        expectedClasses.push(def.appliesClass);
      }
    }
  }
  
  if (Object.keys(allBooleans).length > 0) {
    tests.push({
      name: 'renders with all boolean props true',
      input: allBooleans,
      html: buildHtml(tagName, allBooleans),
      expect: {
        hasClass: expectedClasses
      }
    });
  }
  
  return tests;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function parseCondition(condition) {
  if (condition.includes(' OR ')) {
    return { type: 'OR', parts: condition.split(' OR ').map(s => s.trim()) };
  }
  if (condition.includes(' AND ')) {
    return { type: 'AND', parts: condition.split(' AND ').map(s => s.trim()) };
  }
  return { type: 'SINGLE', parts: [condition] };
}

function buildInputForCondition(conditions, props) {
  const input = {};
  
  // For OR, just need first one. For AND, need all.
  const partsNeeded = conditions.type === 'AND' ? conditions.parts : [conditions.parts[0]];
  
  for (const part of partsNeeded) {
    const propDef = props[part];
    if (propDef?.type === 'string') {
      input[part] = `Test ${part}`;
    } else if (propDef?.type === 'boolean') {
      input[part] = true;
    } else {
      input[part] = `Test ${part}`;
    }
  }
  
  return input;
}

function buildHtml(tagName, input) {
  const attrs = Object.entries(input)
    .map(([k, v]) => {
      if (v === true) return k;
      if (v === false) return '';
      return `${k}="${v}"`;
    })
    .filter(Boolean)
    .join(' ');
  
  return `<${tagName}${attrs ? ' ' + attrs : ''}></${tagName}>`;
}

function getExpectedChildren(containment, data, baseClass) {
  const children = [];
  
  for (const part of containment) {
    // Check if should be created
    if (part.required) {
      children.push({
        tag: part.tag,
        class: `${baseClass}__${part.name}`
      });
      continue;
    }
    
    if (part.createdWhen) {
      const conditions = parseCondition(part.createdWhen);
      let shouldCreate = false;
      
      if (conditions.type === 'OR') {
        shouldCreate = conditions.parts.some(p => data[p]);
      } else if (conditions.type === 'AND') {
        shouldCreate = conditions.parts.every(p => data[p]);
      } else {
        shouldCreate = !!data[conditions.parts[0]];
      }
      
      if (shouldCreate) {
        children.push({
          tag: part.tag,
          class: `${baseClass}__${part.name}`
        });
      }
    }
  }
  
  return children;
}

// =============================================================================
// OUTPUT GENERATORS
// =============================================================================

function generatePlaywrightTest(tests) {
  const { behavior, tagName, cases } = tests;
  
  return `/**
 * Auto-generated tests for ${behavior}
 * Generated from: src/wb-models/${behavior}.schema.json
 * 
 * DO NOT EDIT - Regenerate with: node scripts/generate-schema-tests.js ${behavior}
 */

import { test, expect } from '@playwright/test';

test.describe('${behavior} component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/src/core/mvvm-test.html');
    await page.waitForSelector('[data-testid="schema-ready"]', { timeout: 5000 }).catch(() => {});
  });

${cases.map(c => `
  test('${c.name}', async ({ page }) => {
    // Inject test element
    await page.evaluate((html) => {
      const container = document.createElement('div');
      container.innerHTML = html;
      document.body.appendChild(container);
    }, \`${c.html}\`);
    
    const el = await page.locator('${tagName}').last();
    
${generateExpectations(c.expect, tagName)}
  });
`).join('\n')}
});
`;
}

function generateExpectations(expect, tagName) {
  const lines = [];
  
  if (expect.hasClass) {
    for (const cls of expect.hasClass) {
      lines.push(`    await expect(el).toHaveClass(/${cls}/);`);
    }
  }
  
  if (expect.notHasClass) {
    for (const cls of expect.notHasClass) {
      lines.push(`    await expect(el).not.toHaveClass(/${cls}/);`);
    }
  }
  
  if (expect.hasSelector) {
    lines.push(`    await expect(el.locator('${expect.hasSelector}')).toBeVisible();`);
  }
  
  if (expect.notHasSelector) {
    lines.push(`    await expect(el.locator('${expect.notHasSelector}')).toHaveCount(0);`);
  }
  
  if (expect.containsText) {
    lines.push(`    await expect(el).toContainText('${expect.containsText}');`);
  }
  
  if (expect.selectorTag) {
    for (const [sel, tag] of Object.entries(expect.selectorTag)) {
      lines.push(`    const child = await el.locator('${sel}');`);
      lines.push(`    await expect(child).toHaveCount(1);`);
    }
  }
  
  return lines.join('\n');
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  const args = process.argv.slice(2);
  
  let schemas = {};
  
  if (args.includes('--all') || args.length === 0) {
    schemas = loadAllSchemas();
  } else {
    for (const name of args) {
      const schema = loadSchema(name);
      if (schema?.behavior) {
        schemas[schema.behavior] = schema;
      }
    }
  }
  
  const allTests = {};
  let totalCases = 0;
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log(' WB Schema Test Generator');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  for (const [behavior, schema] of Object.entries(schemas)) {
    // Skip base schemas and non-component schemas
    if (schema.isBase || !schema.$containment && !schema.properties) {
      continue;
    }
    
    const tests = generateTests(schema);
    allTests[behavior] = tests;
    totalCases += tests.cases.length;
    
    console.log(`✓ ${behavior}: ${tests.cases.length} test cases`);
  }
  
  // Ensure output directories exist
  if (!existsSync(join(ROOT, 'data'))) {
    mkdirSync(join(ROOT, 'data'));
  }
  
  // Write JSON output
  writeFileSync(OUTPUT_FILE, JSON.stringify(allTests, null, 2));
  console.log(`\n✓ Wrote ${OUTPUT_FILE}`);
  
  // Generate Playwright tests if --playwright flag
  if (args.includes('--playwright')) {
    if (!existsSync(TESTS_DIR)) {
      mkdirSync(TESTS_DIR, { recursive: true });
    }
    
    for (const [behavior, tests] of Object.entries(allTests)) {
      const playwrightCode = generatePlaywrightTest(tests);
      const testFile = join(TESTS_DIR, `${behavior}.spec.js`);
      writeFileSync(testFile, playwrightCode);
      console.log(`✓ Wrote ${testFile}`);
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(` Generated ${totalCases} test cases for ${Object.keys(allTests).length} schemas`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Print summary table
  console.log('Schema          | Tests | Properties | Containment');
  console.log('----------------|-------|------------|------------');
  for (const [behavior, tests] of Object.entries(allTests)) {
    const schema = schemas[behavior];
    const propCount = Object.keys(schema.properties || {}).length;
    const containCount = (schema.$containment || []).length;
    console.log(
      `${behavior.padEnd(15)} | ${String(tests.cases.length).padStart(5)} | ${String(propCount).padStart(10)} | ${String(containCount).padStart(10)}`
    );
  }
}

main();
