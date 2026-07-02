/**
 * generate-ai-docs-list.mjs  (#230)
 *
 * Fills the A.I. Docs page (pages/ai-docs.html) from docs/claude/, listing every
 * AI-practice doc IN READING ORDER (tier order below), each linking into the
 * doc-viewer. Any docs/claude/*.md not in the curated order is appended after it
 * (so new docs still show up), then the page can't silently miss one.
 *
 * Links are root-relative (public/doc-viewer.html?file=docs/claude/x.md) so they
 * resolve under the /wb-starter/ Pages base.
 *
 * Usage: node scripts/generate-ai-docs-list.mjs   (or --check)
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DIR = path.join(ROOT, 'docs', 'claude');
const PAGE = path.join(ROOT, 'pages', 'ai-docs.html');
const CHECK = process.argv.includes('--check');

// Curated reading order (from docs/claude/README.md's tier system).
const ORDER = [
  'README.md',
  'TIER1-LAWS.md',
  'TIER2-DOMAIN-GUIDES.md',
  'TIER3-REFERENCE.md',
  'PAGE-GENERATION.md',
  'SCHEMAS-GUIDE.md',
];
const NUM = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

function titleOf(name) {
  const html = fs.readFileSync(path.join(DIR, name), 'utf8');
  const m = html.match(/^#\s+(.+)$/m);
  return (m && m[1].trim()) || name.replace(/\.md$/i, '');
}

const present = fs.readdirSync(DIR).filter((n) => n.endsWith('.md'));
const ordered = [...ORDER.filter((n) => present.includes(n)),
  ...present.filter((n) => !ORDER.includes(n)).sort()];

const cards = ordered.map((name, i) => {
  const title = titleOf(name).replace(/"/g, '&quot;');
  const icon = NUM[i] || '📄';
  return `  <wb-card-link title="${title}" href="public/doc-viewer.html?file=docs/claude/${name}" target="_blank" icon="${icon}"></wb-card-link>`;
});

const block = '<!-- ai-docs:auto:start -->\n' + cards.join('\n') + '\n    <!-- ai-docs:auto:end -->';
let page = fs.readFileSync(PAGE, 'utf8');
const re = /<!-- ai-docs:auto:start -->[\s\S]*?<!-- ai-docs:auto:end -->/;
if (!re.test(page)) { console.error('markers not found in pages/ai-docs.html'); process.exit(2); }
const next = page.replace(re, block);

if (CHECK) {
  if (next !== page) { console.error('A.I. Docs list is stale — run: node scripts/generate-ai-docs-list.mjs'); process.exit(1); }
  console.log(`A.I. Docs list up to date (${ordered.length} docs).`);
} else {
  fs.writeFileSync(PAGE, next);
  console.log(`Wrote ${ordered.length} AI-doc links into pages/ai-docs.html.`);
}
