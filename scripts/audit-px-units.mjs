#!/usr/bin/env node
/**
 * px-unit audit (#294). Standard: font-size/padding/margin/gap/border-radius/
 * width/height that should SCALE with the user's browser font-size setting
 * must use rem/em, not px. px is fixed and ignores accessibility zoom/font
 * preferences.
 *
 * Scans src/ (CSS + JS) for `<number>px` values and buckets them by the CSS
 * property they follow:
 *   - LIKELY-CONVERT: font-size, padding, margin, gap, border-radius, width,
 *     height, top/left/right/bottom, line-height (when in px)
 *   - LIKELY-OK: border(-width), outline, box-shadow, 1px/2px hairlines,
 *     transform/translate, media query breakpoints (@media), letter-spacing
 *   - UNCLASSIFIED: anything else (needs a human look)
 *
 * Output: data/px-audit.json + a grouped console report. The gate is
 * tests/compliance/px-total-only-shrinks.spec.ts.
 *
 * What counts (#294, 2026-10-15):
 *   - Only files git tracks. An ignored local folder (src/wb-overlay-ext/) is
 *     not the project's code and made the local count differ from CI's.
 *   - Only code. A px inside a comment ("measured 600px wide") is prose, not a
 *     size, so comments are blanked before matching.
 *   - A px that must stay px carries `px-ok: <reason>` in a comment on the
 *     same line. It is counted as ALLOWED, listed by line, and not in the
 *     gate's total.
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['src'];
const EXTS = new Set(['.css', '.js', '.ts', '.mjs']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'lib', 'vendor', 'dist', 'out']);

const LIKELY_CONVERT_PROPS = [
  'font-size', 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'gap', 'row-gap', 'column-gap', 'border-radius', 'width', 'height',
  'min-width', 'min-height', 'max-width', 'max-height',
  'top', 'left', 'right', 'bottom', 'line-height',
];
const LIKELY_OK_PROPS = [
  'border', 'border-width', 'border-top-width', 'border-right-width',
  'border-bottom-width', 'border-left-width', 'outline', 'outline-width',
  'box-shadow', 'transform', 'translate', 'letter-spacing', 'stroke-width',
];

function walk(dir, out) {
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (SKIP_DIRS.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (EXTS.has(path.extname(e.name))) out.push(abs);
  }
}

const walked = [];
for (const d of DIRS) walk(path.join(ROOT, d), walked);
// Tracked files only; outside a git checkout every walked file counts.
let tracked = null;
try {
  tracked = new Set(
    execFileSync('git', ['ls-files', ...DIRS], { cwd: ROOT, encoding: 'utf8' })
      .split('\n').filter(Boolean).map((f) => path.join(ROOT, f)),
  );
} catch { /* not a git checkout */ }
const files = tracked ? walked.filter((f) => tracked.has(f)) : walked;

/**
 * The text with every comment replaced by spaces, so line numbers hold. CSS
 * has block comments; JS also has line comments. A string's contents are
 * kept (CSS that JS writes is code), and `//` inside a string is not a comment.
 */
function blankComments(text, isCss) {
  let out = '';
  let i = 0;
  let quote = null;
  while (i < text.length) {
    const c = text[i];
    const next = text[i + 1];
    if (quote) {
      out += c;
      if (c === '\\') { out += text[i + 1] ?? ''; i += 2; continue; }
      if (c === quote) quote = null;
      i++;
      continue;
    }
    if (c === '/' && next === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end === -1 ? text.length : end + 2;
      out += text.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop;
      continue;
    }
    if (!isCss && c === '/' && next === '/') {
      const end = text.indexOf('\n', i);
      const stop = end === -1 ? text.length : end;
      out += ' '.repeat(stop - i);
      i = stop;
      continue;
    }
    if (c === '"' || c === "'" || c === String.fromCharCode(96)) quote = c;
    out += c;
    i++;
  }
  return out;
}

// property-name : <spaces/colon> ... <number>px  (CSS-style, also matches
// inline cssText strings like `font-size:1.5rem` written in JS)
const PX_RE = /([a-zA-Z-]+)\s*:\s*[^;{}\n]*?(-?[\d.]+)px/g;
const MEDIA_RE = /@media[^{]*\d+px/;

const byBucket = { LIKELY_CONVERT: {}, LIKELY_OK: {}, UNCLASSIFIED: {} };
const totals = { LIKELY_CONVERT: 0, LIKELY_OK: 0, UNCLASSIFIED: 0, mediaBreakpoints: 0, ALLOWED: 0 };
const allowed = [];

for (const abs of files) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
  const raw = fs.readFileSync(abs, 'utf8');
  const rawLines = raw.split(/\r?\n/);
  const lines = blankComments(raw, abs.endsWith('.css')).split(/\r?\n/);
  lines.forEach((line, i) => {
    if (/px-ok:/.test(rawLines[i])) {
      PX_RE.lastIndex = 0;
      let n = 0;
      while (PX_RE.exec(line)) n++;
      if (n) {
        totals.ALLOWED += n;
        allowed.push(`${rel}:${i + 1}  ${rawLines[i].split('px-ok:')[1].replace(/\*\/.*$/, '').trim()}`);
      }
      return;
    }
    if (MEDIA_RE.test(line)) { totals.mediaBreakpoints++; return; } // breakpoints stay px, don't double-count
    PX_RE.lastIndex = 0;
    let m;
    while ((m = PX_RE.exec(line)) !== null) {
      const prop = m[1].toLowerCase();
      const value = parseFloat(m[2]);
      // 1px/2px hairlines on ANY property are conventionally allowed (borders,
      // shadow offsets expressed via top/left tricks, etc.)
      const bucket = LIKELY_CONVERT_PROPS.includes(prop) && Math.abs(value) > 2
        ? 'LIKELY_CONVERT'
        : LIKELY_OK_PROPS.includes(prop) || Math.abs(value) <= 2
          ? 'LIKELY_OK'
          : 'UNCLASSIFIED';
      totals[bucket]++;
      byBucket[bucket][rel] = (byBucket[bucket][rel] || 0) + 1;
    }
  });
}

fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data/px-audit.json'), JSON.stringify({ totals, byBucket, allowed }, null, 2));

console.log(`px-unit audit (#294) — ${totals.LIKELY_CONVERT} likely-convert, ${totals.LIKELY_OK} likely-ok, ${totals.UNCLASSIFIED} unclassified, ${totals.mediaBreakpoints} media-breakpoint line(s) (excluded).\n`);

const top = (bucket, n = 20) =>
  Object.entries(byBucket[bucket]).sort((a, b) => b[1] - a[1]).slice(0, n);

console.log('Top files — LIKELY_CONVERT (font-size/padding/margin/gap/border-radius/width/height/position, >2px):');
for (const [f, c] of top('LIKELY_CONVERT')) console.log(`  ${String(c).padStart(4)}  ${f}`);

console.log('\nTop files — UNCLASSIFIED (needs a human look):');
for (const [f, c] of top('UNCLASSIFIED')) console.log(`  ${String(c).padStart(4)}  ${f}`);

console.log(`\nALLOWED (px-ok, not in the gate's total): ${totals.ALLOWED}`);
for (const a of allowed) console.log(`  ${a}`);

console.log('\nWrote data/px-audit.json');
