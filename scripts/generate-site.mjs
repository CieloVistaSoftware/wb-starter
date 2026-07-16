/**
 * Multi-Page Site Generator (Phase 4)
 * ====================================
 * Reads a .site.json schema and generates an entire set of showcase pages
 * plus an index page, using the existing pipeline (validate → compose → generate).
 *
 * Site Schema Format:
 *   {
 *     "title": "WB Component Library",
 *     "outputDir": "demos/site",          // where HTML goes
 *     "defaults": "wb-page-defaults",     // $extends for all pages
 *     "generateIndex": true,              // create index.html with links
 *     "pages": [
 *       {
 *         "id": "cards",
 *         "title": "Card Components",
 *         "description": "All card variants",
 *         "icon": "🃏",
 *         "components": ["card", "cardbutton", ...],   // auto-showcase these
 *         "columns": 3
 *       },
 *       {
 *         "id": "custom",
 *         "title": "Custom Page",
 *         "schema": "path/to/custom.page.json"         // use existing page schema
 *       }
 *     ]
 *   }
 *
 * Usage:
 *   node scripts/generate-site.mjs <site-schema.json>
 *   node scripts/generate-site.mjs <site-schema.json> --dry-run     (validate only)
 *   node scripts/generate-site.mjs <site-schema.json> --index-only  (regenerate index)
 *
 * Output:
 *   demos/site/{page-id}.html           — individual pages
 *   demos/site/index.html               — site index with links
 *   data/site-generator-result.json     — build report
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { resolve, join, basename, relative } from 'path';
import { execSync } from 'child_process';

const MODELS_DIR = resolve('src/wb-models');
const PAGES_DIR = resolve('src/wb-models/pages');

// ─── Helpers ───

function loadJSON(path) {
  return JSON.parse(readFileSync(resolve(path), 'utf-8'));
}

function camelToKebab(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function slugify(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function findSchema(name) {
  const candidates = [
    join(MODELS_DIR, `${name}.schema.json`),
    join(MODELS_DIR, `${name.replace(/-/g, '')}.schema.json`)
  ];
  for (const c of candidates) {
    if (existsSync(c)) return loadJSON(c);
  }
  return null;
}

// ─── Generate sections for a single component (same logic as auto-showcase) ───

// Every generated instance needs SOME children, regardless of whether its
// behavior self-generates content (avatar/badge/chip clear+rebuild
// textContent anyway, so a placeholder there is harmlessly overwritten) --
// without it, a custom element with no CSS default size (most of them; only
// a handful of behaviors have a dedicated .css file) collapses to
// offsetHeight:0 and is completely invisible despite being correctly
// "enhanced" (confirmed live: <wb-draggable axis="both"></wb-draggable>,
// zero height, on the deployed interactive.html page).
//
// The whole POINT of these demos is showing what each attribute combo does
// (#268/#279 and onward) -- a single static placeholder shared by every
// instance defeats that just as badly as being invisible: four <wb-dialog>
// triggers with title="Basic Dialog"/"Large"/"No Close"/"Centered" all just
// said "Dialog", indistinguishable at a glance (confirmed live). Build the
// placeholder FROM that instance's own attrs so each one is self-labeling.
function placeholderChildren(schema, attrs = {}) {
  const parts = Object.entries(attrs).map(([k, v]) => (v === true ? k : `${k}=${v}`));
  if (parts.length > 0) return parts.join(', ');
  return schema.title || schema.schemaFor || 'Demo content';
}

function generateComponentSections(schema) {
  const sections = [];
  const tag = `wb-${schema.schemaFor}`;
  const props = schema.properties || {};

  // Matrix combinations
  if (schema.test?.matrix?.combinations?.length) {
    const demos = schema.test.matrix.combinations.map(combo => {
      const attrs = {};
      for (const [key, val] of Object.entries(combo)) {
        attrs[camelToKebab(key)] = val;
      }
      return { tag, attrs, children: placeholderChildren(schema, attrs) };
    });
    const columns = demos.length <= 2 ? demos.length : demos.length <= 4 ? 2 : 3;
    sections.push({
      heading: `${schema.schemaFor} — Combinations`,
      component: schema.schemaFor,
      tag,
      columns,
      demos
    });
  }

  // Enum variants
  const enumProps = Object.entries(props).filter(([, def]) =>
    def.enum && Array.isArray(def.enum) && def.enum.length > 1
  );
  for (const [propName, propDef] of enumProps) {
    const attrName = camelToKebab(propName);
    const demos = propDef.enum.map(val => {
      const attrs = { [attrName]: val };
      for (const [rk, rv] of Object.entries(props)) {
        if (rv.required && rk !== propName) {
          attrs[camelToKebab(rk)] = rv.default || `Sample ${rk}`;
        }
      }
      return { tag, attrs, children: placeholderChildren(schema, attrs) };
    });
    const columns = demos.length <= 2 ? demos.length : demos.length <= 4 ? 2 : 3;
    sections.push({
      heading: `${propName} variants`,
      component: schema.schemaFor,
      tag,
      columns,
      demos
    });
  }

  // Boolean toggles
  const boolProps = Object.entries(props).filter(([, def]) =>
    def.type === 'boolean' && def.default !== true
  );
  if (boolProps.length > 0) {
    const demos = boolProps.map(([propName]) => {
      const attrs = { [camelToKebab(propName)]: true };
      for (const [rk, rv] of Object.entries(props)) {
        if (rv.required && rk !== propName) {
          attrs[camelToKebab(rk)] = rv.default || `Sample ${rk}`;
        }
      }
      return { tag, attrs, children: placeholderChildren(schema, attrs) };
    });
    const columns = demos.length <= 2 ? demos.length : 3;
    sections.push({
      heading: `Boolean toggles`,
      component: schema.schemaFor,
      tag,
      columns,
      demos
    });
  }

  // Defaults fallback (only if no matrix)
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
        component: schema.schemaFor,
        tag,
        columns: 1,
        demos: [{ tag, attrs: defaultAttrs, children: placeholderChildren(schema, defaultAttrs) }]
      });
    }
  }

  return sections;
}

// ─── Deduplicate demos across sections ───

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
  return sections.filter(s => s.demos.length > 0);
}

// ─── Build a multi-component page schema ───

function buildMultiComponentPage(pageDef, defaults) {
  const allSections = [];
  const componentResults = [];

  for (const componentName of (pageDef.components || [])) {
    const schema = findSchema(componentName);
    if (!schema) {
      console.warn(`  ⚠️ Schema not found: ${componentName} — skipping`);
      componentResults.push({ name: componentName, status: 'not_found', sections: 0, demos: 0 });
      continue;
    }

    const sections = generateComponentSections(schema);
    const demoCount = sections.reduce((sum, s) => sum + s.demos.length, 0);
    componentResults.push({
      name: componentName,
      status: 'ok',
      sections: sections.length,
      demos: demoCount
    });

    // Add a component separator heading
    const icon = schema._metadata?.icon || '📦';
    if (sections.length > 0) {
      // Prefix the first section heading with the component name
      sections[0].heading = `${icon} ${schema.title || schema.schemaFor}`;
    }
    allSections.push(...sections);
  }

  const deduplicated = deduplicateSections(allSections);

  // Hand-authored sections for schema-less x-* behaviors and narrative content
  // the auto-generator can't produce (prose, RTL examples, multi-instance
  // showcases). Passed through verbatim — heading + raw html, no attrs/demos
  // shape, since these don't come from a schema. `position: 'start'` pins a
  // section before the auto-generated ones (e.g. a curated gallery that
  // page-level tests target via .first()/.nth(0)); default is append.
  const manualStart = [];
  const manualEnd = [];
  for (const manual of (pageDef.manualSections || [])) {
    const section = { heading: manual.heading, raw: manual.html, script: manual.script, id: manual.id };
    (manual.position === 'start' ? manualStart : manualEnd).push(section);
  }
  deduplicated.unshift(...manualStart);
  deduplicated.push(...manualEnd);

  const pageSchema = {
    title: pageDef.title,
    description: pageDef.description || `Showcase for: ${(pageDef.components || []).join(', ')}`,
    schemaFor: pageDef.id,
    page: {
      lang: 'en',
      theme: 'dark',
      title: pageDef.title,
      stylesheets: [
        '../../src/styles/themes.css',
        '../../src/styles/site.css'
      ],
      scripts: [{
        type: 'module',
        src: '../../src/core/wb-lazy.js',
        init: 'WB.init({ autoInject: true })'
      }]
    },
    header: {
      tag: 'h1',
      content: `${pageDef.icon || '📦'} ${pageDef.title}`,
      subtitle: {
        tag: 'p',
        content: pageDef.description || `Showcasing ${(pageDef.components || []).length} components`
      }
    },
    sections: deduplicated
  };

  return { pageSchema, componentResults };
}

// ─── Generate index page HTML ───

function generateIndexHtml(siteSchema, pageResults) {
  const lines = [];
  lines.push('<!DOCTYPE html>');
  lines.push(`<html lang="en" data-theme="dark">`);
  lines.push('');
  lines.push('<head>');
  lines.push('  <meta charset="UTF-8">');
  lines.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
  lines.push(`  <title>${siteSchema.title} — Index</title>`);
  lines.push('  <link rel="stylesheet" href="../../src/styles/themes.css">');
  lines.push('  <link rel="stylesheet" href="../../src/styles/site.css">');
  lines.push('  <style>');
  lines.push('    .site-index { max-width: 960px; margin: 2rem auto; }');
  lines.push('    .page-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 2rem; }');
  lines.push('    .page-card { background: var(--surface-color, #1e1e1e); border: 1px solid var(--border-color, #333); border-radius: 12px; padding: 1.5rem; transition: transform 0.2s, box-shadow 0.2s; }');
  lines.push('    .page-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }');
  lines.push('    .page-card a { color: var(--text-primary, #fff); text-decoration: none; display: block; }');
  lines.push('    .page-card h3 { margin: 0 0 0.5rem 0; font-size: 1.25rem; }');
  lines.push('    .page-card p { margin: 0 0 0.75rem 0; color: var(--text-secondary, #aaa); font-size: 0.875rem; }');
  lines.push('    .page-card .stats { font-size: 0.75rem; color: var(--text-tertiary, #666); }');
  lines.push('    .site-header { text-align: center; margin-bottom: 2rem; }');
  lines.push('    .site-header h1 { font-size: 2.5rem; margin: 0; }');
  lines.push('    .site-header p { color: var(--text-secondary, #aaa); margin: 0.5rem 0 0; }');
  lines.push('    .site-stats { text-align: center; color: var(--text-secondary, #aaa); font-size: 0.875rem; margin-bottom: 2rem; }');
  lines.push('  </style>');
  lines.push('</head>');
  lines.push('');
  lines.push('<body>');
  lines.push('  <div class="site-index">');
  lines.push('    <div class="site-header">');
  lines.push(`      <h1>${siteSchema.title}</h1>`);
  if (siteSchema.description) {
    lines.push(`      <p>${siteSchema.description}</p>`);
  }
  lines.push('    </div>');

  // Stats
  const totalPages = pageResults.filter(p => p.status === 'ok').length;
  const totalComponents = pageResults.reduce((s, p) => s + (p.componentCount || 0), 0);
  const totalDemos = pageResults.reduce((s, p) => s + (p.totalDemos || 0), 0);
  lines.push(`    <div class="site-stats">${totalPages} pages · ${totalComponents} components · ${totalDemos} demos</div>`);

  lines.push('    <div class="page-grid">');
  for (const page of pageResults) {
    if (page.status !== 'ok') continue;
    lines.push('      <div class="page-card">');
    lines.push(`        <a href="${page.filename}">`);
    lines.push(`          <h3>${page.icon || '📦'} ${page.title}</h3>`);
    if (page.description) {
      lines.push(`          <p>${page.description}</p>`);
    }
    lines.push(`          <span class="stats">${page.componentCount || 0} components · ${page.sectionCount || 0} sections · ${page.totalDemos || 0} demos</span>`);
    lines.push('        </a>');
    lines.push('      </div>');
  }
  lines.push('    </div>');
  lines.push('  </div>');

  // Scripts
  lines.push('  <script type="module">');
  lines.push("    import WB from '../../src/core/wb-lazy.js';");
  lines.push('    window.WB = WB;');
  lines.push('    await WB.init({ autoInject: true });');
  lines.push('    await WB.scan(document.body, { eager: true });');
  lines.push(`    console.log('${siteSchema.title} index initialized');`);
  lines.push('  </script>');

  lines.push('</body>');
  lines.push('');
  lines.push('</html>');

  return lines.join('\n');
}

// ─── Generate a single page HTML (inline, no temp file dance) ───

function generatePageHtml(pageSchema) {
  const lines = [];

  lines.push('<!DOCTYPE html>');
  lines.push(`<html lang="${pageSchema.page?.lang || 'en'}"${pageSchema.page?.theme ? ` data-theme="${pageSchema.page.theme}"` : ''}>`);
  lines.push('');
  lines.push('<head>');
  lines.push('  <meta charset="UTF-8">');
  lines.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
  lines.push(`  <title>${pageSchema.page?.title || pageSchema.title || 'Generated Page'}</title>`);
  if (pageSchema.page?.stylesheets) {
    for (const href of pageSchema.page.stylesheets) {
      lines.push(`  <link rel="stylesheet" href="${href}">`);
    }
  }
  lines.push('');
  lines.push('</head>');
  lines.push('');
  lines.push('<body>');

  // Nav back to index
  lines.push('  <nav style="margin-bottom: 1rem;">');
  lines.push('    <a href="index.html" style="color: var(--text-secondary, #aaa); text-decoration: none;">← Back to Index</a>');
  lines.push('  </nav>');

  if (pageSchema.header) {
    const h = pageSchema.header;
    lines.push(`  <${h.tag || 'h1'}>${h.content}</${h.tag || 'h1'}>`);
    if (h.subtitle) {
      lines.push(`  <${h.subtitle.tag || 'p'}>${h.subtitle.content}</${h.subtitle.tag || 'p'}>`);
    }
    lines.push('');
  }

  if (pageSchema.sections) {
    const seenIds = new Set();
    for (let i = 0; i < pageSchema.sections.length; i++) {
      const section = pageSchema.sections[i];
      let sectionId = section.id || slugify(section.component ? `${section.component}-${section.heading}` : section.heading);
      if (seenIds.has(sectionId)) sectionId = `${sectionId}-${i}`;
      seenIds.add(sectionId);
      lines.push(`  <!-- ${i + 1}. ${section.heading} -->`);
      lines.push(`  <section id="${sectionId}">`);
      lines.push(`  <h2>${section.heading}</h2>`);
      if (section.raw) {
        lines.push(section.raw);
        if (section.script) {
          lines.push('  <script type="module">');
          lines.push(section.script);
          lines.push('  </script>');
        }
        lines.push('  </section>');
        lines.push('');
        continue;
      }
      lines.push(`  <wb-demo columns="${section.columns || 3}">`);
      for (const demo of (section.demos || [])) {
        const attrs = Object.entries(demo.attrs || {})
          .map(([k, v]) => {
            if (v === true) return ` ${k}`;
            if (v === false || v === null || v === undefined) return '';
            return ` ${k}="${String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}"`;
          })
          .join('');
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
      lines.push('  </section>');
      lines.push('');
    }
  }

  if (pageSchema.page?.scripts) {
    for (const script of pageSchema.page.scripts) {
      lines.push('  <script type="module">');
      lines.push(`    import WB from '${script.src}';`);
      lines.push('    window.WB = WB;');
      lines.push(`    await ${script.init};`);
      // init()'s own scan() defers everything to an IntersectionObserver
      // (perf win for long content pages) -- wrong tradeoff here: every
      // element on this page IS a worked example, expected to render
      // correctly the instant the page loads, not once scrolled near.
      // Same fix demos/playground.html already applies for the same reason.
      lines.push('    await WB.scan(document.body, { eager: true });');
      lines.push(`    console.log('${pageSchema.title} initialized');`);
      lines.push('  </script>');
    }
  }

  lines.push('</body>');
  lines.push('');
  lines.push('</html>');

  return lines.join('\n');
}

// ─── Main ───

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
const siteSchemaPath = args[0];
const dryRun = flags.includes('--dry-run');
const indexOnly = flags.includes('--index-only');

if (!siteSchemaPath) {
  console.error('Usage:');
  console.error('  node scripts/generate-site.mjs <site-schema.json>');
  console.error('  node scripts/generate-site.mjs <site-schema.json> --dry-run');
  console.error('  node scripts/generate-site.mjs <site-schema.json> --index-only');
  process.exit(1);
}

console.log(`\n🌐 Site Generator — Phase 4`);
console.log(`   Schema: ${siteSchemaPath}`);
console.log(`   Mode: ${dryRun ? 'DRY RUN (validate only)' : indexOnly ? 'INDEX ONLY' : 'FULL BUILD'}\n`);

const siteSchema = loadJSON(siteSchemaPath);
const outputDir = resolve(siteSchema.outputDir || 'demos/site');

// Ensure output directory exists
mkdirSync(outputDir, { recursive: true });

const pageResults = [];
const startTime = Date.now();

for (const pageDef of (siteSchema.pages || [])) {
  const pageId = pageDef.id;
  console.log(`\n─── Page: ${pageDef.icon || '📦'} ${pageDef.title} (${pageId}) ───`);

  // Option A: Components list → auto-generate multi-component page
  if (pageDef.components && pageDef.components.length > 0) {
    const { pageSchema, componentResults } = buildMultiComponentPage(pageDef, siteSchema.defaults);

    const foundCount = componentResults.filter(c => c.status === 'ok').length;
    const missingCount = componentResults.filter(c => c.status === 'not_found').length;
    const sectionCount = pageSchema.sections.length;
    const totalDemos = pageSchema.sections.reduce((s, sec) => s + (sec.demos?.length || 0), 0);

    console.log(`  Components: ${foundCount} found, ${missingCount} missing`);
    console.log(`  Sections: ${sectionCount}, Demos: ${totalDemos}`);

    if (missingCount > 0) {
      const missing = componentResults.filter(c => c.status === 'not_found').map(c => c.name);
      console.warn(`  ⚠️ Missing: ${missing.join(', ')}`);
    }

    if (dryRun) {
      console.log(`  ✅ [DRY RUN] Would generate ${pageId}.html`);
      pageResults.push({
        id: pageId,
        title: pageDef.title,
        description: pageDef.description,
        icon: pageDef.icon,
        status: 'ok',
        filename: `${pageId}.html`,
        componentCount: foundCount,
        sectionCount,
        totalDemos,
        components: componentResults
      });
      continue;
    }

    if (indexOnly) {
      // Just collect metadata, don't regenerate
      const htmlPath = join(outputDir, `${pageId}.html`);
      pageResults.push({
        id: pageId,
        title: pageDef.title,
        description: pageDef.description,
        icon: pageDef.icon,
        status: existsSync(htmlPath) ? 'ok' : 'missing',
        filename: `${pageId}.html`,
        componentCount: foundCount,
        sectionCount,
        totalDemos,
        components: componentResults
      });
      continue;
    }

    // Write page schema to temp location
    const tempSchemaPath = join(PAGES_DIR, `_site-${pageId}.page.json`);
    writeFileSync(tempSchemaPath, JSON.stringify(pageSchema, null, 2), 'utf-8');

    // Generate HTML directly (inline — avoids temp file pipeline overhead)
    const html = generatePageHtml(pageSchema);
    const htmlPath = join(outputDir, `${pageId}.html`);
    writeFileSync(htmlPath, html, 'utf-8');
    console.log(`  ✅ Generated: ${htmlPath}`);

    // Clean up temp schema
    try {
      const { unlinkSync } = await import('fs');
      unlinkSync(tempSchemaPath);
    } catch { /* ok if cleanup fails */ }

    pageResults.push({
      id: pageId,
      title: pageDef.title,
      description: pageDef.description,
      icon: pageDef.icon,
      status: 'ok',
      filename: `${pageId}.html`,
      componentCount: foundCount,
      sectionCount,
      totalDemos,
      components: componentResults
    });
  }
  // Option B: Reference an existing page schema
  else if (pageDef.schema) {
    const schemaPath = resolve(pageDef.schema);
    if (!existsSync(schemaPath)) {
      console.error(`  ❌ Page schema not found: ${pageDef.schema}`);
      pageResults.push({ id: pageId, title: pageDef.title, status: 'error', error: 'schema_not_found' });
      continue;
    }

    if (dryRun) {
      const schema = loadJSON(schemaPath);
      const sectionCount = schema.sections?.length || 0;
      const totalDemos = schema.sections?.reduce((s, sec) => s + (sec.demos?.length || 0), 0) || 0;
      console.log(`  ✅ [DRY RUN] Would generate ${pageId}.html from ${pageDef.schema}`);
      pageResults.push({
        id: pageId,
        title: pageDef.title,
        description: pageDef.description,
        icon: pageDef.icon,
        status: 'ok',
        filename: `${pageId}.html`,
        sectionCount,
        totalDemos
      });
      continue;
    }

    // Use generate-page.mjs for existing schemas (handles composition + validation)
    const htmlPath = join(outputDir, `${pageId}.html`);
    try {
      execSync(
        `node scripts/generate-page.mjs ${schemaPath} ${htmlPath} --skip-validation`,
        { encoding: 'utf-8', cwd: resolve('.') }
      );
      const schema = loadJSON(schemaPath);
      const sectionCount = schema.sections?.length || 0;
      const totalDemos = schema.sections?.reduce((s, sec) => s + (sec.demos?.length || 0), 0) || 0;
      console.log(`  ✅ Generated: ${htmlPath}`);
      pageResults.push({
        id: pageId,
        title: pageDef.title,
        description: pageDef.description,
        icon: pageDef.icon,
        status: 'ok',
        filename: `${pageId}.html`,
        sectionCount,
        totalDemos
      });
    } catch (e) {
      console.error(`  ❌ Generation failed: ${e.message}`);
      pageResults.push({ id: pageId, title: pageDef.title, status: 'error', error: e.message });
    }
  }
  else {
    console.warn(`  ⚠️ Page "${pageId}" has no components or schema — skipping`);
    pageResults.push({ id: pageId, title: pageDef.title, status: 'skipped' });
  }
}

