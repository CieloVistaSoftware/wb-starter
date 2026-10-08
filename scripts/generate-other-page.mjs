#!/usr/bin/env node
/**
 * generate-other-page.mjs  (#1738)
 *
 * John: "Create a nav button in our main navigator named other, then put links
 * to other folders for example demos or perhaps pages too."
 *
 * Writes pages/other.html, the page behind the "Other" nav item: every
 * visitor-facing page in demos/, pages/, public/ and articles/ that the main
 * nav (config/site.json navigationMenu) does not already reach, grouped by
 * folder. Each card is titled from the target file's <title>, or its first
 * <h1> when it has none (page fragments in pages/ have no <title>).
 *
 * The list is GENERATED, never hand-maintained: a hand list drifts the moment
 * someone adds a demo. tests/compliance/other-page-drift.spec.ts runs this in
 * --check mode, so a new file in one of these folders without a regenerate
 * fails CI.
 *
 * WHAT IS LEFT OUT, AND WHY: SKIP below names every current file that is not
 * meant for visitors (a fixture, a debug page, a test harness, a tool that
 * needs the local dev server) with its reason. A NEW file whose name marks it
 * as debug/test/harness/check/scratch is left out by SKIP_NAME; anything else
 * is listed, so a new demo never silently disappears. The skipped files and
 * their reasons are written into the page as a comment, so the gate also
 * catches a change to what is skipped.
 *
 * Links are root-relative (no leading /) so they resolve under the
 * /wb-starter/ GitHub Pages base, exactly like pages/demos.html: a page is
 * linked as ?page=<id> (the shell routes it), a file by its path.
 *
 * Usage:
 *   node scripts/generate-other-page.mjs           # write pages/other.html
 *   node scripts/generate-other-page.mjs --check   # exit 1 if it is stale
 *   ... --root <dir>   # run against another tree (the drift spec's
 *                      # seen-to-fail check uses a temp copy)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE_ID = 'other';

/** Files that are not for visitors, with the reason (shown in the page comment and the PR). */
export const SKIP = {
  'demos/intellisense-check.html': 'editor check: a file for testing VS Code autocomplete, not a demo',
  'demos/legacy-syntax-check.html': 'test fixture: renders retired data-wb syntax and expects errors (data-x-expected-errors)',
  'demos/mdhtml-pre-debug.html': 'debug page for the x-mdhtml/pre pipeline',
  'demos/pre-debug.html': 'debug page for the pre behavior',
  'demos/scrollalong-test.html': 'behavior test page (spacer blocks and a scroll box), not a showcase',
  'demos/standalone.html': 'the Playground\'s preview stage (#659): shows "Nothing to preview" when opened on its own',
  'demos/test-harness.html': 'test harness',
  'pages/newpage.html': 'page-builder template scaffold, not a page (generate-404.mjs NOT_PAGES)',
  'pages/ai-permutation-test.html': 'test harness page (generate-404.mjs NOT_PAGES)',
  'public/doc-viewer.html': 'needs ?file=; every doc is already linked from the Docs page',
  'public/JP07012025Resume.html': 'a personal resume, not part of the site',
  'public/performance-dashboard.html': 'needs the local dev server (/api/performance-results); blank on a static host',
  'public/test-dashboard.html': 'needs the local dev server (fetches /data/test-*.json from the domain root); blank on a static host',
  'public/papers/schema-first-architecture.html': 'a near-copy of demos/schema-first-architecture.html, which is listed under Demos',
};

/** Whole folders that hold no pages for visitors. */
export const SKIP_FOLDERS = {
  'demos/fixtures/': 'test fixture data (JSON)',
  'demos/css/': 'a stylesheet the demos load',
  'demos/site/ (other than index.html)': 'the component library\'s category pages, linked from its index',
};

/** A new file named like this is a harness, not a page: left out until someone decides otherwise. */
const SKIP_NAME = /(^|[-.])(debug|test|test-harness|harness|check|scratch)([-.]|$)/i;

/** Named like a test, but a real demo: demos/layout-test.html is the "Layout Tags Demo". */
const KEEP = new Set(['demos/layout-test.html']);

/**
 * The groups, in display order. `files()` lists candidate paths (relative to
 * `root`, forward slashes); `href()` turns one into its link.
 */
const GROUPS = [
  {
    id: 'demos',
    icon: '🎮',
    title: 'Demos',
    blurb: 'Standalone demos from the demos/ folder, plus the component library and the plain demos index.',
    files: (root) => ['demos/site/index.html', 'demos/index.html', ...htmlIn('demos', root).filter((f) => f !== 'demos/index.html')],
    href: (file) => file,
    target: '_blank',
  },
  {
    id: 'pages',
    icon: '📄',
    title: 'Pages',
    blurb: 'Pages from the pages/ folder that are not in the main menu.',
    files: (root) => htmlIn('pages', root),
    href: (file) => `?page=${path.basename(file, '.html')}`,
    target: '',
  },
  {
    id: 'tools',
    icon: '🛠️',
    title: 'Tools',
    blurb: 'Viewers from the public/ folder.',
    files: (root) => htmlIn('public', root),
    href: (file) => file,
    target: '_blank',
  },
  {
    id: 'articles',
    icon: '📰',
    title: 'Articles',
    blurb: 'Articles and papers from the articles/ and public/papers/ folders.',
    files: (root) => [...htmlIn('articles', root), ...htmlIn('public/papers', root)],
    href: (file) => file,
    target: '_blank',
  },
];

/** The *.html files directly in a folder, sorted. */
function htmlIn(dir, root = ROOT) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith('.html'))
    .map((d) => `${dir}/${d.name}`)
    .sort();
}

