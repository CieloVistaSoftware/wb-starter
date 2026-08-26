#!/usr/bin/env node
/**
 * Page-fragment direct-load audit.
 *
 * THE BUG THIS EXISTS FOR
 *
 * On a site built from this starter, opening a page file at its own URL:
 *
 *     https://cielovistasoftware.github.io/Ultrasonic/pages/shows.html
 *
 * rendered unstyled and sat on "Loading the schedule…" forever:
 *
 *     404  /Ultrasonic/pages/src/styles/pages/shows.css
 *     404  /Ultrasonic/pages/src/site/shows-time.js
 *
 * Files in pages/ are FRAGMENTS. index.html fetches them and injects them, so
 * they run with the DOCUMENT's base URL — the site root — and their paths are
 * written for that: `src/styles/pages/shows.css`. Opened directly the document
 * IS the fragment, and every relative path resolves one directory too deep.
 *
 * WHY NOTHING CAUGHT IT
 *
 * server.js auto-wraps /pages/*.html into the shell when it serves them, so on
 * a dev server the URL works and the bug is invisible. It appears only on a
 * static host — GitHub Pages, S3, Netlify — which is where these sites are
 * actually published.
 *
 * TWO DISTINCT FAULTS, DIFFERENT SEVERITY
 *
 *   bare-relative refs   break only when the fragment is opened DIRECTLY.
 *                        Remedy: a guard that redirects to the SPA route.
 *
 *   ../ module imports   break in BOTH cases. Injected, `../src/x.js` resolves
 *                        ABOVE the site root; on a project page like
 *                        /Ultrasonic/ that is a 404. And a failed module
 *                        import means the script never runs at all, so its own
 *                        error handling never fires and the page keeps its
 *                        placeholder — it looks slow, not broken. This one is
 *                        a real bug wherever it appears; a guard does not
 *                        excuse it.
 *
 * WHY NOT JUST REWRITE THE PATHS
 *
 * They are correct for the context the fragment is built for. A <base> tag
 * would apply document-wide and break the injected case. A fragment opened on
 * its own is simply the wrong URL; sending the reader to the right one is the
 * fix.
 *
 * USAGE
 *
 *   node scripts/audit-page-fragments.mjs               # this repo
 *   node scripts/audit-page-fragments.mjs --dir <path>  # a site built from it
 *   node scripts/audit-page-fragments.mjs --json
 *
 * Exits 1 when anything is flagged, so it works as a gate in a consuming site:
 *
 *   node node_modules/wb-starter/scripts/audit-page-fragments.mjs --dir .
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');

/**
 * The guard to add to an offending fragment. Exported so the fixer and the
 * failure message quote the same text rather than drifting apart.
 */
export const GUARD_SNIPPET = `<script>
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
</script>`;

/** href/src values, either quote style. */
const REF = /\b(?:href|src)\s*=\s*("([^"]*)"|'([^']*)')/gi;

/**
 * A reference that is anchored somewhere — absolute, protocol-relative, a
 * scheme (mailto:, tel:, data:), a fragment, or a bare query. These resolve
 * the same wherever the document lives, so they are safe.
 *
 * Everything else is BARE RELATIVE and resolves against whatever directory the
 * document happens to be in — which is the whole defect.
 */
const ANCHORED = /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#|\?|\{\{|$)/i;

/**
 * A reference built at runtime — a template placeholder or string
 * concatenation inside a script that emits HTML. Its real value is not in the
 * file, so a static reader cannot judge it, and these are usually the ones
 * already routed through a siteRoot() helper. Reporting them buries the
 * genuine static paths in noise.
 */
