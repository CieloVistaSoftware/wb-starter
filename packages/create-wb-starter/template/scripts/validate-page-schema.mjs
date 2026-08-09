/**
 * Page Schema Validator
 * =====================
 * Cross-references every attribute in a .page.json demo against
 * the component's .schema.json properties.
 *
 * Catches:
 *   - Invalid/typo attrs (attr not in component schema properties)
 *   - Missing required attrs
 *   - Invalid enum values
 *   - Unknown component tags (no matching schema)
 *   - Boolean attrs used on non-boolean properties
 *
 * Usage:
 *   node scripts/validate-page-schema.mjs <page-schema-path>
 *   node scripts/validate-page-schema.mjs --all
 *
 * Output: data/page-schema-validation.json
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join, basename } from 'path';

const MODELS_DIR = resolve('src/wb-models');
const PAGES_DIR = resolve('src/wb-models/pages');
const OUTPUT_FILE = resolve('data/page-schema-validation.json');

// ─── Load all component schemas into a map: behaviorName → schema ───

function loadComponentSchemas() {
  const map = new Map();
  const files = readdirSync(MODELS_DIR).filter(f => f.endsWith('.schema.json'));

  for (const file of files) {
    try {
      const schema = JSON.parse(readFileSync(join(MODELS_DIR, file), 'utf-8'));
      if (schema.schemaFor) {
        map.set(schema.schemaFor, schema);
      }
    } catch {
      // skip invalid JSON
    }
  }
  return map;
}

// ─── Resolve tag name to behavior name ───
// wb-cardprofile → cardprofile
// wb-card → card

function tagToBehavior(tag) {
  if (!tag) return null;
  const lower = tag.toLowerCase();
  if (lower.startsWith('wb-')) {
    return lower.slice(3);
  }
  return lower;
}

// ─── Collect all properties including inherited ───

function getAllProperties(schema, componentSchemas) {
  const props = { ...(schema.properties || {}) };

  // Check for $extends / inheritance
  if (schema.$extends) {
    const parentFile = schema.$extends;
    const parentPath = join(MODELS_DIR, parentFile);
    if (existsSync(parentPath)) {
      try {
        const parent = JSON.parse(readFileSync(parentPath, 'utf-8'));
        const parentProps = getAllProperties(parent, componentSchemas);
        // Parent props are inherited, child overrides
        for (const [key, val] of Object.entries(parentProps)) {
          if (!(key in props)) {
            props[key] = val;
          }
        }
      } catch {
        // skip
      }
    }
  }

  return props;
}

// ─── Validate a single demo entry ───

function validateDemo(demo, sectionIndex, demoIndex, componentSchemas) {
  const errors = [];
  const warnings = [];
  const tag = demo.tag;
  const behavior = tagToBehavior(tag);
  const location = `section[${sectionIndex}].demos[${demoIndex}] (${tag})`;

  if (!behavior) {
    errors.push({ location, type: 'NO_TAG', message: `Demo has no tag` });
    return { errors, warnings };
  }

  // Find component schema
  const schema = componentSchemas.get(behavior);
  if (!schema) {
    // Try without hyphens: card-profile → cardprofile
    const dehyphenated = behavior.replace(/-/g, '');
    const altSchema = componentSchemas.get(dehyphenated);
    if (!altSchema) {
      warnings.push({ location, type: 'NO_SCHEMA', message: `No schema found for "${behavior}"` });
      return { errors, warnings };
    }
    // Use the dehyphenated match
    return validateDemoAttrs(demo, altSchema, location, componentSchemas);
  }

  return validateDemoAttrs(demo, schema, location, componentSchemas);
}

function validateDemoAttrs(demo, schema, location, componentSchemas) {
  const errors = [];
  const warnings = [];
  const attrs = demo.attrs || {};
  const allProps = getAllProperties(schema, componentSchemas);

  // Convert hyphenated attr to camelCase: trend-value → trendValue
  function hyphenToCamel(str) {
    return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  }

  // Known global HTML attrs that are always valid
  const globalAttrs = new Set([
    'id', 'class', 'style', 'title', 'tabindex', 'hidden', 'lang', 'dir',
    'slot', 'part', 'role', 'aria-label', 'aria-labelledby', 'aria-describedby',
    'aria-hidden', 'aria-live', 'aria-expanded', 'aria-controls', 'aria-selected'
  ]);

  // 1. Check for invalid/unknown attrs
  for (const [attrName, attrValue] of Object.entries(attrs)) {
    if (attrName.startsWith('$')) continue; // meta keys
    if (globalAttrs.has(attrName)) continue;
    if (attrName.startsWith('aria-')) continue;

    // Try exact match first, then camelCase conversion
    let propDef = allProps[attrName];
    let resolvedName = attrName;
    if (!propDef && attrName.includes('-')) {
      const camelName = hyphenToCamel(attrName);
      propDef = allProps[camelName];
      if (propDef) resolvedName = camelName;
    }
    if (!propDef) {
      errors.push({
        location,
        type: 'UNKNOWN_ATTR',
        attr: attrName,
        value: attrValue,
        message: `Attribute "${attrName}" not found in ${schema.schemaFor} schema properties`,
        availableProps: Object.keys(allProps).sort()
      });
      continue;
    }

    // 2. Enum validation
    if (propDef.enum && Array.isArray(propDef.enum)) {
      const strValue = String(attrValue);
      if (!propDef.enum.includes(strValue) && attrValue !== true && attrValue !== false) {
        errors.push({
          location,
          type: 'INVALID_ENUM',
          attr: attrName,
          value: attrValue,
          message: `"${attrValue}" is not a valid value for "${attrName}". Allowed: [${propDef.enum.join(', ')}]`,
          allowed: propDef.enum
        });
      }
    }

    // 3. Boolean attr used on non-boolean property
    if (attrValue === true && propDef.type !== 'boolean') {
      warnings.push({
        location,
        type: 'BOOL_ON_NON_BOOL',
        attr: attrName,
        message: `Boolean attr "${attrName}" used but schema type is "${propDef.type}"`
      });
    }
  }

  // 4. Missing required attrs
  for (const [propName, propDef] of Object.entries(allProps)) {
    if (propName.startsWith('$')) continue;
    if (propDef.required === true && !(propName in attrs)) {
      // Only warn — children content might supply it
      warnings.push({
        location,
        type: 'MISSING_REQUIRED',
        attr: propName,
        message: `Required property "${propName}" not set (default: ${JSON.stringify(propDef.default)})`
      });
    }
  }

  return { errors, warnings };
}

// ─── Validate a full page schema ───

function validatePageSchema(pageSchemaPath, componentSchemas) {
  const raw = readFileSync(resolve(pageSchemaPath), 'utf-8');
  const pageSchema = JSON.parse(raw);

  const result = {
    file: pageSchemaPath,
    title: pageSchema.title || basename(pageSchemaPath),
    sections: pageSchema.sections?.length || 0,
    totalDemos: 0,
    errors: [],
    warnings: [],
    valid: true
  };

  if (!pageSchema.sections) {
    result.warnings.push({ type: 'NO_SECTIONS', message: 'Page schema has no sections array' });
    return result;
  }

  for (let si = 0; si < pageSchema.sections.length; si++) {
    const section = pageSchema.sections[si];
    if (!section.demos) continue;

    for (let di = 0; di < section.demos.length; di++) {
      result.totalDemos++;
      const { errors, warnings } = validateDemo(section.demos[di], si, di, componentSchemas);
      result.errors.push(...errors);
      result.warnings.push(...warnings);
    }
  }

  result.valid = result.errors.length === 0;
  return result;
}

// ─── Main ───

const arg = process.argv[2];

if (!arg) {
  console.error('Usage:');
  console.error('  node scripts/validate-page-schema.mjs <path-to-page.json>');
  console.error('  node scripts/validate-page-schema.mjs --all');
  process.exit(1);
}

const componentSchemas = loadComponentSchemas();
console.log(`📦 Loaded ${componentSchemas.size} component schemas`);

let results = [];

if (arg === '--all') {
  // Validate all page schemas
  if (existsSync(PAGES_DIR)) {
    const pageFiles = readdirSync(PAGES_DIR).filter(f => f.endsWith('.page.json'));
    for (const file of pageFiles) {
      const fullPath = join(PAGES_DIR, file);
      results.push(validatePageSchema(fullPath, componentSchemas));
    }
  }
} else {
  results.push(validatePageSchema(arg, componentSchemas));
}

// Output
const output = {
  validated: new Date().toISOString(),
  componentSchemasLoaded: componentSchemas.size,
  pagesValidated: results.length,
  totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
  totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
  allValid: results.every(r => r.valid),
  results
};

writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

// Console report
console.log('');
for (const r of results) {
  const status = r.valid ? '✅' : '❌';
  console.log(`${status} ${r.file}`);
  console.log(`   Sections: ${r.sections} | Demos: ${r.totalDemos} | Errors: ${r.errors.length} | Warnings: ${r.warnings.length}`);

  if (r.errors.length > 0) {
    console.log('   ERRORS:');
    for (const e of r.errors) {
      console.log(`     ❌ [${e.type}] ${e.message}`);
      if (e.attr) console.log(`        attr="${e.attr}" value=${JSON.stringify(e.value)}`);
    }
  }

  if (r.warnings.length > 0) {
    console.log('   WARNINGS:');
    for (const w of r.warnings) {
      console.log(`     ⚠️  [${w.type}] ${w.message}`);
    }
  }
  console.log('');
}

console.log(`══════════════════════════════════════`);
console.log(`  Pages: ${results.length} | Errors: ${output.totalErrors} | Warnings: ${output.totalWarnings}`);
console.log(`  Result: ${output.allValid ? '✅ ALL VALID' : '❌ ERRORS FOUND'}`);
console.log(`══════════════════════════════════════`);
console.log(`  Output: ${OUTPUT_FILE}`);
