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
 * This is an audit only — no gate, no conversion. Output: data/px-audit.json
 * + a grouped console report, so the real scope is visible before anyone
 * commits to converting it.
 */
import fs from 'fs';
import path from 'path';
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

const files = [];
for (const d of DIRS) walk(path.join(ROOT, d), files);

// property-name : <spaces/colon> ... <number>px  (CSS-style, also matches
// inline cssText strings like `font-size:1.5rem` written in JS)
const PX_RE = /([a-zA-Z-]+)\s*:\s*[^;{}\n]*?(-?[\d.]+)px/g;
const MEDIA_RE = /@media[^{]*\d+px/;

const byBucket = { LIKELY_CONVERT: {}, LIKELY_OK: {}, UNCLASSIFIED: {} };
const totals = { LIKELY_CONVERT: 0, LIKELY_OK: 0, UNCLASSIFIED: 0, mediaBreakpoints: 0 };

for (const abs of files) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
  const text = fs.readFileSync(abs, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line) => {
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
fs.writeFileSync(path.join(ROOT, 'data/px-audit.json'), JSON.stringify({ totals, byBucket }, null, 2));

console.log(`px-unit audit (#294) — ${totals.LIKELY_CONVERT} likely-convert, ${totals.LIKELY_OK} likely-ok, ${totals.UNCLASSIFIED} unclassified, ${totals.mediaBreakpoints} media-breakpoint line(s) (excluded).\n`);

const top = (bucket, n = 20) =>
  Object.entries(byBucket[bucket]).sort((a, b) => b[1] - a[1]).slice(0, n);

console.log('Top files — LIKELY_CONVERT (font-size/padding/margin/gap/border-radius/width/height/position, >2px):');
for (const [f, c] of top('LIKELY_CONVERT')) console.log(`  ${String(c).padStart(4)}  ${f}`);

console.log('\nTop files — UNCLASSIFIED (needs a human look):');
for (const [f, c] of top('UNCLASSIFIED')) console.log(`  ${String(c).padStart(4)}  ${f}`);

console.log('\nWrote data/px-audit.json');
