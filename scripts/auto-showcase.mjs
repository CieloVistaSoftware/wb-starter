/**
 * Auto-Showcase Generator
 * =======================
 * Reads a component .schema.json and automatically generates a .page.json
 * showcase demonstrating all variants, then generates the HTML page.
 *
 * Data sources (priority order):
 *   1. test.matrix.combinations — real-world usage combos
 *   2. Enum properties — one demo per enum value
 *   3. Boolean properties — show toggled on
 *   4. Constructed defaults from property definitions
 *
 * Usage:
 *   node scripts/auto-showcase.mjs <component-schema>
 *   node scripts/auto-showcase.mjs cardnotification
 *   node scripts/auto-showcase.mjs src/wb-models/badge.schema.json
 *   node scripts/auto-showcase.mjs --list   (show all available components)
 *
 * Output:
 *   src/wb-models/pages/{name}-showcase.page.json
 *   demos/{name}-showcase.html
 *   data/auto-showcase-result.json
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join, basename } from 'path';
import { execSync } from 'child_process';

const MODELS_DIR = resolve('src/wb-models');
const PAGES_DIR = resolve('src/wb-models/pages');
const DEMOS_DIR = resolve('demos');

// ─── Resolve input to a schema file path ───

function resolveSchemaPath(input) {
  // Direct path
  if (input.endsWith('.schema.json') && existsSync(resolve(input))) {
    return resolve(input);
  }
  // Just the behavior name
  const byName = join(MODELS_DIR, `${input}.schema.json`);
  if (existsSync(byName)) return byName;
  // Try with dashes removed
  const dehyphenated = input.replace(/-/g, '');
  const byDehyphen = join(MODELS_DIR, `${dehyphenated}.schema.json`);
  if (existsSync(byDehyphen)) return byDehyphen;

  return null;
}

// ─── List all available component schemas ───

function listComponents() {
  const files = readdirSync(MODELS_DIR).filter(f => f.endsWith('.schema.json'));
  const components = [];
  for (const f of files) {
    try {
      const s = JSON.parse(readFileSync(join(MODELS_DIR, f), 'utf-8'));
      if (s.schemaFor) {
        components.push({
          name: s.schemaFor,
          title: s.title || s.schemaFor,
          icon: s._metadata?.icon || '📦',
          hasMatrix: !!(s.test?.matrix?.combinations?.length),
          matrixCount: s.test?.matrix?.combinations?.length || 0,
          propCount: Object.keys(s.properties || {}).length
        });
      }
    } catch { /* skip */ }
  }
  return components.sort((a, b) => a.name.localeCompare(b.name));
}

// ─── Convert camelCase to kebab for HTML attrs ───

