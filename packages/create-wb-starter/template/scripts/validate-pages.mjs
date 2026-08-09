/**
 * validate-pages.mjs
 * Validates HTML files against the page/demo structural contracts.
 * 
 * - pages/*.html → validates as page fragments (no shell, layout zones required)
 * - demos/*.html → validates as demos (full document, self-contained)
 * 
 * Output: data/page-validation.json
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const outputPath = join(root, 'data', 'page-validation.json');

const results = {
  timestamp: new Date().toISOString(),
  pages: { total: 0, pass: 0, fail: 0, details: [] },
  demos: { total: 0, pass: 0, fail: 0, details: [] },
  pageSchemas: { total: 0, pass: 0, fail: 0, details: [] }
};

// ═══════════════════════════════════════════
// 1. VALIDATE PAGE FRAGMENTS (pages/*.html)
// ═══════════════════════════════════════════
const pagesDir = join(root, 'pages');
if (existsSync(pagesDir)) {
  const pageFiles = readdirSync(pagesDir).filter(f => f.endsWith('.html'));
  results.pages.total = pageFiles.length;

  for (const file of pageFiles) {
    const content = readFileSync(join(pagesDir, file), 'utf8');
    const issues = validatePageFragment(content, file);

    if (issues.length === 0) {
      results.pages.pass++;
      results.pages.details.push({ file, status: 'PASS', issues: [] });
    } else {
      results.pages.fail++;
      results.pages.details.push({ file, status: 'FAIL', issues });
    }
  }
}

// ═══════════════════════════════════════════
// 2. VALIDATE DEMOS (demos/*.html)
// ═══════════════════════════════════════════
const demosDir = join(root, 'demos');
if (existsSync(demosDir)) {
  const demoFiles = readdirSync(demosDir).filter(f => f.endsWith('.html'));
  results.demos.total = demoFiles.length;

  for (const file of demoFiles) {
    const content = readFileSync(join(demosDir, file), 'utf8');
    const issues = validateDemo(content, file);

    if (issues.length === 0) {
      results.demos.pass++;
      results.demos.details.push({ file, status: 'PASS', issues: [] });
    } else {
      results.demos.fail++;
      results.demos.details.push({ file, status: 'FAIL', issues });
    }
  }
}

// ═══════════════════════════════════════════
// 3. VALIDATE PAGE SCHEMAS (*.page.json)
// ═══════════════════════════════════════════
const pageSchemaDir = join(root, 'src', 'wb-models', 'pages');
if (existsSync(pageSchemaDir)) {
  const schemaFiles = readdirSync(pageSchemaDir).filter(f => f.endsWith('.page.json'));
  results.pageSchemas.total = schemaFiles.length;

  for (const file of schemaFiles) {
    let schema;
    try {
      schema = JSON.parse(readFileSync(join(pageSchemaDir, file), 'utf8'));
    } catch (e) {
      results.pageSchemas.fail++;
      results.pageSchemas.details.push({ file, status: 'FAIL', issues: [`Parse error: ${e.message}`] });
      continue;
    }

    const issues = validatePageSchema(schema, file);
    if (issues.length === 0) {
      results.pageSchemas.pass++;
      results.pageSchemas.details.push({ file, status: 'PASS', issues: [] });
    } else {
      results.pageSchemas.fail++;
      results.pageSchemas.details.push({ file, status: 'FAIL', issues });
    }
  }
}

// ═══════════════════════════════════════════
// OUTPUT
// ═══════════════════════════════════════════
writeFileSync(outputPath, JSON.stringify(results, null, 2));

console.log('\n=== Page & Demo Validation Results ===\n');

console.log(`PAGES (pages/*.html): ${results.pages.total} total, ${results.pages.pass} pass, ${results.pages.fail} fail`);
if (results.pages.fail > 0) {
  for (const d of results.pages.details.filter(d => d.status === 'FAIL')) {
    console.log(`  ❌ ${d.file}:`);
    for (const i of d.issues) console.log(`     ${i}`);
  }
}

console.log(`\nDEMOS (demos/*.html): ${results.demos.total} total, ${results.demos.pass} pass, ${results.demos.fail} fail`);
if (results.demos.fail > 0) {
  for (const d of results.demos.details.filter(d => d.status === 'FAIL')) {
    console.log(`  ❌ ${d.file}:`);
    for (const i of d.issues) console.log(`     ${i}`);
  }
}

console.log(`\nPAGE SCHEMAS (*.page.json): ${results.pageSchemas.total} total, ${results.pageSchemas.pass} pass, ${results.pageSchemas.fail} fail`);
if (results.pageSchemas.fail > 0) {
  for (const d of results.pageSchemas.details.filter(d => d.status === 'FAIL')) {
    console.log(`  ❌ ${d.file}:`);
    for (const i of d.issues) console.log(`     ${i}`);
  }
}

console.log(`\nFull results: ${outputPath}`);


// ═══════════════════════════════════════════════════════════
// VALIDATORS
// ═══════════════════════════════════════════════════════════

function validatePageFragment(html, filename) {
  const issues = [];
  const lower = html.toLowerCase();

  // --- PROHIBITED: Must not have document shell ---
  if (lower.includes('<!doctype')) {
    issues.push('PROHIBITED: Contains <!DOCTYPE> — page fragments must not have a document declaration');
  }
  // Check for <html> as tag, not as attribute value
  if (/<html[\s>]/i.test(html)) {
    issues.push('PROHIBITED: Contains <html> tag — server wraps fragments with the site shell');
  }
  if (/<head[\s>]/i.test(html) && !/<thead/i.test(html)) {
    // Exclude <thead> false positives
    const headMatch = html.match(/<head[\s>]/i);
    if (headMatch && !html.substring(Math.max(0, headMatch.index - 1), headMatch.index).includes('t')) {
      issues.push('PROHIBITED: Contains <head> tag — server provides the document head');
    }
  }
  if (/<body[\s>]/i.test(html)) {
    issues.push('PROHIBITED: Contains <body> tag — server wraps fragments');
  }

  // --- PROHIBITED: No <style> blocks ---
  const styleBlocks = html.match(/<style[\s>]/gi);
  if (styleBlocks) {
    issues.push(`PROHIBITED: Contains ${styleBlocks.length} <style> block(s) — use page CSS file (src/styles/pages/${filename.replace('.html', '.css')}) or behavior CSS`);
  }

  // --- PROHIBITED: No <link> to site.css or themes.css ---
  if (/href=["'][^"']*site\.css/i.test(html)) {
    issues.push('PROHIBITED: Links to site.css — server injects this automatically');
  }
  if (/href=["'][^"']*themes\.css/i.test(html)) {
    issues.push('PROHIBITED: Links to themes.css — server injects this automatically');
  }

  // --- PROHIBITED: No WB.init() script ---
  if (/WB\.init\s*\(/i.test(html)) {
    issues.push('PROHIBITED: Contains WB.init() — server handles WB initialization');
  }

  // --- WARNING: Inline styles ---
  const inlineStyles = html.match(/style\s*=\s*["'][^"']{20,}["']/gi);
  if (inlineStyles && inlineStyles.length > 3) {
    issues.push(`WARNING: ${inlineStyles.length} significant inline styles found — use CSS classes instead`);
  }

  // Count all inline styles (including short ones)
  const allInlineStyles = html.match(/style\s*=\s*["']/gi);
  if (allInlineStyles && allInlineStyles.length > 10) {
    issues.push(`WARNING: ${allInlineStyles.length} total inline style attributes — pages should use layout classes (.page__hero, .page__section, .page__grid)`);
  }

  // --- REQUIRED ZONES ---
  if (!html.includes('page__hero')) {
    issues.push('MISSING ZONE: No .page__hero found — every page should have a hero section with h1 + subtitle');
  }
  if (!html.includes('page__section')) {
    issues.push('MISSING ZONE: No .page__section found — pages should use .page__section for content areas');
  }

  // --- STRUCTURE: h1 should exist ---
  if (!/<h1[\s>]/i.test(html)) {
    issues.push('MISSING: No <h1> found — every page should have a title');
  }

  return issues;
}


function validateDemo(html, filename) {
  const issues = [];
  const lower = html.toLowerCase();

  // --- REQUIRED: Must be a full document ---
  if (!lower.includes('<!doctype')) {
    issues.push('MISSING: No <!DOCTYPE html> — demos must be full standalone documents');
  }
  if (!/<html[\s>]/i.test(html)) {
    issues.push('MISSING: No <html> tag — demos must have a complete document structure');
  }
  if (!/<head[\s>]/i.test(html)) {
    issues.push('MISSING: No <head> tag — demos must include <head> with meta tags');
  }

  // --- REQUIRED: charset and viewport ---
  if (!lower.includes('charset')) {
    issues.push('MISSING: No charset meta tag — add <meta charset="UTF-8">');
  }
  if (!lower.includes('viewport')) {
    issues.push('MISSING: No viewport meta tag — add <meta name="viewport" content="width=device-width, initial-scale=1.0">');
  }

  // --- REQUIRED: title ---
  if (!/<title>/i.test(html)) {
    issues.push('MISSING: No <title> tag — demos need a descriptive title');
  }

  // --- REQUIRED: data-theme on html ---
  if (!html.includes('data-theme')) {
    issues.push('MISSING: No data-theme attribute on <html> — demos should set a default theme');
  }

  // --- CHECK: If uses wb-* components, must have WB import ---
  const usesWBComponents = /<wb-[a-z]/i.test(html);
  const hasWBImport = /wb-lazy\.js|wb\.js/i.test(html);
  if (usesWBComponents && !hasWBImport) {
    issues.push('MISSING: Uses wb-* components but no WB import found — add <script type="module"> with WB.init()');
  }

  // --- CHECK: Has server dependency comment if using /api/ ---
  const usesAPI = /\/api\//i.test(html);
  const hasServerComment = /server.*require|backend.*require|requires.*server/i.test(html);
  if (usesAPI && !hasServerComment) {
    issues.push('WARNING: Uses backend API endpoints but no server dependency comment found — add <!-- Server: required --> at top');
  }

  return issues;
}


function validatePageSchema(schema, filename) {
  const issues = [];

  if (!schema.title) {
    issues.push('Missing required field: title');
  }
  if (!schema.description) {
    issues.push('Missing required field: description');
  }

  // Sections validation
  if (!schema.sections) {
    issues.push('Missing required field: sections');
  } else if (!Array.isArray(schema.sections)) {
    issues.push('sections must be an array');
  } else if (schema.sections.length === 0) {
    issues.push('sections must have at least one entry');
  } else {
    for (let i = 0; i < schema.sections.length; i++) {
      const section = schema.sections[i];
      if (!section.heading) {
        issues.push(`sections[${i}]: missing 'heading'`);
      }
      if (!section.demos || !Array.isArray(section.demos)) {
        issues.push(`sections[${i}]: missing or invalid 'demos' array`);
      } else {
        for (let j = 0; j < section.demos.length; j++) {
          const demo = section.demos[j];
          if (!demo.tag) {
            issues.push(`sections[${i}].demos[${j}]: missing 'tag'`);
          }
          if (!demo.attrs && demo.attrs !== undefined) {
            // attrs can be empty object but should exist
          }
        }
      }
    }
  }

  return issues;
}
