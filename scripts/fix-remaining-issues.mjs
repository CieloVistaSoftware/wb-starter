/**
 * fix-remaining-issues.mjs
 * Fixes enum mismatches (adds "" to enums where default is "")
 * Fixes $cssAPI entries missing 'default' or 'description'
 * Fixes specific structural issues
 * 
 * Output: data/fix-remaining-report.json
 */
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const modelsDir = join(process.cwd(), 'src', 'wb-models');
const outputPath = join(process.cwd(), 'data', 'fix-remaining-report.json');

const files = readdirSync(modelsDir)
  .filter(f => f.endsWith('.schema.json') && f !== 'schema.schema.json');

const report = { timestamp: new Date().toISOString(), fixes: [] };

for (const file of files) {
  const filePath = join(modelsDir, file);
  let schema;
  try {
    schema = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (e) { continue; }

  let modified = false;

  // --- Fix 1: Enum default mismatches ---
  // If default is "" and "" is not in enum, add "" to front of enum
  if (schema.properties) {
    for (const [name, prop] of Object.entries(schema.properties)) {
      if (prop && Array.isArray(prop.enum) && 'default' in prop) {
        if (!prop.enum.includes(prop.default)) {
          if (prop.default === "") {
            // Add "" to front of enum
            prop.enum.unshift("");
            report.fixes.push({ file, type: 'enum_add_empty', property: name });
            modified = true;
          } else if (prop.default === "default" && !prop.enum.includes("default")) {
            // Add "default" to front of enum
            prop.enum.unshift("default");
            report.fixes.push({ file, type: 'enum_add_default', property: name });
            modified = true;
          }
        }
      }
    }
  }

  // --- Fix 2: $cssAPI entries missing defaults ---
  if (schema.$cssAPI) {
    const badKeys = [];
    for (const [varName, entry] of Object.entries(schema.$cssAPI)) {
      if (!varName.startsWith('--')) {
        badKeys.push(varName);
        continue;
      }
      if (typeof entry === 'object' && entry !== null) {
        if (!('default' in entry)) {
          entry.default = 'inherit';
          report.fixes.push({ file, type: 'cssapi_add_default', variable: varName });
          modified = true;
        }
        if (!entry.description) {
          entry.description = varName.replace(/^--wb-[a-z]+-/, '').replace(/-/g, ' ');
          report.fixes.push({ file, type: 'cssapi_add_description', variable: varName });
          modified = true;
        }
      }
    }
    // Fix non-standard keys (vars, parts) -> remove and note
    for (const key of badKeys) {
      report.fixes.push({ file, type: 'cssapi_invalid_key', key, action: 'removed' });
      delete schema.$cssAPI[key];
      modified = true;
    }
  }

  // --- Fix 3: hero variant default should be "default" not "" ---
  if (file === 'hero.schema.json' && schema.properties?.variant) {
    const v = schema.properties.variant;
    if (v.enum && v.enum.includes('default') && v.default === '') {
      v.default = 'default';
      report.fixes.push({ file, type: 'fix_default_value', property: 'variant', from: '', to: 'default' });
      modified = true;
    }
  }

  // --- Fix 4: span variant — add "default" to enum ---
  if (file === 'span.schema.json' && schema.properties?.variant) {
    const v = schema.properties.variant;
    if (v.enum && !v.enum.includes('default') && v.default === 'default') {
      v.enum.unshift('default');
      report.fixes.push({ file, type: 'enum_add_default', property: 'variant' });
      modified = true;
    }
  }

  // --- Fix 5: drawerLayout schemaFor camelCase -> kebab ---
  if (file === 'drawerLayout.schema.json' && schema.schemaFor === 'drawerLayout') {
    schema.schemaFor = 'drawer-layout';
    report.fixes.push({ file, type: 'fix_kebab_case', field: 'schemaFor', from: 'drawerLayout', to: 'drawer-layout' });
    modified = true;
  }

  // --- Fix 6: behaviors.schema.json — properties missing type ---
  if (file === 'behaviors.schema.json' && schema.properties) {
    for (const [name, prop] of Object.entries(schema.properties)) {
      if (prop && !prop.type) {
        prop.type = 'string';
        report.fixes.push({ file, type: 'add_missing_type', property: name });
        modified = true;
      }
      if (prop && !('default' in prop)) {
        prop.default = '';
        report.fixes.push({ file, type: 'add_missing_default', property: name });
        modified = true;
      }
    }
  }

  // --- Fix 7: card.base.schema.json — defaults are objects, should be strings ---
  if (file === 'card.base.schema.json' && schema.properties) {
    for (const [name, prop] of Object.entries(schema.properties)) {
      if (prop && prop.type === 'string' && typeof prop.default === 'object') {
        prop.default = '';
        report.fixes.push({ file, type: 'fix_default_type', property: name, from: 'object', to: '""' });
        modified = true;
      }
    }
  }

  if (modified) {
    writeFileSync(filePath, JSON.stringify(schema, null, 2) + '\n');
  }
}

writeFileSync(outputPath, JSON.stringify(report, null, 2));

console.log(`\n=== Remaining Fixes Report ===`);
console.log(`Total fixes: ${report.fixes.length}`);
for (const fix of report.fixes) {
  const detail = fix.property || fix.variable || fix.key || fix.field || '';
  console.log(`  ${fix.file}: ${fix.type} ${detail}`);
}
console.log(`\nFull report: ${outputPath}`);
