#!/usr/bin/env node
/**
 * generate-page-from-schema.mjs
 * =============================
 * Automated page generator for schemaType: "page" schemas.
 * 
 * Input:  A .schema.json file with schemaType: "page"
 * Output: An HTML fragment in pages/
 * 
 * Usage:
 *   node scripts/generate-page-from-schema.mjs src/wb-models/home-page.schema.json
 *   node scripts/generate-page-from-schema.mjs src/wb-models/home-page.schema.json pages/home.html
 *   node scripts/generate-page-from-schema.mjs src/wb-models/home-page.schema.json --dry-run
 */
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const schemaPath = args.find(a => a.endsWith('.json'));
const outputArg = args.find(a => a.endsWith('.html'));

if (!schemaPath) {
  console.error('Usage: node scripts/generate-page-from-schema.mjs <schema.json> [output.html] [--dry-run]');
  process.exit(1);
}

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

if (schema.schemaType !== 'page') {
  console.error(`Error: ${schemaPath} is schemaType "${schema.schemaType}", not "page".`);
  process.exit(1);
}

const schemaName = path.basename(schemaPath, '.schema.json');
const pageName = schemaName.replace(/-page$/, '');
const outputPath = outputArg || `pages/${pageName}.html`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── View Renderers ───────────────────────────────────────────────────────────

function renderView(viewName) {
  const viewDef = schema.$view?.find(v => v.name === viewName);
  if (!viewDef) return `<!-- ERROR: no $view entry for "${viewName}" -->`;

  switch (viewDef.tag) {
    case 'wb-cardhero': return renderHero(viewDef);
    case 'wb-container': return renderContainer(viewDef);
    case 'wb-grid': return renderGrid(viewDef);
    case 'wb-stack': return renderStack(viewDef);
    case 'wb-audio': return renderAudio(viewDef);
    default: return `<!-- TODO: renderer for ${viewDef.tag} -->`;
  }
}

function renderHero(viewDef) {
  const heroProps = schema.properties?.hero?.properties || {};
  const attrs = [];
  for (const attrDef of viewDef.attributes || []) {
    const propName = attrDef.name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const value = heroProps[propName]?.default || attrDef.example;
    if (value) attrs.push(`${attrDef.name}="${escapeHtml(value)}"`);
  }
  return `<wb-cardhero ${attrs.join(' ')}></wb-cardhero>`;
}

function renderContainer(viewDef) {
  const lines = [];
  const attrs = (viewDef.attributes || []).map(a => `${a.name}="${a.example}"`).join(' ');
  lines.push(`<wb-container ${attrs}>`);

  for (const child of viewDef.children || []) {
    if ((child.tag === 'wb-grid' || child.tag === 'wb-row') && child.children?.[0]?.tag === 'wb-cardstats') {
      const attrs = (child.attributes || []).map(a => `${a.name}="${a.example}"`).join(' ');
      lines.push(`  <${child.tag} ${attrs}>`);
      for (const stat of schema.properties?.stats?.default || []) {
        lines.push(`    <wb-cardstats value="${escapeHtml(stat.value)}" label="${escapeHtml(stat.label)}" icon="${stat.icon}"></wb-cardstats>`);
      }
      lines.push(`  </${child.tag}>`);
    } else if (child.tag === 'div' && child.className) {
      lines.push(`  <div class="${child.className}"></div>`);
    } else if (child.tag === 'wb-row' && child.children?.[0]?.tag === 'button') {
      const rowAttrs = (child.attributes || []).map(a => `${a.name}="${a.example}"`).join(' ');
      lines.push(`  <wb-row ${rowAttrs}>`);
      for (const action of schema.properties?.actions?.default || []) {
        if (action.behavior === 'x-tooltip') {
          lines.push(`    <button ${action.behavior}="I appear on hover!">${action.label}</button>`);
        } else {
          lines.push(`    <button ${action.behavior}>${action.label}</button>`);
        }
      }
      lines.push(`  </wb-row>`);
    }
  }
  lines.push(`</wb-container>`);
  return lines.join('\n');
}

function renderGrid(viewDef) {
  const lines = ['<wb-grid>'];
  const variant = viewDef.children?.[0]?.attributes?.find(a => a.name === 'variant')?.example || '';
  for (const feature of schema.properties?.features?.default || []) {
    lines.push(`  <wb-card${variant ? ` variant="${variant}"` : ''}>`);
    lines.push(`    <h3>${feature.title}</h3>`);
    lines.push(`    <p>${feature.description}</p>`);
    lines.push(`  </wb-card>`);
  }
  lines.push('</wb-grid>');
  return lines.join('\n');
}

