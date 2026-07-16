import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nativeMap, elementMap } from '../src/core/tag-map.js';

// Finds every code example where an x-behavior="<name>" (or shorthand
// x-<name>) attribute duplicates a behavior the element already gets for
// free via autoinject (src/core/tag-map.js nativeMap/elementMap) -- e.g.
// <input x-behavior="input">, <form x-form>, <wb-input x-input>. These are
// always redundant: the tag alone already produces exactly that behavior
// (wb.js inject() dedupes by behavior name per element, so it isn't a
// double-render bug -- but the markup is misleading and must not appear in
// any doc/demo example). Run with --fix to strip the redundant attribute
// (and, for x-behavior="name", the whole attribute) from every violation.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FIX = process.argv.includes('--fix');

const SCAN_TARGETS = [
  { dir: 'docs', exts: ['.md'] },
  { dir: 'demos', exts: ['.html'] },
  { dir: 'pages', exts: ['.html'] },
  { dir: 'public', exts: ['.html'] },
];
const JSON_TARGETS = ['src/wb-models/pages']; // *.site.json manualSections

const SKIP_DIR = /^(\.|node_modules$|out$|coverage$)/;

// tag/selector -> behavior, first-match-wins order (mirrors getNativeBehavior)
const SELECTOR_BEHAVIOR_PAIRS = [
  ...Object.entries(nativeMap),
  ...Object.entries(elementMap),
];

function tagAutoBehavior(tagName, attrsString) {
  const lower = tagName.toLowerCase();
  for (const [selector, behavior] of SELECTOR_BEHAVIOR_PAIRS) {
    if (!selector.includes('[')) {
      if (selector === lower) return behavior;
      continue;
    }
    const m = selector.match(/^([a-z0-9-]+)\[([a-z-]+)=["']([^"']+)["']\]$/i);
    if (!m) continue;
    const [, selTag, attr, val] = m;
    if (selTag !== lower) continue;
    const attrRe = new RegExp(`\\b${attr}\\s*=\\s*["']${val}["']`, 'i');
    if (attrRe.test(attrsString)) return behavior;
  }
  return null;
}

const TAG_RE = /<([a-zA-Z][a-zA-Z0-9-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gd;
const XBEHAVIOR_ATTR_RE = /\bx-behavior\s*=\s*["']([a-zA-Z0-9_-]+)["']/d;
const XSHORTHAND_RE = /\bx-([a-zA-Z][a-zA-Z0-9_-]*)\b(?!\s*=)/gd;

// Returns [{ tagName, behavior, kind, start, end }] with GLOBAL offsets into `text`.
function findViolations(text) {
  const violations = [];
  TAG_RE.lastIndex = 0;
  let m;
  while ((m = TAG_RE.exec(text))) {
    const [, tagName, attrs] = m;
    const attrsStart = m.indices[2][0];
    const auto = tagAutoBehavior(tagName, attrs);
    if (!auto) continue;

    const xb = XBEHAVIOR_ATTR_RE.exec(attrs);
    XBEHAVIOR_ATTR_RE.lastIndex = 0;
    if (xb && xb[1] === auto) {
      violations.push({
        tagName, behavior: auto, kind: 'x-behavior',
        start: attrsStart + xb.indices[0][0],
        end: attrsStart + xb.indices[0][1],
      });
    }

    XSHORTHAND_RE.lastIndex = 0;
    let sm;
    while ((sm = XSHORTHAND_RE.exec(attrs))) {
      if (sm[1] === 'behavior') continue;
      if (sm[1] === auto) {
        violations.push({
          tagName, behavior: auto, kind: `x-${sm[1]}`,
          start: attrsStart + sm.indices[0][0],
          end: attrsStart + sm.indices[0][1],
        });
      }
    }
  }
  return violations;
}

// Strips each violation's attribute text from `text`, also eating a
// preceding newline+indent run (multi-line attribute lists) or else a
// single following space (inline attribute lists), so no blank line or
// double space is left behind. Applies last-to-first to keep offsets valid.
function stripViolations(text, violations) {
  const sorted = [...violations].sort((a, b) => b.start - a.start);
  for (const v of sorted) {
    let { start, end } = v;
    const before = text.slice(Math.max(0, start - 60), start);
    const nlMatch = before.match(/[\r\n]+[ \t]*$/);
    if (nlMatch) {
      start -= nlMatch[0].length;
    } else if (text[end] === ' ') {
      end += 1;
    }
    text = text.slice(0, start) + text.slice(end);
  }
  return text;
}

function walk(dir, exts, out) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR.test(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, exts, out);
    } else if (exts.includes(path.extname(entry.name))) {
      out.push(full);
    }
  }
}

function auditPlainFile(file, results) {
  const text = fs.readFileSync(file, 'utf8');
  const violations = findViolations(text);
  if (!violations.length) return;
  results.push({ file, count: violations.length, tags: [...new Set(violations.map(v => `${v.tagName}[${v.kind}]`))] });
  if (FIX) {
    fs.writeFileSync(file, stripViolations(text, violations));
  }
}

function auditSiteJson(file, results) {
  const raw = fs.readFileSync(file, 'utf8');
  const data = JSON.parse(raw);
  let changed = false;
  const fileViolations = [];

  for (const page of data.pages || []) {
    for (const section of page.manualSections || []) {
      for (const field of ['html', 'script']) {
        if (typeof section[field] !== 'string') continue;
        const violations = findViolations(section[field]);
        if (!violations.length) continue;
        fileViolations.push({ section: section.id || section.heading, field, count: violations.length, tags: [...new Set(violations.map(v => `${v.tagName}[${v.kind}]`))] });
        if (FIX) {
          section[field] = stripViolations(section[field], violations);
          changed = true;
        }
      }
    }
  }

  if (fileViolations.length) {
    results.push({ file, sections: fileViolations });
  }
  if (FIX && changed) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  }
}

const plainFiles = [];
for (const { dir, exts } of SCAN_TARGETS) {
  walk(path.join(ROOT, dir), exts, plainFiles);
}

const plainResults = [];
for (const file of plainFiles) auditPlainFile(file, plainResults);

const jsonFiles = [];
for (const dir of JSON_TARGETS) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) continue;
  for (const entry of fs.readdirSync(full)) {
    if (entry.endsWith('.site.json')) jsonFiles.push(path.join(full, entry));
  }
}

const jsonResults = [];
for (const file of jsonFiles) auditSiteJson(file, jsonResults);

const totalPlain = plainResults.reduce((n, r) => n + r.count, 0);
const totalJson = jsonResults.reduce((n, r) => n + r.sections.reduce((s, sec) => s + sec.count, 0), 0);
const total = totalPlain + totalJson;

console.log(`x-behavior redundancy audit — ${FIX ? 'FIX' : 'REPORT'} mode`);
console.log('='.repeat(60));

for (const r of plainResults) {
  console.log(`${path.relative(ROOT, r.file)}: ${r.count} violation(s) — ${r.tags.join(', ')}`);
}
for (const r of jsonResults) {
  console.log(`${path.relative(ROOT, r.file)}:`);
  for (const s of r.sections) {
    console.log(`  [${s.section}].${s.field}: ${s.count} violation(s) — ${s.tags.join(', ')}`);
  }
}

console.log('='.repeat(60));
console.log(`Total violations: ${total} across ${plainResults.length + jsonResults.length} file(s)`);
if (!FIX && total > 0) {
  console.log('Run with --fix to strip the redundant attributes.');
}

process.exit(total > 0 && !FIX ? 1 : 0);