/** What the main nav already reaches: its pages (as pages/<id>.html) and its hrefs. */
export function reachedByNav(root = ROOT) {
  const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config', 'site.json'), 'utf8'));
  const reached = new Map();
  for (const item of cfg.navigationMenu ?? []) {
    const label = item.menuItemText || item.menuItemId;
    if (item.pageToLoad) reached.set(`pages/${item.pageToLoad}.html`, label);
    if (item.href && !/^[a-z]+:/i.test(item.href)) reached.set(item.href.replace(/^\.?\//, ''), label);
  }
  return reached;
}

const decode = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/**
 * A readable title: the file's <title>, else its first <h1>, with comments,
 * scripts and tags stripped, a " — WB" style suffix dropped and a leading
 * emoji removed (the card shows the group's icon).
 */
export function titleOf(file, root = ROOT) {
  const html = fs.readFileSync(path.join(root, file), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '');
  const pick = (re) => {
    const m = html.match(re);
    return m ? decode(m[1].replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim() : '';
  };
  let t = pick(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || pick(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  t = t.replace(/\s+[|\-–—]\s+(WB[- ]?Starter|WB|WB Demo|wb-starter|Cielo Vista Software)\b.*$/i, '').trim();
  t = t.replace(/^[^\p{L}\p{N}]+/u, '').trim();
  return t || path.basename(file, '.html').replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Why a file is left out, or null when it is listed. */
export function skipReason(file, nav) {
  if (nav.has(file)) return `already in the main menu (${nav.get(file)})`;
  if (SKIP[file]) return SKIP[file];
  if (!KEEP.has(file) && SKIP_NAME.test(path.basename(file, '.html'))) return 'named as a debug/test/harness file';
  return null;
}

/** Every group with its listed links, and every skipped file with its reason. */
export function buildListing(root = ROOT) {
  const nav = reachedByNav(root);
  const skipped = [];
  const groups = GROUPS.map((g) => {
    const links = [];
    for (const file of g.files(root)) {
      // This page itself is never a link, nor a "skip": whether it exists yet
      // must not change the output.
      if (file === `pages/${PAGE_ID}.html` || !fs.existsSync(path.join(root, file))) continue;
      const reason = skipReason(file, nav);
      if (reason) { skipped.push({ file, reason }); continue; }
      links.push({ file, href: g.href(file), title: titleOf(file, root) });
    }
    return { ...g, links };
  }).filter((g) => g.links.length);
  return { groups, skipped };
}

const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** The full pages/other.html. */
export function render({ groups, skipped }) {
  const sections = groups.map((g) => {
    const cards = g.links.map((l) =>
      `      <div x-cardlink title="${attr(l.title)}" description="${attr(l.file)}" href="${attr(l.href)}"${g.target ? ` target="${g.target}"` : ''} icon="${g.icon}"></div>`,
    ).join('\n');
    return `<section class="page__section" id="other-${g.id}">
  <h2>${g.icon} ${g.title}</h2>
  <p>${g.blurb}</p>
  <div class="page__grid">
${cards}
  </div>
</section>`;
  }).join('\n\n');

  const skipLines = [
    ...skipped.map((s) => `       ${s.file}: ${s.reason}`),
    ...Object.entries(SKIP_FOLDERS).map(([dir, reason]) => `       ${dir}: ${reason}`),
  ].join('\n').replace(/--/g, '-');

  return `<script>
  /* A page fragment opened on its own resolves its CSS and modules relative to
     /pages/ instead of the site root, so it renders unstyled and never
     finishes loading. These files are fetched and injected by index.html;
     opened directly they are simply the wrong URL. Redirect to the route that
     works. server.js wraps them automatically, so this only fires on a static
     host. */
  (function () {
    var m = location.pathname.match(/\\/pages\\/([a-z0-9-]+)\\.html$/i);
    if (!m) return;                       // injected by the SPA: nothing to do
    var root = location.pathname.slice(0, m.index + 1);
    location.replace(root + '?page=' + m[1] + location.search.replace(/^\\?/, '&') + location.hash);
  })();
</script>
<!-- GENERATED by scripts/generate-other-page.mjs (#1738) — do not hand-edit.
     Regenerate with: node scripts/generate-other-page.mjs
     To change what is listed or skipped, edit SKIP in that script. -->

<div id="other-hero" class="page__hero">
  <h1>🧭 Other</h1>
  <p>Everything on the site the main menu does not reach, grouped by folder.</p>
</div>

${sections}

<!-- Left out (not meant for visitors):
${skipLines}
-->
`;
}

/** Line endings are the checkout's business, not the generator's. */
const norm = (text) => (text == null ? null : text.replace(/\r\n/g, '\n'));

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const at = process.argv.indexOf('--root');
  const root = at > 0 ? path.resolve(process.argv[at + 1]) : ROOT;
  const OUT = path.join(root, 'pages', `${PAGE_ID}.html`);
  const listing = buildListing(root);
  const next = render(listing);
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : null;
  const stale = norm(next) !== norm(current);
  const count = listing.groups.reduce((n, g) => n + g.links.length, 0);
  if (process.argv.includes('--check')) {
    if (stale) {
      console.error('pages/other.html is stale — run: node scripts/generate-other-page.mjs');
      process.exit(1);
    }
    console.log(`pages/other.html up to date (${count} links, ${listing.skipped.length} skipped).`);
  } else {
    if (stale) fs.writeFileSync(OUT, next);
    console.log(`${count} links in ${listing.groups.length} groups, ${listing.skipped.length} skipped — `
      + (stale ? 'wrote pages/other.html.' : 'already up to date, nothing written.'));
  }
}
