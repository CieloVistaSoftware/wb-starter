// Copyright (c) CieloVista Software. All rights reserved.
//
// Codemod: convert deprecated `data-*` config attributes in demo HTML to plain
// v3 attributes (drop the `data-` prefix). v3 components read plain attributes
// (variant, size, tooltip, value-suffix, …), not `data-*`.
//
// Rules:
//   - `data-<name>="…"`  ->  `<name>="…"`   (for every real attribute usage)
//   - KEEP `data-theme` — framework theme hook on <html>, read by src/core/theme.js
//   - `data-class="x"` -> `class="x"`, MERGING with any existing `class="…"` on
//     the same element into a single space-separated `class` attribute.
//   - Skip demos/legacy-syntax-check.html — intentional legacy syntax.
//   - Only rewrites attribute usages (`data-x=`), never prose.

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const EXCLUDE = new Set(['legacy-syntax-check.html']);
const KEEP = new Set(['data-theme']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'data', 'test-results', '.playwright-artifacts', 'coverage', 'dist', 'out']);

/** @param {string} dir @param {string[]} out */
function walk(dir, out) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (e.name.endsWith('.html') && !EXCLUDE.has(e.name)) out.push(abs);
  }
}

/**
 * Merge a converted `data-class` value into any existing `class="…"` on the same
 * open tag. Operates on a single tag string (from `<` to the matching `>`).
 * @param {string} tag
 * @param {string} classValue  value that was on data-class
 * @returns {string}
 */
function mergeClassIntoTag(tag, classValue) {
  // Match a real `class="…"` attribute, but NOT the `class` inside `data-class`
  // (a `-` before `class` still counts as a word boundary, so guard explicitly).
  const existing = tag.match(/(?<![-\w])class\s*=\s*"([^"]*)"/i);
  if (existing) {
    const merged = (existing[1].trim() + ' ' + classValue.trim()).trim();
    return tag.replace(/(?<![-\w])class\s*=\s*"[^"]*"/i, `class="${merged}"`);
  }
  // No existing class attribute — emit a plain class attribute.
  return tag.replace(/\bdata-class\s*=\s*"[^"]*"/i, `class="${classValue}"`);
}

/**
 * Rewrite one file's content. Returns { content, conversions } where conversions
 * is a Set of `data-x -> x` (or `data-class -> class`) strings performed.
 *
 * Two passes:
 *   1) `data-class` merge — scoped to real open tags so we can fold the value
 *      into an existing `class="…"` on the same element (never emit two `class`
 *      attrs). Escaped code samples never carry a competing class, so tag-scoping
 *      is the safe place to do this.
 *   2) Every remaining `data-<name>=` (real tags AND escaped `&lt;…&gt;` code
 *      samples) has its `data-` prefix dropped. The gate scans raw text, so the
 *      code samples that teach deprecated syntax must be converted too.
 *
 * @param {string} content
 */
function rewrite(content) {
  const conversions = new Set();

  // Pass 1: data-class -> class, merging within each real open tag.
  let out = content.replace(/<[a-zA-Z][^>]*>/g, (tag) => {
    const dc = tag.match(/\bdata-class\s*=\s*"([^"]*)"/i);
    if (!dc) return tag;
    conversions.add('data-class -> class');
    return mergeClassIntoTag(tag, dc[1]);
  });

  // Pass 2: drop the data- prefix everywhere (except data-theme; data-class is
  // already handled above and no longer present).
  out = out.replace(/\bdata-([a-z][a-z0-9-]*)(\s*=)/gi, (full, name, eq) => {
    const dataName = ('data-' + name).toLowerCase();
    if (KEEP.has(dataName)) return full; // keep data-theme
    conversions.add(`data-${name} -> ${name}`);
    return name + eq;
  });

  return { content: out, conversions };
}

function main() {
  const files = [];
  walk(path.join(ROOT, 'demos'), files);

  const changed = [];
  const allConversions = new Set();

  for (const abs of files) {
    const before = fs.readFileSync(abs, 'utf8');
    const { content: after, conversions } = rewrite(before);
    if (after !== before) {
      fs.writeFileSync(abs, after, 'utf8');
      const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
      changed.push({ rel, conversions: [...conversions].sort() });
      for (const c of conversions) allConversions.add(c);
    }
  }

  console.log(`\nmigrate-demo-data-attrs: ${changed.length} file(s) changed\n`);
  for (const { rel, conversions } of changed) {
    console.log(`  ${rel}`);
    console.log(`      ${conversions.join(', ')}`);
  }
  console.log(`\nUnique conversions performed (${allConversions.size}):`);
  for (const c of [...allConversions].sort()) console.log(`  ${c}`);
}

main();
