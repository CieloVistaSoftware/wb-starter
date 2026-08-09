#!/usr/bin/env node
/**
 * generate-demo-page.js
 * Generic demo page generator - schema is the map, this is the builder.
 * Usage: node scripts/generate-demo-page.js <schema.json> [output.html]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function indent(text, spaces) {
  const pad = ' '.repeat(spaces);
  return text.split('\n').map(line => line.length ? pad + line : line).join('\n');
}

function attrsToString(attrs) {
  if (!attrs || typeof attrs !== 'object') return '';
  const parts = [];
  for (const [key, value] of Object.entries(attrs)) {
    if (value === true) { parts.push(key); }
    else if (value === false || value === null || value === undefined) { continue; }
    else { parts.push(`${key}="${String(value).replace(/"/g, '&quot;')}"`); }
  }
  return parts.length ? ' ' + parts.join(' ') : '';
}

const VOID_TAGS = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);

function renderElement(demo, depth) {
  const tag = demo.tag || 'div';
  const attrStr = attrsToString(demo.attrs);
  const pad = ' '.repeat(depth);
  let html = '';
  if (demo.comment) { html += `${pad}${demo.comment}\n`; }
  if (VOID_TAGS.has(tag)) { return html + `${pad}<${tag}${attrStr}>\n`; }
  const inner = demo.content || demo.textContent || '';
  if (!inner) {
    html += `${pad}<${tag}${attrStr}></${tag}>\n`;
  } else if (!inner.includes('\n') && inner.length < 80) {
    html += `${pad}<${tag}${attrStr}>${inner}</${tag}>\n`;
  } else {
    html += `${pad}<${tag}${attrStr}>\n${indent(inner, depth + 2)}\n${pad}</${tag}>\n`;
  }
  return html;
}

function generatePage(schema) {
  const page = schema.page || {};
  const sections = schema.sections || [];
  let h = '';
  h += `<!DOCTYPE html>\n`;
  h += `<html lang="${page.lang || 'en'}"${page.theme ? ` data-theme="${page.theme}"` : ''}>\n\n`;
  h += `<head>\n`;
  h += `  <meta charset="UTF-8">\n`;
  h += `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
  h += `  <title>${page.title || 'Demo Page'}</title>\n`;
  if (page.stylesheets) {
    for (const href of page.stylesheets) { h += `  <link rel="stylesheet" href="${href}">\n`; }
  }
  h += `\n</head>\n\n<body>\n`;
  if (page.title) {
    const icon = page.icon ? `${page.icon} ` : '';
    h += `  <h1>${icon}${page.title}</h1>\n`;
  }
  if (page.subtitle) { h += `  <p>${page.subtitle}</p>\n`; }
  h += `\n`;

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const hLvl = s.headingLevel || 2;
    const wrap = s.wrapper || 'wb-demo';
    const wAttrs = {};
    if (s.columns) wAttrs.columns = s.columns;
    if (s.wrapperAttrs) Object.assign(wAttrs, s.wrapperAttrs);

    h += `  <!-- ${i + 1}. ${s.heading} -->\n`;
    h += `  <h${hLvl}>${s.heading}</h${hLvl}>\n`;
    if (s.description) { h += `  <p>${s.description}</p>\n`; }
    h += `  <${wrap}${attrsToString(wAttrs)}>\n`;
    if (s.demos) {
      for (const demo of s.demos) { h += renderElement(demo, 4); }
    }
    h += `  </${wrap}>\n\n`;
  }

  if (page.scripts) {
    for (const script of page.scripts) {
      if (typeof script === 'string') {
        h += `  <script type="module">\n${indent(script, 4)}\n  </script>\n`;
      } else if (script.src) {
        const t = script.type ? ` type="${script.type}"` : '';
        h += `  <script${t} src="${script.src}"></script>\n`;
      } else if (script.inline) {
        const t = script.type ? ` type="${script.type}"` : ' type="module"';
        h += `  <script${t}>\n${indent(script.inline, 4)}\n  </script>\n`;
      }
    }
  }
  h += `</body>\n\n</html>\n`;
  return h;
}

const args = process.argv.slice(2);
if (!args.length) { console.error('Usage: node scripts/generate-demo-page.js <schema.json> [output.html]'); process.exit(1); }
const schemaPath = path.resolve(args[0]);
if (!fs.existsSync(schemaPath)) { console.error('Schema not found: ' + schemaPath); process.exit(1); }
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const html = generatePage(schema);
const outputPath = args[1] || schema.output || null;
if (outputPath) {
  const fullPath = path.isAbsolute(outputPath) ? outputPath : path.resolve(outputPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, html, 'utf8');
  console.log('Generated: ' + fullPath);
  console.log('Sections: ' + (schema.sections?.length || 0));
} else {
  process.stdout.write(html);
}
