/**
 * validate-schemas.mjs
 * Validates all component schemas against schema.schema.json
 * Usage: node scripts/validate-schemas.mjs [optional-schema-name]
 * 
 * Output: data/schema-validation.json
 */
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const modelsDir = join(process.cwd(), 'src', 'wb-models');
const metaSchemaPath = join(modelsDir, 'schema.schema.json');
const outputPath = join(process.cwd(), 'data', 'schema-validation.json');

// Load meta-schema
const metaSchema = JSON.parse(readFileSync(metaSchemaPath, 'utf8'));

// Get target schemas
const filter = process.argv[2];
const files = readdirSync(modelsDir)
  .filter(f => f.endsWith('.schema.json') && f !== 'schema.schema.json')
  .filter(f => !filter || f.includes(filter));

const results = {
  timestamp: new Date().toISOString(),
  total: files.length,
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

for (const file of files) {
  const filePath = join(modelsDir, file);
  let schema;
  try {
    schema = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (e) {
    results.errors.push({ file, error: `Parse error: ${e.message}` });
    results.failed++;
    continue;
  }

  const issues = validateSchema(schema, file);

  if (issues.length === 0) {
    results.passed++;
    results.details.push({ file, status: 'PASS', issues: [] });
  } else {
    results.failed++;
    results.details.push({ file, status: 'FAIL', issues });
  }
}

writeFileSync(outputPath, JSON.stringify(results, null, 2));

console.log(`\n=== Schema Validation Results ===`);
console.log(`Total: ${results.total}  Pass: ${results.passed}  Fail: ${results.failed}`);

if (results.failed > 0) {
  console.log(`\n--- Failures ---`);
  for (const d of results.details.filter(d => d.status === 'FAIL')) {
    console.log(`\n  ${d.file}:`);
    for (const issue of d.issues) {
      console.log(`    ❌ ${issue}`);
    }
  }
}

console.log(`\nFull results: ${outputPath}`);


/**
 * Validate a component schema against our rules.
 * We do this manually instead of using ajv because:
 *  1. No npm install needed
 *  2. Better error messages
 *  3. We can add custom rules beyond JSON Schema
 */
function validateSchema(schema, filename) {
  const issues = [];

  // --- Top-level required fields ---
  const topRequired = ['title', 'description', 'properties', '$view', '$methods'];
  for (const field of topRequired) {
    if (!(field in schema)) {
      issues.push(`Missing required top-level field: ${field}`);
    }
  }

  // Must have behavior or schemaFor
  if (!schema.behavior && !schema.schemaFor) {
    issues.push(`Missing 'behavior' or 'schemaFor' — at least one is required`);
  }

  // behavior/schemaFor must be kebab-case
  if (schema.behavior && !/^[a-z][a-z0-9-]*$/.test(schema.behavior)) {
    issues.push(`'behavior' must be kebab-case: got "${schema.behavior}"`);
  }
  if (schema.schemaFor && !/^[a-z][a-z0-9-]*$/.test(schema.schemaFor)) {
    issues.push(`'schemaFor' must be kebab-case: got "${schema.schemaFor}"`);
  }

  // baseClass must start with wb-
  if (schema.baseClass && !/^wb-[a-z][a-z0-9-]*$/.test(schema.baseClass)) {
    issues.push(`'baseClass' must match wb-*: got "${schema.baseClass}"`);
  }

  // --- Properties validation ---
  if (schema.properties && typeof schema.properties === 'object') {
    for (const [propName, prop] of Object.entries(schema.properties)) {
      if (typeof prop !== 'object' || prop === null) {
        issues.push(`Property "${propName}": must be an object`);
        continue;
      }

      // type is required
      if (!prop.type) {
        issues.push(`Property "${propName}": missing 'type'`);
      } else {
        const validTypes = ['string', 'boolean', 'number', 'integer', 'array', 'object'];
        if (!validTypes.includes(prop.type)) {
          issues.push(`Property "${propName}": invalid type "${prop.type}" (must be one of: ${validTypes.join(', ')})`);
        }
      }

      // default is required
      if (!('default' in prop)) {
        issues.push(`Property "${propName}": missing 'default' (every property MUST have a default)`);
      }

      // Type-check the default value
      if (prop.type && 'default' in prop) {
        const defaultVal = prop.default;
        if (prop.type === 'string' && typeof defaultVal !== 'string') {
          issues.push(`Property "${propName}": default must be a string, got ${typeof defaultVal}`);
        }
        if (prop.type === 'boolean' && typeof defaultVal !== 'boolean') {
          issues.push(`Property "${propName}": default must be a boolean, got ${typeof defaultVal}`);
        }
        if ((prop.type === 'number' || prop.type === 'integer') && typeof defaultVal !== 'number') {
          issues.push(`Property "${propName}": default must be a number, got ${typeof defaultVal}`);
        }
      }

      // enum must be a non-empty array
      if ('enum' in prop) {
        if (!Array.isArray(prop.enum) || prop.enum.length === 0) {
          issues.push(`Property "${propName}": 'enum' must be a non-empty array`);
        }
        // default must be in enum
        if (Array.isArray(prop.enum) && 'default' in prop && !prop.enum.includes(prop.default)) {
          issues.push(`Property "${propName}": default "${prop.default}" is not in enum [${prop.enum.join(', ')}]`);
        }
      }

      // minimum/maximum only on number/integer
      if (('minimum' in prop || 'maximum' in prop) && prop.type && !['number', 'integer'].includes(prop.type)) {
        issues.push(`Property "${propName}": minimum/maximum only valid on number/integer types, got "${prop.type}"`);
      }
      if ('minimum' in prop && typeof prop.minimum !== 'number') {
        issues.push(`Property "${propName}": 'minimum' must be a number`);
      }
      if ('maximum' in prop && typeof prop.maximum !== 'number') {
        issues.push(`Property "${propName}": 'maximum' must be a number`);
      }
      if ('minimum' in prop && 'maximum' in prop && prop.minimum > prop.maximum) {
        issues.push(`Property "${propName}": minimum (${prop.minimum}) > maximum (${prop.maximum})`);
      }
    }
  }

  // --- $view validation ---
  if (Array.isArray(schema.$view)) {
    for (let i = 0; i < schema.$view.length; i++) {
      const item = schema.$view[i];
      if (typeof item !== 'object' || item === null) {
        issues.push(`$view[${i}]: must be an object`);
        continue;
      }
      if (!item.name) {
        issues.push(`$view[${i}]: missing 'name'`);
      }
      if (!item.tag) {
        issues.push(`$view[${i}]: missing 'tag'`);
      }
      if (item.tag && !/^[a-z][a-z0-9-]*$/.test(item.tag)) {
        issues.push(`$view[${i}] (${item.name || '?'}): tag must be lowercase HTML, got "${item.tag}"`);
      }
    }
  }

  // --- $methods validation ---
  if (schema.$methods && typeof schema.$methods === 'object') {
    for (const [methodName, method] of Object.entries(schema.$methods)) {
      if (typeof method !== 'object' || method === null) {
        issues.push(`$methods.${methodName}: must be an object`);
        continue;
      }
      if (!method.description) {
        issues.push(`$methods.${methodName}: missing 'description'`);
      }
    }
  }

  // --- $cssAPI validation ---
  if (schema.$cssAPI && typeof schema.$cssAPI === 'object') {
    for (const [varName, cssVar] of Object.entries(schema.$cssAPI)) {
      if (!varName.startsWith('--')) {
        issues.push(`$cssAPI: "${varName}" must start with -- (CSS custom property)`);
      }
      if (typeof cssVar !== 'object' || cssVar === null) {
        issues.push(`$cssAPI.${varName}: must be an object`);
        continue;
      }
      if (!('default' in cssVar)) {
        issues.push(`$cssAPI.${varName}: missing 'default'`);
      }
      if (!cssVar.description) {
        issues.push(`$cssAPI.${varName}: missing 'description'`);
      }
    }
  }

  // --- test.matrix.combinations validation ---
  if (schema.test) {
    if (schema.test.matrix) {
      if (!schema.test.matrix.combinations) {
        issues.push(`test.matrix: missing 'combinations' array`);
      } else if (!Array.isArray(schema.test.matrix.combinations)) {
        issues.push(`test.matrix.combinations: must be an array`);
      } else if (schema.test.matrix.combinations.length === 0) {
        issues.push(`test.matrix.combinations: must have at least one combination`);
      } else {
        for (let i = 0; i < schema.test.matrix.combinations.length; i++) {
          const combo = schema.test.matrix.combinations[i];
          if (typeof combo !== 'object' || combo === null || Array.isArray(combo)) {
            issues.push(`test.matrix.combinations[${i}]: must be an object`);
          }
        }
      }
    }
  }

  return issues;
}
