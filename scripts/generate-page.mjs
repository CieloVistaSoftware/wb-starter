/**
 * Page Generator — generates HTML from a .page.json schema
 * Usage: node scripts/generate-page.mjs <schema-path> [output-path]
 * 
 * Example:
 *   node scripts/generate-page.mjs src/wb-models/pages/behaviors-card-code.page.json demos/generated-card-demo.html
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, basename } from 'path';

import { execSync } from 'child_process';

const schemaPath = process.argv[2];
const outputPath = process.argv[3];
const skipValidation = process.argv.includes('--skip-validation');

if (!schemaPath) {
  console.error('Usage: node scripts/generate-page.mjs <schema-path> [output-path] [--skip-validation]');
  process.exit(1);
}

// ─── Validate before generating ───
if (!skipValidation) {
  console.log('🔍 Validating page schema...');
  try {
    const validationOutput = execSync(
      `node scripts/validate-page-schema.mjs ${schemaPath}`,
      { encoding: 'utf-8', cwd: resolve('.') }
    );
    console.log(validationOutput);

    // Check the result file for errors
    const validationResult = JSON.parse(readFileSync(resolve('data/page-schema-validation.json'), 'utf-8'));
    if (!validationResult.allValid) {
      console.error('❌ Validation failed — fix errors before generating.');
      console.error(`   ${validationResult.totalErrors} error(s), ${validationResult.totalWarnings} warning(s)`);
      process.exit(1);
    }
    console.log('✅ Validation passed — generating page...\n');
  } catch (e) {
    console.error('❌ Validation script failed:', e.message);
    process.exit(1);
  }
}

let schema = JSON.parse(readFileSync(resolve(schemaPath), 'utf-8'));

// ─── Auto-resolve composition directives ($extends, $ref, $include, $generate) ───
const hasComposition = schema.$extends || schema.sections?.some(s => s.$ref || s.$include || s.$generate);
if (hasComposition) {
  console.log('🧩 Composition directives detected — resolving...');
  try {
    const composeOutput = execSync(
      `node scripts/compose-page.mjs ${schemaPath}`,
      { encoding: 'utf-8', cwd: resolve('.') }
    );
    console.log(composeOutput);
    // Re-read the resolved schema (compose-page writes to pages dir)
    const resolvedPath = resolve(`src/wb-models/pages/${schema.schemaFor || 'composed'}.page.json`);
    if (existsSync(resolvedPath)) {
      schema = JSON.parse(readFileSync(resolvedPath, 'utf-8'));
      console.log('✅ Composition resolved\n');
    }
  } catch (e) {
    console.error('❌ Composition failed:', e.message);
    process.exit(1);
  }
}

// Default output path based on schemaFor
const finalOutput = outputPath || `demos/${schema.schemaFor || 'generated'}-generated.html`;

function attrString(attrs) {
  if (!attrs) return '';
  return Object.entries(attrs)
    .map(([key, value]) => {
      if (value === true) return ` ${key}`;
      if (value === false || value === null || value === undefined) return '';
      return ` ${key}="${escapeAttr(String(value))}"`;
    })
    .join('');
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function indent(text, level) {
  const spaces = '  '.repeat(level);
  return text.split('\n').map(line => spaces + line).join('\n');
}

// --- Build the HTML ---

const lines = [];

// DOCTYPE + html
lines.push(`<!DOCTYPE html>`);
lines.push(`<html lang="${schema.page?.lang || 'en'}"${schema.page?.theme ? ` data-theme="${schema.page.theme}"` : ''}>`);
lines.push('');

// Head
lines.push('<head>');
lines.push('  <meta charset="UTF-8">');
lines.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
lines.push(`  <title>${schema.page?.title || schema.title || 'Generated Page'}</title>`);

if (schema.page?.stylesheets) {
  for (const href of schema.page.stylesheets) {
    lines.push(`  <link rel="stylesheet" href="${href}">`);
  }
}

lines.push('');
lines.push('</head>');
lines.push('');

// Body
lines.push('<body>');

// Page header
if (schema.header) {
  const h = schema.header;
  lines.push(`  <${h.tag || 'h1'}>${h.content}</${h.tag || 'h1'}>`);
  if (h.subtitle) {
    lines.push(`  <${h.subtitle.tag || 'p'}>${h.subtitle.content}</${h.subtitle.tag || 'p'}>`);
  }
  lines.push('');
}

// Sections
if (schema.sections) {
  for (let i = 0; i < schema.sections.length; i++) {
    const section = schema.sections[i];
    const sectionNum = i + 1;
    
    lines.push(`  <!-- ${sectionNum}. ${section.heading} -->`);
    lines.push(`  <h2>${section.heading}</h2>`);
    lines.push(`  <wb-demo columns="${section.columns || 3}">`);

    for (const demo of section.demos) {
      const attrs = attrString(demo.attrs);
      if (demo.children) {
        lines.push(`    <${demo.tag}${attrs}>`);
        lines.push(`      ${demo.children}`);
        lines.push(`    </${demo.tag}>`);
      } else {
        lines.push(`    <${demo.tag}${attrs}>`);
        lines.push(`    </${demo.tag}>`);
      }
    }

    lines.push('  </wb-demo>');
    lines.push('');
  }
}

// Scripts
if (schema.page?.scripts) {
  for (const script of schema.page.scripts) {
    lines.push(`  <!-- Load wb-starter -->`);
    lines.push(`  <script type="${script.type || 'module'}">`);
    lines.push(`    import WB from '${script.src}';`);
    lines.push(`    window.WB = WB;`);
    lines.push(`    await ${script.init};`);
    lines.push(`    console.log('${schema.title} initialized');`);
    lines.push(`  </script>`);
  }
}

lines.push('</body>');
lines.push('');
lines.push('</html>');

// Write output
const html = lines.join('\n');
writeFileSync(resolve(finalOutput), html, 'utf-8');

// Also write to data/ for inspection
const resultData = {
  generated: new Date().toISOString(),
  schemaSource: schemaPath,
  outputFile: finalOutput,
  sectionCount: schema.sections?.length || 0,
  totalDemos: schema.sections?.reduce((sum, s) => sum + s.demos.length, 0) || 0,
  lineCount: lines.length
};
writeFileSync(resolve('data/page-generator-result.json'), JSON.stringify(resultData, null, 2), 'utf-8');

console.log(`✅ Generated: ${finalOutput}`);
console.log(`   Sections: ${resultData.sectionCount}`);
console.log(`   Demos: ${resultData.totalDemos}`);
console.log(`   Lines: ${resultData.lineCount}`);
