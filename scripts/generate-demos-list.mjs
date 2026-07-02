/**
 * generate-demos-list.mjs  (#229)
 *
 * Fills the demos grid in pages/demos.html from the actual demos/ folder, so the
 * "Demos" page lists EVERY demo instead of a hand-maintained subset (was 7 of 45).
 * Scans demos/*.html, reads each <title>, and writes a <wb-card-link> per demo
 * between the <!-- demos:auto:start --> / <!-- demos:auto:end --> markers.
 *
 * Links are root-relative (demos/x.html) so they resolve under the /wb-starter/
 * Pages base — the page is an injected fragment.
 *
 * Usage: node scripts/generate-demos-list.mjs   (also runnable in --check mode)
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DEMOS_DIR = path.join(ROOT, 'demos');
const PAGE = path.join(ROOT, 'pages', 'demos.html');
const CHECK = process.argv.includes('--check');

// Internal harnesses, not showcase demos — kept out of the public list.
const SKIP = /(^|[-.])(debug|test|test-harness|harness|check|scratch)([-.]|$)/i;

function titleOf(file, fallback) {
  const html = fs.readFileSync(file, 'utf8');
  const m = html.match(/<title>([^<]*)<\/title>/i);
  let t = (m && m[1].trim()) || '';
  t = t.replace(/\s*[|\-–—]\s*(WB[- ]?Starter|WB).*$/i, '').trim(); // drop " — WB Starter" suffixes
  return t || fallback;
}

function niceFallback(name) {
  return name.replace(/\.html$/i, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const files = fs.readdirSync(DEMOS_DIR)
  .filter((n) => n.endsWith('.html') && !SKIP.test(n.replace(/\.html$/i, '')))
  .sort();

const cards = files.map((name) => {
  const title = titleOf(path.join(DEMOS_DIR, name), niceFallback(name));
  const t = title.replace(/"/g, '&quot;');
  return `  <wb-card-link title="${t}" href="demos/${name}" target="_blank" icon="🎮"></wb-card-link>`;
});

const block = '<!-- demos:auto:start -->\n' + cards.join('\n') + '\n  <!-- demos:auto:end -->';

let page = fs.readFileSync(PAGE, 'utf8');
const re = /<!-- demos:auto:start -->[\s\S]*?<!-- demos:auto:end -->/;
if (!re.test(page)) {
  console.error('markers <!-- demos:auto:start/end --> not found in pages/demos.html');
  process.exit(2);
}
const next = page.replace(re, block);

if (CHECK) {
  if (next !== page) { console.error(`demos list is stale — run: node scripts/generate-demos-list.mjs`); process.exit(1); }
  console.log(`demos list up to date (${files.length} demos).`);
} else {
  fs.writeFileSync(PAGE, next);
  console.log(`Wrote ${files.length} demo links into pages/demos.html.`);
}