// ─── Generate Index Page ───

if (siteSchema.generateIndex !== false) {
  console.log('\n─── Generating Index Page ───');
  const indexHtml = generateIndexHtml(siteSchema, pageResults);
  const indexPath = join(outputDir, 'index.html');
  writeFileSync(indexPath, indexHtml, 'utf-8');
  console.log(`  ✅ Index: ${indexPath}`);
}

// ─── Write Results ───

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
const okCount = pageResults.filter(p => p.status === 'ok').length;
const errCount = pageResults.filter(p => p.status === 'error').length;
const skipCount = pageResults.filter(p => p.status === 'skipped').length;

const result = {
  generatedAt: new Date().toISOString(),
  siteSchema: siteSchemaPath,
  outputDir,
  elapsed: `${elapsed}s`,
  summary: {
    totalPages: siteSchema.pages?.length || 0,
    generated: okCount,
    errors: errCount,
    skipped: skipCount,
    totalComponents: pageResults.reduce((s, p) => s + (p.componentCount || 0), 0),
    totalSections: pageResults.reduce((s, p) => s + (p.sectionCount || 0), 0),
    totalDemos: pageResults.reduce((s, p) => s + (p.totalDemos || 0), 0)
  },
  pages: pageResults
};

writeFileSync(resolve('data/site-generator-result.json'), JSON.stringify(result, null, 2), 'utf-8');

console.log(`\n══════════════════════════════════════════`);
console.log(`  🌐 Site Generation Complete`);
console.log(`  Pages: ${okCount}/${siteSchema.pages?.length || 0} generated`);
if (errCount > 0) console.log(`  Errors: ${errCount}`);
console.log(`  Components: ${result.summary.totalComponents}`);
console.log(`  Sections: ${result.summary.totalSections}`);
console.log(`  Demos: ${result.summary.totalDemos}`);
console.log(`  Time: ${elapsed}s`);
console.log(`  Output: ${outputDir}/`);
console.log(`══════════════════════════════════════════`);

if (errCount > 0) process.exit(1);
