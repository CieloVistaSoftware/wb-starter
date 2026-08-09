/**
 * generate-demos-search-index.mjs  (#253)
 *
 * The Demos index page (pages/demos.html) only ever searched by card TITLE
 * (scripts/generate-demos-list.mjs writes those titles from each demo's
 * <title>). That misses demos whose title doesn't mention the thing a
 * visitor is actually looking for but whose BODY does — e.g. searching
 * "confetti" should find a demo that uses it even if the card is titled
 * "Visual Effects Playground".
 *
 * This script scans demos/**\/*.html (top-level demos/*.html plus the
 * generated component catalog demos/site/*.html), extracts meaningful
 * searchable text per file — visible text content, wb-* custom element tag
 * names, and x-* behavior attribute names, NOT raw markup/attribute noise —
 * and writes data/demos-search-index.json. pages/demos.html fetches this at
 * load and filters by title OR content-index match as the user types.
 *
 * Deliberately excludes the same debug/harness files SKIPped by
 * scripts/generate-demos-list.mjs (they're never shown on the page, so
 * indexing them would be dead weight) and the two auto-generated plain
 * index.html files (demos/index.html, demos/site/index.html — link lists,
 * not content).
 *
 * Usage: node scripts/generate-demos-search-index.mjs   (also --check mode)
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DEMOS_DIR = path.join(ROOT, 'demos');
const SITE_DIR = path.join(DEMOS_DIR, 'site');
const OUT = path.join(ROOT, 'data', 'demos-search-index.json');
const CHECK = process.argv.includes('--check');

// Same exclusion as scripts/generate-demos-list.mjs — internal harnesses,
// never linked from the page, not worth indexing.
const SKIP = /(^|[-.])(debug|test|test-harness|harness|check|scratch)([-.]|$)/i;

// Cap how many distinct terms/snippets we keep per demo so the index stays
// a browsable, diffable JSON file rather than a near-copy of every demo's
// full text (some demos/site/*.html pages are 30-40KB with hundreds of
// inline sub-demos).
const MAX_TERMS_PER_DEMO = 120;

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'your', 'you', 'are',
  'was', 'were', 'has', 'have', 'had', 'not', 'but', 'all', 'can', 'will',
  'their', 'them', 'they', 'its', 'it\'s', 'into', 'onto', 'over', 'under',
  'about', 'when', 'then', 'than', 'here', 'there', 'what', 'which', 'who',
  'how', 'why', 'div', 'span', 'class', 'style', 'href', 'src', 'true',
  'false', 'null', 'undefined', 'function', 'const', 'let', 'var', 'return',
]);

function collectFiles() {
  const out = [];
  for (const name of fs.readdirSync(DEMOS_DIR)) {
    if (!name.endsWith('.html')) continue;
    if (name === 'index.html') continue; // plain link-list, no content
    if (SKIP.test(name.replace(/\.html$/i, ''))) continue;
    out.push({ rel: `demos/${name}`, abs: path.join(DEMOS_DIR, name) });
  }
  if (fs.existsSync(SITE_DIR)) {
    for (const name of fs.readdirSync(SITE_DIR)) {
      if (!name.endsWith('.html')) continue;
      if (name === 'index.html') continue;
      out.push({ rel: `demos/site/${name}`, abs: path.join(SITE_DIR, name) });
    }
  }
  return out.sort((a, b) => a.rel.localeCompare(b.rel));
}

function titleOf(html, fallback) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  let t = (m && m[1].trim()) || '';
  t = t.replace(/\s*[|\-–—]\s*(WB[- ]?Starter|WB).*$/i, '').trim();
  return t || fallback;
}

function niceFallback(rel) {
  const name = rel.split('/').pop();
  return name.replace(/\.html$/i, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Pull visible text out of raw HTML with plain regexes (no DOM parser
// dependency in this project). Not perfectly spec-compliant, just good
// enough to surface real words a visitor would recognize.
function extractVisibleText(html) {
  let s = html;
  s = s.replace(/<!--[\s\S]*?-->/g, ' ');
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  s = s.replace(/<[^>]+>/g, ' '); // strip all remaining tags/attributes
  s = s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return s;
}

function extractTags(html, re) {
  const found = new Set();
  let m;
  const r = new RegExp(re, 'gi');
  while ((m = r.exec(html))) found.add(m[1].toLowerCase());
  return found;
}

function buildTerms(html) {
  const text = extractVisibleText(html);
  const words = text
    .toLowerCase()
    .match(/[a-z][a-z0-9-]{2,}/g) || [];

  const freq = new Map();
  for (const w of words) {
    if (STOPWORDS.has(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }

  // wb-* custom elements used, e.g. <wb-card ...> -> "wb-card"
  const wbTags = extractTags(html, /<(wb-[a-z0-9-]+)/g);
  // x-* behavior attributes used, e.g. x-tooltip="..." or bare x-ripple
  const xBehaviors = extractTags(html, /[\s"'](x-[a-z0-9-]+)/g);

  for (const t of wbTags) freq.set(t, (freq.get(t) || 0) + 5); // weight tags/behaviors up — they're precise, high-signal search hits
  for (const b of xBehaviors) freq.set(b, (freq.get(b) || 0) + 5);

  const terms = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_TERMS_PER_DEMO)
    .map(([term]) => term);

  return { terms, wbTags: Array.from(wbTags).sort(), xBehaviors: Array.from(xBehaviors).sort() };
}

const files = collectFiles();
const demos = files.map(({ rel, abs }) => {
  const html = fs.readFileSync(abs, 'utf8');
  const title = titleOf(html, niceFallback(rel));
  const { terms, wbTags, xBehaviors } = buildTerms(html);
  return { href: rel, title, tags: wbTags, behaviors: xBehaviors, terms };
});

const index = {
  _meta: {
    description: 'Content search index for the Demos page (#253) — scripts/generate-demos-search-index.mjs. Maps each demos/**/*.html file to searchable terms (visible text words, wb-* tags used, x-* behaviors used) extracted from its content, not just its title. Regenerate after adding/editing a demo; do not hand-edit.',
    generated: new Date().toISOString().slice(0, 10),
    demoCount: demos.length,
  },
  demos,
};

const json = JSON.stringify(index, null, 2) + '\n';

if (CHECK) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : null;
  // generated date changes daily and shouldn't fail --check on its own
  const strip = (s) => s && s.replace(/"generated": "[^"]*"/, '"generated": ""');
  if (strip(current) !== strip(json)) {
    console.error('demos search index is stale — run: node scripts/generate-demos-search-index.mjs');
    process.exit(1);
  }
  console.log(`demos search index up to date (${demos.length} demos).`);
} else {
  fs.writeFileSync(OUT, json);
  console.log(`Wrote data/demos-search-index.json (${demos.length} demos indexed).`);
}
