#!/usr/bin/env node
/**
 * Hardcoded-color audit. Standard: ZERO hardcoded colors outside themes.css —
 * every color must be a theme variable so the theme system controls the palette.
 *
 * Scans src/ (CSS + JS) for color LITERALS: hex, rgb()/rgba(), hsl()/hsla() with
 * numeric args, and common named colors. Distinguishes:
 *   - BARE literal          → highest priority (unthemed color)
 *   - var(--x, #lit) fallback → lower priority (themed, literal is only a fallback)
 * Skips themes.css (where literals are defined), vendored libs, node_modules.
 *
 * Output: data/hardcoded-colors.json + a grouped console report.
 * Exit 1 if any BARE literal is found.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['src'];
const EXTS = new Set(['.css', '.js', '.ts', '.mjs']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'lib', 'vendor', 'dist', 'out']);
// themes.css is the ONE place literals are allowed (they define the vars).
const ALLOW_FILES = new Set(['themes.css']);

const NAMED = ['white', 'black', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
  'gray', 'grey', 'silver', 'gold', 'pink', 'cyan', 'magenta', 'lime', 'navy', 'teal'];

// A color literal: hex, rgb/rgba(<digit>…), hsl/hsla(<digit>…) — hsl(var(…)) is NOT
// a literal. Named colors matched as a CSS value (preceded by : or , or whitespace).
const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;
const RGB = /\brgba?\(\s*\d[^)]*\)/g;
const HSL = /\bhsla?\(\s*\.?\d[^)]*\)/g; // leading digit → literal (hsl(var(…)) skipped)
const NAMEDRE = new RegExp(`(?<=[:,\\s(])(?:${NAMED.join('|')})(?=[;,\\s)!]|$)`, 'gi');

function walk(dir, out) {
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (SKIP_DIRS.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (EXTS.has(path.extname(e.name)) && !ALLOW_FILES.has(e.name)) out.push(abs);
  }
}

// Is the match inside a `var(--x, <here>)` fallback? Cheap heuristic: the text
// just before the match on the same line contains an unclosed `var(` with a comma.
function isFallback(line, index) {
  const before = line.slice(0, index);
  const lastVar = before.lastIndexOf('var(');
  if (lastVar === -1) return false;
  const between = before.slice(lastVar);
  return between.includes(',') && !between.slice(between.indexOf(',')).includes(')');
}

const files = [];
for (const d of DIRS) walk(path.join(ROOT, d), files);

const byFile = {};   // rel -> { bare: n, fallback: n, samples: Set }
const byColor = {};  // literal -> count (bare only)
let bare = 0, fallback = 0;

for (const abs of files) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
  const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
  lines.forEach((line, li) => {
    // skip comment-only lines cheaply
    for (const re of [HEX, RGB, HSL, NAMEDRE]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        const val = m[0].toLowerCase();
        const fb = isFallback(line, m.index);
        const f = (byFile[rel] = byFile[rel] || { bare: 0, fallback: 0, colors: {} });
        if (fb) { f.fallback++; fallback++; }
        else {
          f.bare++; bare++;
          byColor[val] = (byColor[val] || 0) + 1;
          f.colors[val] = (f.colors[val] || 0) + 1;
        }
      }
    }
  });
}

const fileList = Object.keys(byFile).sort((a, b) => byFile[b].bare - byFile[a].bare);
const colorList = Object.entries(byColor).sort((a, b) => b[1] - a[1]);

fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data/hardcoded-colors.json'),
  JSON.stringify({ totals: { bare, fallback, files: fileList.length }, byFile, byColor }, null, 2));

console.log(`Hardcoded-color audit — ${bare} BARE literal(s) + ${fallback} var() fallback(s) across ${fileList.length} file(s).\n`);
console.log('Top BARE literals:');
for (const [c, n] of colorList.slice(0, 25)) console.log(`  ${String(n).padStart(4)}  ${c}`);
console.log('\nFiles by BARE literal count:');
for (const rel of fileList.filter((f) => byFile[f].bare > 0).slice(0, 30)) {
  console.log(`  ${String(byFile[rel].bare).padStart(4)} bare / ${byFile[rel].fallback} fb  ${rel}`);
}
console.log('\nWrote data/hardcoded-colors.json');
process.exit(bare > 0 ? 1 : 0);
