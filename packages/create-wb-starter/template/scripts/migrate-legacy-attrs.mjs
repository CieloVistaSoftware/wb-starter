/**
 * migrate-legacy-attrs.mjs
 *
 * Codemod: rewrite legacy data-* demo attributes to the canonical v3 plain
 * attribute each behavior ACTUALLY reads. The mapping below is verified against
 * the behavior source (src/wb-viewmodels/*) — the plain names are bespoke per
 * behavior (e.g. x-copy reads `copy-text`, x-youtube reads `video-id`), which is
 * why ad-hoc renames kept breaking demos. Only verified-safe mappings are listed;
 * unverified ones (pagination total/per-page/current, steps current, countdown
 * to, youtube ratio, share-url, striped) are intentionally left for a per-behavior
 * verification pass so nothing silently breaks.
 *
 * Usage: node scripts/migrate-legacy-attrs.mjs [file ...]   (defaults to pages/*.html)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// data-*  ->  verified plain attribute the behavior reads
const MAP = {
  'data-value': 'value',        // wb-progress (feedback.js), x-stepper (stepper.js)
  'data-max': 'max',            // wb-progress, x-stepper
  'data-min': 'min',            // x-stepper
  'data-size': 'size',          // wb-spinner (feedback.js:154 reads data-size||size)
  'data-color': 'color',        // wb-spinner (feedback.js:155)
  'data-columns': 'columns',    // x-gallery (media.js:66)
  'data-items': 'items',        // x-breadcrumb (feedback.js:339), x-steps (navigation.js)
  'data-separator': 'separator',// x-breadcrumb
  'data-src': 'src',            // x-lightbox (overlay.js), wb-audio/media (media.js:117/185)
  'data-mask': 'mask',          // x-masked (masked.js reads mask||data-mask)
  'data-copy': 'copy-text',     // x-copy (copy.js:10)
  'data-share-title': 'share-title', // x-share (helpers.js:140)
  'data-share-url': 'share-url', // x-share (helpers.js:142)
  'data-total': 'total',        // x-pagination (navigation.js:424)
  'data-per-page': 'per-page',  // x-pagination (navigation.js:425)
  'data-current': 'current',    // x-pagination (navigation.js:427), x-steps (navigation.js:488)
  'data-to': 'date',            // x-countdown reads `date` (helpers.js:501), NOT `to`
  'data-ratio': 'aspect-ratio', // x-youtube (media.js:25)
  'data-video-id': 'video-id',  // x-youtube (media.js:889)
  'data-original-price': 'original-price', // wb-cardproduct (live demo uses original-price)
  'data-show-eq': 'show-eq',    // wb-audio (live demo uses show-eq)
  'data-volume': 'volume',      // wb-audio (live demo uses volume)
};

const files = process.argv.slice(2);
const targets = files.length
  ? files.map((f) => path.resolve(ROOT, f))
  : ['pages/components.html', 'pages/behaviors.html', 'pages/newbehaviors.html'].map((f) => path.join(ROOT, f));

let grandTotal = 0;
for (const file of targets) {
  if (!fs.existsSync(file)) continue;
  let src = fs.readFileSync(file, 'utf8');
  let fileTotal = 0;
  for (const [from, to] of Object.entries(MAP)) {
    // Match the attribute name only when used as an attribute: `<space>data-x=`
    const re = new RegExp('(\\s)' + from + '(=)', 'g');
    src = src.replace(re, (_m, sp, eq) => { fileTotal++; return sp + to + eq; });
  }
  if (fileTotal > 0) {
    fs.writeFileSync(file, src);
    console.log(`${path.relative(ROOT, file)}: migrated ${fileTotal} attribute(s)`);
    grandTotal += fileTotal;
  } else {
    console.log(`${path.relative(ROOT, file)}: nothing to migrate`);
  }
}
console.log(`\nTotal migrated: ${grandTotal}`);