function camelToKebab(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// ─── Build smart demo content for each property value ───

function buildDemoLabel(attrs) {
  const parts = [];
  for (const [key, val] of Object.entries(attrs)) {
    if (val === true) {
      parts.push(key);
    } else if (typeof val === 'string' && val.length < 30) {
      parts.push(`${key}="${val}"`);
    }
  }
  return parts.join(', ') || 'default';
}

// ─── Generate sections from schema data ───

function generateSections(schema) {
  const sections = [];
  const tag = `wb-${schema.schemaFor}`;
  const props = schema.properties || {};

  // ── Section 1: Matrix Combinations (best demos) ──
  if (schema.test?.matrix?.combinations?.length) {
    const combos = schema.test.matrix.combinations;
    const demos = combos.map(combo => {
      // Convert camelCase keys to kebab-case for HTML attrs
      const attrs = {};
      for (const [key, val] of Object.entries(combo)) {
        attrs[camelToKebab(key)] = val;
      }
      return { tag, attrs };
    });

    // Group into rows of 3 max for readability
    const columns = demos.length <= 2 ? demos.length : demos.length <= 4 ? 2 : 3;
    sections.push({
      heading: `${schema.schemaFor} — Combinations`,
      tag,
      columns,
      demos
    });
  }

  // ── Section 2: Enum Variants ──
  // For each enum property, show one demo per enum value
  const enumProps = Object.entries(props).filter(([, def]) =>
    def.enum && Array.isArray(def.enum) && def.enum.length > 1
  );

  for (const [propName, propDef] of enumProps) {
    const attrName = camelToKebab(propName);
    const demos = propDef.enum.map(val => {
      const attrs = { [attrName]: val };
      // Add required props with sensible defaults
      for (const [rk, rv] of Object.entries(props)) {
        if (rv.required && rk !== propName) {
          attrs[camelToKebab(rk)] = rv.default || `Sample ${rk}`;
        }
      }
      return { tag, attrs };
    });

    const columns = demos.length <= 2 ? demos.length : demos.length <= 4 ? 2 : 3;
    sections.push({
      heading: `${propName} variants`,
      tag,
      columns,
      demos
    });
  }

  // ── Section 3: Boolean Toggles ──
  const boolProps = Object.entries(props).filter(([, def]) =>
    def.type === 'boolean' && def.default !== true
  );

  if (boolProps.length > 0) {
    const demos = boolProps.map(([propName, propDef]) => {
      const attrs = { [camelToKebab(propName)]: true };
      // Add required props
      for (const [rk, rv] of Object.entries(props)) {
        if (rv.required && rk !== propName) {
          attrs[camelToKebab(rk)] = rv.default || `Sample ${rk}`;
        }
      }
      return { tag, attrs };
    });

    const columns = demos.length <= 2 ? demos.length : 3;
    sections.push({
      heading: `Boolean toggles`,
      tag,
      columns,
      demos
    });
  }

  // ── Section 4: Defaults (if no matrix) ──
  if (!schema.test?.matrix?.combinations?.length) {
    const defaultAttrs = {};
    for (const [propName, propDef] of Object.entries(props)) {
      if (propDef.default !== undefined && propDef.default !== '' && propDef.default !== false) {
        defaultAttrs[camelToKebab(propName)] = propDef.default;
      } else if (propDef.required) {
        defaultAttrs[camelToKebab(propName)] = propDef.default || `Sample ${propName}`;
      }
    }
    if (Object.keys(defaultAttrs).length > 0) {
      sections.push({
        heading: `${schema.schemaFor} — Defaults`,
        tag,
        columns: 1,
        demos: [{ tag, attrs: defaultAttrs }]
      });
    }
  }

  return sections;
}

// ─── Deduplicate demos within sections ───

function deduplicateSections(sections) {
  const seen = new Set();
  for (const section of sections) {
    section.demos = section.demos.filter(demo => {
      const key = JSON.stringify({ tag: demo.tag, attrs: demo.attrs });
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  // Remove empty sections
  return sections.filter(s => s.demos.length > 0);
}

// ─── Build the page schema ───

function buildPageSchema(schema) {
  const icon = schema._metadata?.icon || '📦';
  const title = `${icon} ${schema.title || schema.schemaFor} Showcase`;

  let sections = generateSections(schema);
  sections = deduplicateSections(sections);

  const pageSchema = {
    "$extends": "wb-page-defaults",
    "title": title,
    "description": `Auto-generated showcase for ${schema.schemaFor} component — all variants, combinations, and toggles.`,
    "schemaFor": `${schema.schemaFor}-showcase`,

    "page": {
      "title": title
    },

    "header": {
      "tag": "h1",
      "content": title,
      "subtitle": {
        "tag": "p",
        "content": schema.description || `Showcase for ${schema.schemaFor}`
      }
    },

    "sections": sections,

    "_metadata": {
      "category": "auto-showcase",
      "icon": icon,
      "sourceSchema": `${schema.schemaFor}.schema.json`,
      "generatedAt": new Date().toISOString(),
      "sectionCount": sections.length,
      "totalDemos": sections.reduce((sum, s) => sum + s.demos.length, 0)
    }
  };

  return pageSchema;
}

// ─── Main ───

const arg = process.argv[2];

if (!arg) {
  console.error('Usage:');
  console.error('  node scripts/auto-showcase.mjs <component-name-or-path>');
  console.error('  node scripts/auto-showcase.mjs --list');
  process.exit(1);
}

if (arg === '--list') {
  const components = listComponents();
  console.log(`\n📦 ${components.length} component schemas available:\n`);
  for (const c of components) {
    const matrix = c.hasMatrix ? `✅ matrix(${c.matrixCount})` : '   no matrix';
    console.log(`  ${c.icon} ${c.name.padEnd(25)} ${c.propCount} props  ${matrix}`);
  }
  process.exit(0);
}

// Resolve schema
const schemaPath = resolveSchemaPath(arg);
if (!schemaPath) {
  console.error(`❌ Could not find schema for "${arg}"`);
  console.error(`   Tried: ${arg}, ${arg}.schema.json`);
  console.error(`   Run with --list to see available components`);
  process.exit(1);
}

const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
console.log(`📦 Loaded: ${schema.schemaFor} (${schema.title})`);
console.log(`   Properties: ${Object.keys(schema.properties || {}).length}`);
console.log(`   Matrix combos: ${schema.test?.matrix?.combinations?.length || 0}`);

// Build page schema
const pageSchema = buildPageSchema(schema);
const pageSchemaPath = join(PAGES_DIR, `${schema.schemaFor}-showcase.page.json`);
writeFileSync(pageSchemaPath, JSON.stringify(pageSchema, null, 2), 'utf-8');
console.log(`\n📝 Page schema: ${pageSchemaPath}`);
console.log(`   Sections: ${pageSchema.sections.length}`);
console.log(`   Total demos: ${pageSchema._metadata.totalDemos}`);

// Validate the generated page schema
console.log(`\n🔍 Validating...`);
try {
  const valOutput = execSync(
    `node scripts/validate-page-schema.mjs ${pageSchemaPath}`,
    { encoding: 'utf-8', cwd: resolve('.') }
  );
  console.log(valOutput);

  const valResult = JSON.parse(readFileSync(resolve('data/page-schema-validation.json'), 'utf-8'));
  if (!valResult.allValid) {
    console.error('❌ Generated page schema has validation errors!');
    console.error('   Fix the component schema or adjust the generator.');
    console.error(`   Errors: ${valResult.totalErrors}, Warnings: ${valResult.totalWarnings}`);
    // Don't exit — still generate, but warn
    console.warn('⚠️  Generating anyway — review the output carefully.\n');
  }
} catch (e) {
  console.error('⚠️  Validation skipped:', e.message);
}

// Generate HTML
const outputHtml = join(DEMOS_DIR, `${schema.schemaFor}-showcase.html`);
console.log(`⚙️  Generating HTML...`);
try {
  const genOutput = execSync(
    `node scripts/generate-page.mjs ${pageSchemaPath} ${outputHtml} --skip-validation`,
    { encoding: 'utf-8', cwd: resolve('.') }
  );
  console.log(genOutput);
} catch (e) {
  console.error('❌ Generation failed:', e.message);
  process.exit(1);
}

// Write result data
const result = {
  generatedAt: new Date().toISOString(),
  sourceSchema: schemaPath,
  pageSchema: pageSchemaPath,
  outputHtml: outputHtml,
  component: schema.schemaFor,
  sections: pageSchema.sections.length,
  totalDemos: pageSchema._metadata.totalDemos
};
writeFileSync(resolve('data/auto-showcase-result.json'), JSON.stringify(result, null, 2), 'utf-8');

console.log(`\n══════════════════════════════════════`);
console.log(`  ✅ Auto-showcase complete`);
console.log(`  Component: ${schema.schemaFor}`);
console.log(`  Sections:  ${result.sections}`);
console.log(`  Demos:     ${result.totalDemos}`);
console.log(`  Page JSON: ${pageSchemaPath}`);
console.log(`  HTML:      ${outputHtml}`);
console.log(`══════════════════════════════════════`);