const DYNAMIC = /\$\{|\{\{|<%|["']\s*\+|\+\s*["']/;

/** ES module specifiers. Covers static `from '…'` and dynamic `import('…')`. */
const IMPORT_SPEC = /(?:\bfrom\s*|(?:^|[^.\w])\bimport\s*\(\s*)("([^"]*)"|'([^']*)')/g;

/**
 * fetch() with a literal URL. Same defect as a bare-relative href, but a
 * different remedy: this is JS, so it can call siteRoot() and work from either
 * location instead of redirecting. That is the fix #766 established, and the
 * one behaviors.html / components.html / docs.html already use.
 */
const FETCH_URL = /\bfetch\s*\(\s*("([^"]*)"|'([^']*)')/g;

/** Does the fragment redirect itself to the SPA route when opened alone? */
const HAS_GUARD = /location\s*\.\s*(?:replace|assign|href)[^;\n]{0,120}\?page=/;

const isFullDocument = (src) => /<html[\s>]/i.test(src);

function stripComments(src) {
  // A path inside an HTML comment or a JS block comment is prose, not a
  // request the browser will make. Without this the audit reports its own
  // explanatory comments as violations.
  return src
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
}

function refsIn(src) {
  const out = [];
  for (const m of src.matchAll(REF)) {
    const value = (m[2] ?? m[3] ?? '').trim();
    if (!value || ANCHORED.test(value) || DYNAMIC.test(value)) continue;
    out.push(value);
  }
  return out;
}

function bareFetchesIn(src) {
  const out = [];
  for (const m of src.matchAll(FETCH_URL)) {
    const url = (m[2] ?? m[3] ?? '').trim();
    if (!url || ANCHORED.test(url) || DYNAMIC.test(url)) continue;
    if (url.startsWith('./') || url.startsWith('../')) continue;  // explicit, judged elsewhere
    out.push(url);
  }
  return out;
}

function climbingImportsIn(src) {
  const out = [];
  for (const m of src.matchAll(IMPORT_SPEC)) {
    const spec = (m[2] ?? m[3] ?? '').trim();
    if (spec.startsWith('../')) out.push(spec);
  }
  return out;
}

/**
 * @param {{ root?: string, pagesDir?: string }} [options]
 * @returns {{ pagesDir: string, scanned: number, fragments: number,
 *             unguarded: Array, climbing: Array, ok: string[] }}
 */
export function auditPageFragments(options = {}) {
  const root = options.root ? path.resolve(options.root) : REPO_ROOT;
  const pagesDir = options.pagesDir ? path.resolve(options.pagesDir) : path.join(root, 'pages');

  const result = { pagesDir, scanned: 0, fragments: 0, unguarded: [], climbing: [], bareFetch: [], ok: [] };

  let names;
  try {
    names = fs.readdirSync(pagesDir);
  } catch {
    return result;                      // no pages/ — nothing to audit
  }

  for (const name of names.sort()) {
    if (!name.toLowerCase().endsWith('.html')) continue;
    result.scanned++;

    const raw = fs.readFileSync(path.join(pagesDir, name), 'utf8');
    if (isFullDocument(raw)) continue;  // owns its own base; not injected
    result.fragments++;

    const code = stripComments(raw);
    const bareRefs = refsIn(code);
    const climbs = climbingImportsIn(code);
    const fetches = bareFetchesIn(code);
    const guarded = HAS_GUARD.test(code);

    if (fetches.length && !guarded) {
      // Excused by the guard, like a bare href: once the fragment redirects to
      // ?page=<name> the document sits at the site root and the URL resolves
      // correctly — including under a project-page prefix like /wb-starter/.
      // Listed separately only because JS has the better remedy available:
      // siteRoot(), which makes the fragment work standalone instead of
      // bouncing. That is the fix #766 chose for docs.html.
      result.bareFetch.push({ file: name, urls: [...new Set(fetches)].slice(0, 8) });
    }

    if (climbs.length) {
      // Reported whether or not a guard is present: this breaks the injected
      // case too, and the guard does not run there.
      result.climbing.push({ file: name, specifiers: [...new Set(climbs)].slice(0, 8) });
    }

    if (bareRefs.length && !guarded) {
      result.unguarded.push({ file: name, refs: [...new Set(bareRefs)].slice(0, 8), count: bareRefs.length });
    }

    // "ok" means nothing was actually reported for this file — a guarded
    // fragment with bare refs is fine, and must not read as unaccounted-for.
    const reported = result.unguarded.at(-1)?.file === name
      || result.climbing.at(-1)?.file === name
      || result.bareFetch.at(-1)?.file === name;
    if (!reported) result.ok.push(name);
  }

  return result;
}

/** Human-readable report. Shared by the CLI and the Playwright failure text. */
export function formatReport(r) {
  const lines = [];

  if (r.bareFetch?.length) {
    lines.push(
      `${r.bareFetch.length} fragment(s) fetch() a bare-relative URL.`,
      `Injected, 'data/x.json' resolves against the site root and works. Opened directly it`,
      `becomes /pages/data/x.json and 404s — and unlike a stylesheet, the failure surfaces as`,
      `a thrown error mid-render rather than an unstyled page.`,
      ``,
      `Fix — prefix with the siteRoot() helper this repo already uses (#766), which strips a`,
      `trailing pages|demos|public|articles segment so the URL is right from either location`,
      `and stays right under a project-page prefix like /wb-starter/:`,
      ``,
      `    const res = await fetch(siteRoot() + 'data/x.json');`,
      ``,
    );
    for (const b of r.bareFetch) {
      lines.push(`  pages/${b.file} — ${b.urls.join(', ')}`);
    }
    lines.push('');
  }

  if (r.unguarded.length) {
    lines.push(
      `${r.unguarded.length} page fragment(s) reference site-root resources with no standalone guard.`,
      `Opened directly at /pages/<name>.html on a static host these render unstyled — and hang,`,
      `if the resource is a module. A dev server cannot show this: server.js wraps /pages/*.html`,
      `into the shell when it serves them.`,
      ``,
      `Fix — add this at the TOP of each file (do NOT rewrite the paths, and do not add <base>:`,
      `the paths are correct for the injected case, and <base> applies document-wide):`,
      ``,
      ...GUARD_SNIPPET.split('\n').map((l) => `    ${l}`),
      ``,
    );
    for (const u of r.unguarded) {
      lines.push(`  pages/${u.file} — ${u.count} bare-relative ref(s), e.g. ${u.refs.slice(0, 3).join(', ')}`);
    }
    lines.push('');
  }

  if (r.climbing.length) {
    lines.push(
      `${r.climbing.length} fragment(s) import a module with '../'.`,
      `This breaks in BOTH cases, so a guard does not excuse it. A fragment runs with the`,
      `DOCUMENT's base URL, so '../src/x.js' resolves ABOVE the site root — on a project page`,
      `like /Ultrasonic/ that is a 404. The import failing means the whole script never runs,`,
      `so the page keeps its "Loading…" placeholder and looks slow rather than broken.`,
      ``,
      `Fix — use './src/…', which is correct both at a root and under a subpath. A bare`,
      `'src/…' specifier is not valid in an ES module, which is the trap that leads to '../'.`,
      ``,
    );
    for (const c of r.climbing) {
      lines.push(`  pages/${c.file} — ${c.specifiers.join(', ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/* ── CLI ─────────────────────────────────────────────────────────────────── */
const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  const argv = process.argv.slice(2);
  const dirFlag = argv.indexOf('--dir');
  const root = dirFlag !== -1 ? argv[dirFlag + 1] : undefined;

  const result = auditPageFragments({ root });

  if (argv.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.scanned === 0) {
    console.log(`page-fragment audit — no pages/ directory at ${result.pagesDir}; nothing to check.`);
  } else {
    const bad = result.unguarded.length + result.climbing.length + result.bareFetch.length;
    console.log(
      `page-fragment audit — ${result.fragments} fragment(s) of ${result.scanned} file(s) in ${result.pagesDir}\n` +
      `  ${result.unguarded.length} unguarded, ${result.climbing.length} with '../' imports, ${result.bareFetch.length} bare fetch(), ${result.ok.length} ok\n`,
    );
    if (bad) console.log(formatReport(result));
    else console.log('All fragments survive a direct load.');
  }

  process.exit(result.unguarded.length + result.climbing.length + result.bareFetch.length > 0 ? 1 : 0);
}
