/**
 * Page Composition Resolver
 * 
 * Resolves $extends, $ref, and $include directives in .page.json schemas
 * before passing to generate-page.mjs.
 * 
 * DIRECTIVES:
 *   $extends  (page-level)    — Inherit page defaults (stylesheets, scripts, theme)
 *   $ref      (section-level) — Pull a named section from another page schema
 *   $include  (section-level) — Pull ALL sections from another page schema
 *   $generate (section-level) — Auto-generate section from component schema
 * 
 * Usage:
 *   node scripts/compose-page.mjs <input.page.json> [output.page.json]
 *   node scripts/compose-page.mjs <input.page.json> --generate  (compose + generate HTML)
 *   node scripts/compose-page.mjs --example                     (show example composed schema)
 * 
 * Composed schemas are written to src/wb-models/pages/ (resolved, no directives).
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname, basename, join } from 'path';
import { execSync } from 'child_process';

const PAGES_DIR = resolve('src/wb-models/pages');
const DEFAULTS_DIR = resolve('src/wb-models/pages/defaults');
const SCHEMAS_DIR = resolve('src/wb-models');

// ─── Helpers ───

function loadJSON(filePath) {
  const fullPath = resolve(filePath);
  if (!existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  return JSON.parse(readFileSync(fullPath, 'utf-8'));
}

function findPageSchema(name) {
  // Try exact path first
  if (existsSync(resolve(name))) return loadJSON(name);
  
  // Try in pages directory
  const candidates = [
    join(PAGES_DIR, `${name}.page.json`),
    join(PAGES_DIR, name),
    join(PAGES_DIR, `${name}.json`)
  ];
  for (const c of candidates) {
    if (existsSync(c)) return loadJSON(c);
  }
  throw new Error(`Page schema not found: ${name}`);
}

function findDefaults(name) {
  const candidates = [
    join(DEFAULTS_DIR, `${name}.json`),
    join(DEFAULTS_DIR, name),
    join(PAGES_DIR, `${name}.json`)
  ];
  for (const c of candidates) {
    if (existsSync(c)) return loadJSON(c);
  }
  throw new Error(`Defaults file not found: ${name}`);
}

function findComponentSchema(componentName) {
  const normalized = componentName.replace(/^wb-/, '');
  const candidates = [
    join(SCHEMAS_DIR, `${normalized}.schema.json`),
    join(SCHEMAS_DIR, `${componentName}.schema.json`)
  ];
  for (const c of candidates) {
    if (existsSync(c)) return loadJSON(c);
  }
  throw new Error(`Component schema not found: ${componentName}`);
}

// Deep merge: target ← source (source wins for scalars, arrays replace, objects recurse)
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (key.startsWith('$')) continue; // Don't merge directives into output
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// camelCase → kebab-case
function toKebab(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

// ─── $generate: Auto-create section from component schema ───

function generateSection(directive) {
  const { component, source = 'matrix', heading, columns = 3, baseAttrs = {} } = directive;
  const schema = findComponentSchema(component);
  const tag = `wb-${schema.schemaFor || component.replace(/^wb-/, '')}`;
  const props = schema.properties || {};
  const demos = [];

  if (source === 'matrix' && schema.test?.matrix?.combinations) {
    // Use test matrix combinations
    for (const combo of schema.test.matrix.combinations) {
      const attrs = { ...baseAttrs };
      for (const [key, value] of Object.entries(combo)) {
        attrs[toKebab(key)] = value;
      }
      demos.push({ tag, attrs });
    }
  } else if (source === 'enums') {
    // Generate one demo per enum value for each enum property
    for (const [propName, propDef] of Object.entries(props)) {
      if (propDef.enum && propDef.enum.length > 0) {
        for (const val of propDef.enum) {
          const attrs = { ...baseAttrs, [toKebab(propName)]: val };
          demos.push({ tag, attrs });
        }
      }
    }
  } else if (source === 'all') {
    // Matrix first, then fill in enums and booleans
    if (schema.test?.matrix?.combinations) {
      for (const combo of schema.test.matrix.combinations) {
        const attrs = { ...baseAttrs };
        for (const [key, value] of Object.entries(combo)) {
          attrs[toKebab(key)] = value;
        }
        demos.push({ tag, attrs });
      }
    }
    for (const [propName, propDef] of Object.entries(props)) {
      if (propDef.enum && propDef.enum.length > 0) {
        for (const val of propDef.enum) {
          if (val === propDef.default) continue;
          const attrs = { ...baseAttrs, [toKebab(propName)]: val };
          // Deduplicate — skip if we already have a demo with this attr value
          const exists = demos.some(d => d.attrs[toKebab(propName)] === val);
          if (!exists) demos.push({ tag, attrs });
        }
      }
    }
  } else {
    // Defaults — simple demo with baseAttrs
    demos.push({ tag, attrs: { ...baseAttrs } });
  }

  return {
    heading: heading || `${schema.schemaFor || component} — ${source}`,
    tag,
    columns,
    demos
  };
}

// ─── Main Resolver ───

function composePage(inputSchema) {
  let result = { ...inputSchema };
  const stats = { extendsResolved: false, refsResolved: 0, includesResolved: 0, generated: 0 };

  // 1. Resolve $extends — merge page defaults
  if (result.$extends) {
    const defaultsName = result.$extends;
    console.log(`  📦 $extends: ${defaultsName}`);
    const defaults = findDefaults(defaultsName);
    result = deepMerge(defaults, result);
    delete result.$extends;
    stats.extendsResolved = true;

    // Merge page.title from the composed schema's title if not set
    if (result.title && result.page && !result.page.title) {
      result.page.title = result.title;
    }
  }

  // 2. Resolve sections
  if (result.sections) {
    const resolvedSections = [];

    for (const section of result.sections) {
      // $ref — pull a named section from another page schema
      if (section.$ref) {
        const [pageName, sectionIndex] = section.$ref.split('#');
        console.log(`  🔗 $ref: ${section.$ref}`);
        const refPage = findPageSchema(pageName);
        
        if (sectionIndex !== undefined) {
          // Pull specific section by index
          const idx = parseInt(sectionIndex);
          if (refPage.sections?.[idx]) {
            const merged = { ...refPage.sections[idx] };
            // Allow overrides from the referencing section
            if (section.heading) merged.heading = section.heading;
            if (section.columns) merged.columns = section.columns;
            resolvedSections.push(merged);
          } else {
            console.warn(`  ⚠️ Section index ${idx} not found in ${pageName}`);
          }
        } else {
          // Pull section by heading match
          if (section.heading) {
            const match = refPage.sections?.find(s => s.heading.includes(section.heading));
            if (match) {
              resolvedSections.push({ ...match });
            } else {
              console.warn(`  ⚠️ No section matching "${section.heading}" in ${pageName}`);
            }
          }
        }
        stats.refsResolved++;
      }
      // $include — pull ALL sections from another page schema
      else if (section.$include) {
        console.log(`  📂 $include: ${section.$include}`);
        const includePage = findPageSchema(section.$include);
        if (includePage.sections) {
          resolvedSections.push(...includePage.sections);
        }
        stats.includesResolved++;
      }
      // $generate — auto-create section from component schema
      else if (section.$generate) {
        console.log(`  ⚙️ $generate: ${section.$generate.component} (${section.$generate.source || 'matrix'})`);
        const generated = generateSection(section.$generate);
        // Allow overrides
        if (section.heading) generated.heading = section.heading;
        if (section.columns) generated.columns = section.columns;
        resolvedSections.push(generated);
        stats.generated++;
      }
      // Plain section — pass through
      else {
        resolvedSections.push(section);
      }
    }

    result.sections = resolvedSections;
  }

  // Clean up any remaining $ directives
  delete result.$schema;
  delete result.$id;

  return { resolved: result, stats };
}

// ─── CLI ───

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
const inputArg = args[0];
const outputArg = args[1];
const doGenerate = flags.includes('--generate');
const showExample = flags.includes('--example');

if (showExample) {
  const example = {
    "$extends": "wb-page-defaults",
    "title": "Multi-Component Demo",
    "schemaFor": "multi-demo",
    "header": {
      "tag": "h1",
      "content": "Multi-Component Demo",
      "subtitle": { "tag": "p", "content": "Composed from multiple sources" }
    },
    "sections": [
      {
        "$generate": { "component": "badge", "source": "matrix", "columns": 4 },
        "heading": "Badges — From Matrix"
      },
      {
        "$generate": { "component": "cardnotification", "source": "enums" },
        "heading": "Notifications — All Variants"
      },
      {
        "$ref": "badge-showcase#0",
        "heading": "Badges (pulled from showcase)"
      },
      {
        "$include": "cardnotification-showcase"
      },
      {
        "heading": "Custom Section",
        "tag": "wb-badge",
        "columns": 2,
        "demos": [
          { "tag": "wb-badge", "attrs": { "label": "Custom 1", "variant": "primary" } },
          { "tag": "wb-badge", "attrs": { "label": "Custom 2", "variant": "success" } }
        ]
      }
    ]
  };
  console.log('\n📋 Example composed page schema:\n');
  console.log(JSON.stringify(example, null, 2));
  console.log('\nDirectives:');
  console.log('  $extends  — inherit page defaults (stylesheets, scripts, theme)');
  console.log('  $ref      — pull a section from another page schema (by index or heading)');
  console.log('  $include  — pull ALL sections from another page schema');
  console.log('  $generate — auto-create section from component schema (matrix/enums/all)');
  process.exit(0);
}

if (!inputArg) {
  console.error('Usage: node scripts/compose-page.mjs <input.page.json> [output.page.json] [--generate]');
  console.error('       node scripts/compose-page.mjs --example');
  process.exit(1);
}

console.log(`\n🧩 Composing: ${inputArg}`);
const input = loadJSON(inputArg);
const { resolved, stats } = composePage(input);

// Determine output path
const name = resolved.schemaFor || basename(inputArg, '.page.json').replace('.composed', '');
const outputPath = outputArg || join(PAGES_DIR, `${name}.page.json`);

// Add composition metadata
resolved._composed = {
  source: inputArg,
  composedAt: new Date().toISOString(),
  stats
};

writeFileSync(resolve(outputPath), JSON.stringify(resolved, null, 2), 'utf-8');
console.log(`\n✅ Composed: ${outputPath}`);
console.log(`   $extends: ${stats.extendsResolved ? 'yes' : 'no'}`);
console.log(`   $ref resolved: ${stats.refsResolved}`);
console.log(`   $include resolved: ${stats.includesResolved}`);
console.log(`   $generate resolved: ${stats.generated}`);
console.log(`   Total sections: ${resolved.sections?.length || 0}`);
console.log(`   Total demos: ${resolved.sections?.reduce((s, sec) => s + (sec.demos?.length || 0), 0) || 0}`);

// Write result to data/
const resultData = {
  composedAt: new Date().toISOString(),
  source: inputArg,
  output: outputPath,
  stats,
  sectionCount: resolved.sections?.length || 0,
  totalDemos: resolved.sections?.reduce((s, sec) => s + (sec.demos?.length || 0), 0) || 0
};
writeFileSync(resolve('data/compose-page-result.json'), JSON.stringify(resultData, null, 2), 'utf-8');

// Optionally generate HTML
if (doGenerate) {
  console.log('\n🔧 Generating HTML...');
  try {
    const output = execSync(`node scripts/generate-page.mjs ${outputPath}`, { encoding: 'utf-8' });
    console.log(output);
  } catch (e) {
    console.error('❌ Generation failed:', e.message);
    process.exit(1);
  }
}