function renderStack(viewDef) {
  const lines = ['<wb-stack>'];
  const childTag = viewDef.children?.[0]?.tag || 'wb-cardnotification';
  for (const notif of schema.properties?.notifications?.default || []) {
    const variant = notif.variant || notif.type || 'info';
    lines.push(`  <${childTag} variant="${variant}" title="${escapeHtml(notif.title)}" message="${escapeHtml(notif.message)}"></${childTag}>`);
  }
  lines.push('</wb-stack>');
  return lines.join('\n');
}

function renderAudio(viewDef) {
  const audioProps = schema.properties?.audio?.properties || {};
  const attrs = [];
  for (const attrDef of viewDef.attributes || []) {
    const propName = attrDef.name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const propDefault = audioProps[propName]?.default;
    if (attrDef.name === 'src') {
      attrs.push(`src="https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Tours/Enthusiast/Tours_-_01_-_Enthusiast.mp3"`);
    } else if (attrDef.name === 'show-eq') {
      attrs.push('show-eq');
    } else if (propDefault !== undefined) {
      attrs.push(`${attrDef.name}="${propDefault}"`);
    } else if (attrDef.example) {
      attrs.push(`${attrDef.name}="${attrDef.example}"`);
    }
  }
  return `<wb-audio ${attrs.join(' ')}></wb-audio>`;
}

// ─── Page Assembly ────────────────────────────────────────────────────────────
// ZERO inline styles. Uses .page-layout class from site.css for gap.
// Components are direct children — no wrapper divs/sections.
// This keeps the DOM flat so tests can find elements as body > tag.

function generatePage() {
  const { pageRules, $layout } = schema;
  const lines = [];

  lines.push(`<!-- ${schema.title} — generated from ${path.basename(schemaPath)} -->`);
  lines.push(`<!-- pageRules: ${Object.entries(pageRules).map(([k,v]) => `${k}=${v}`).join(', ')} -->`);
  lines.push(`<!-- $layout: ${$layout.rows.length} rows, gap=${$layout.gap}, maxWidth=${$layout.maxWidth} -->`);
  lines.push('');

  for (let i = 0; i < $layout.rows.length; i++) {
    const row = $layout.rows[i];

    // h1 for headingLevel 1
    if (row.headingLevel === 1) {
      const sectionName = row.content[0];
      const title = schema.properties?.[sectionName]?.properties?.title?.default || schema.title;
      lines.push(`<h1>${escapeHtml(title)}</h1>`);
    } else if (row.heading) {
      lines.push(`<h${row.headingLevel}>${escapeHtml(row.heading)}</h${row.headingLevel}>`);
      if (row.subheading) {
        lines.push(`<p>${escapeHtml(row.subheading)}</p>`);
      }
    }

    // Render each content section as a direct child
    for (const sectionName of row.content) {
      lines.push(renderView(sectionName));
    }

    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
}

// ─── Output ───────────────────────────────────────────────────────────────────

const html = generatePage();

const errors = [];
if (schema.pageRules.fragment) {
  if (html.toLowerCase().includes('<!doctype')) errors.push('Contains <!DOCTYPE>');
  if (/<html[\s>]/i.test(html)) errors.push('Contains <html>');
  if (/<head[\s>]/i.test(html)) errors.push('Contains <head>');
  if (/<body[\s>]/i.test(html)) errors.push('Contains <body>');
}
if (schema.pageRules.noInlineStyles) {
  const styleMatches = html.match(/\sstyle\s*=/gi) || [];
  if (styleMatches.length > 0) errors.push(`${styleMatches.length} inline style(s) found`);
}
if (!/<h1[\s>]/i.test(html)) errors.push('Missing <h1>');
if (!/<h2[\s>]/i.test(html)) errors.push('Missing <h2>');

if (errors.length) {
  console.error('⚠️  Validation warnings:');
  errors.forEach(e => console.error(`   - ${e}`));
}

if (dryRun) {
  console.log(html);
  console.log(`--- Would write to: ${outputPath} ---`);
} else {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`✅ Generated: ${outputPath} (${schema.$layout.rows.length} rows, ${schema.$layout.rows.flatMap(r => r.content).length} sections)`);
  if (errors.length) console.log(`   ⚠️  ${errors.length} warning(s)`);
  else console.log(`   ✓ All pageRules passed`);
}

if (!dryRun) {
  fs.writeFileSync('data/page-from-schema-result.json', JSON.stringify({
    schema: schemaPath, output: outputPath, dryRun, errors,
    rows: schema.$layout.rows.length,
    sections: schema.$layout.rows.flatMap(r => r.content),
    generatedAt: new Date().toISOString()
  }, null, 2));
}
