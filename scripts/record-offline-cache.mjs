#!/usr/bin/env node
/**
 * Record the offline CDN cache for the test fixture
 * =================================================
 * The site loads its third-party dependencies from CDNs, in dev exactly as in
 * production. The TESTS must never touch the internet, so
 * tests/fixtures/offline.ts intercepts every external request and serves it
 * from the cache this script builds:
 *
 *   tests/fixtures/offline/manifest.json   exact URL -> { file, contentType, status }
 *   tests/fixtures/offline/files/<host>/…  the recorded bodies, UNMODIFIED
 *   tests/fixtures/offline/README.md       hosts, packages, versions, licences
 *
 * How the URL list is built:
 *   1. Seeds: every CDN URL in the site sources (src, pages, demos, public,
 *      articles, index.html and the create-wb-starter template). Template
 *      literals are expanded: `${X_VERSION}` from a `const X_VERSION = '…'` in
 *      the same file, `${themeId}` / `${savedTheme}` to every CODE_THEMES id in
 *      src/wb-viewmodels/codetheme.js that has no local path.
 *   2. Crawl: JS from esm.sh / jsdelivr / unpkg is scanned for import
 *      specifiers (static import, export-from, dynamic import(), and esm.sh's
 *      absolute-path imports); CSS is scanned for url(…) (Google Fonts woff2).
 *      Discovered URLs are recorded too.
 *
 * Every request is made with the test browser's user agent (esm.sh and Google
 * Fonts serve different bodies per browser). Redirects are followed and the
 * final body is recorded under the REQUESTED URL. Unpinned URLs (e.g.
 * .../npm/marked/marked.min.js) record whatever is served today.
 *
 * Sample MEDIA (photos, avatars, audio, video) is never recorded -- the
 * fixture maps it onto generated stand-ins (scripts/sample-media-catalog.mjs).
 *
 * Usage (needs the internet; behind a proxy on Node >= 22.21 set
 * NODE_USE_ENV_PROXY=1):
 *   node scripts/record-offline-cache.mjs            rebuild the whole cache
 *   node scripts/record-offline-cache.mjs --list     print the seed URLs only
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, relative, extname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { Buffer } from 'buffer';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'tests', 'fixtures', 'offline');
const FILES = join(OUT, 'files');

/** Chromium user agent -- what the Playwright browser sends. */
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.37 Safari/537.36';

/** Hosts whose resources are dependencies (recorded). */
export const CDN_HOSTS = [
  'cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'unpkg.com', 'esm.sh',
  'fonts.googleapis.com', 'fonts.gstatic.com', 'ga.jspm.io', 'cdn.skypack.dev',
];
const CRAWL_JS_HOSTS = new Set(['esm.sh', 'cdn.jsdelivr.net', 'unpkg.com', 'ga.jspm.io', 'cdn.skypack.dev']);

const SCAN_ROOTS = ['src', 'pages', 'demos', 'public', 'articles', 'index.html', 'packages/create-wb-starter/template'];
const SCAN_SKIP_DIRS = new Set(['node_modules', '.git', 'tests', 'data', 'docs', 'test-results', 'playwright-report']);
const SCAN_EXT = new Set(['.html', '.js', '.mjs', '.css', '.json', '.md']);

// ── seeds ────────────────────────────────────────────────────────────────────

function* walk(p) {
  const abs = join(ROOT, p);
  if (!existsSync(abs)) return;
  const st = statSync(abs);
  if (st.isFile()) { if (SCAN_EXT.has(extname(abs))) yield abs; return; }
  for (const name of readdirSync(abs)) {
    if (SCAN_SKIP_DIRS.has(name)) continue;
    yield* walk(join(p, name));
  }
}

function codeThemeIds() {
  const src = readFileSync(join(ROOT, 'src/wb-viewmodels/codetheme.js'), 'utf8');
  const block = src.slice(src.indexOf('const CODE_THEMES'), src.indexOf('];', src.indexOf('const CODE_THEMES')));
  const ids = [];
  for (const line of block.split('\n')) {
    const m = /\{\s*id:\s*'([^']+)'/.exec(line);
    if (m && !/\bpath:/.test(line)) ids.push(m[1]);
  }
  return ids;
}

const HOST_RE = CDN_HOSTS.map((h) => h.replace(/\./g, '\\.')).join('|');
const URL_RE = new RegExp(`https?://(?:${HOST_RE})[^\\s"'\`<>)\\\\]*(?:\\$\\{[^}]+\\}[^\\s"'\`<>)\\\\]*)*`, 'g');

export function findSeeds() {
  const themes = codeThemeIds();
  const seeds = new Map(); // url -> first source file
  const unresolved = [];
  for (const file of SCAN_ROOTS.flatMap((r) => [...walk(r)])) {
    const text = readFileSync(file, 'utf8');
    for (let raw of text.match(URL_RE) || []) {
      raw = raw.replace(/&amp;/g, '&').replace(/[.,;]+$/, '');
      let expanded = [raw];
      const vars = [...raw.matchAll(/\$\{([^}]+)\}/g)].map((m) => m[1]);
      for (const v of vars) {
        let values;
        if (/theme/i.test(v)) {
          // Every CODE_THEMES id, plus any literal the variable is given in
          // this file (e.g. semantics/code.js's default 'atom-one-dark-reasonable').
          const own = [...text.matchAll(new RegExp(`\\b${v}\\s*=\\s*(?:[^;\\n]*\\|\\|\\s*)?['"]([^'"]+)['"]`, 'g'))].map((m) => m[1]);
          values = [...new Set([...themes, ...own])];
        }
        else {
          const c = new RegExp(`const\\s+${v}\\s*=\\s*['"]([^'"]+)['"]`).exec(text);
          values = c ? [c[1]] : null;
        }
        if (!values) { unresolved.push(`${raw}  (${relative(ROOT, file)}: no value for \${${v}})`); expanded = []; break; }
        expanded = expanded.flatMap((u) => values.map((val) => u.replace(`\${${v}}`, val)));
      }
      for (const u of expanded) {
        let parsed;
        try { parsed = new URL(u); } catch { continue; }
        if (parsed.pathname === '/' && !parsed.search) continue; // bare origin (preconnect)
        if (!seeds.has(u)) seeds.set(u, relative(ROOT, file));
      }
    }
  }
  return { seeds, unresolved };
}

// ── crawl ────────────────────────────────────────────────────────────────────

const IMPORT_RES = [
  /\bimport\s*["']([^"']+)["']/g,                   // import "x"
  /\bfrom\s*["']([^"']+)["']/g,                     // import … from "x" / export … from "x"
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,         // import("x")
];

function importSpecifiers(code) {
  const out = new Set();
  for (const re of IMPORT_RES) for (const m of code.matchAll(re)) out.add(m[1]);
  // Only paths and URLs are fetchable; bare specifiers would need an import map.
  return [...out].filter((s) => /^(\/(?!\/)|\.\.?\/|https?:\/\/)/.test(s));
}

function cssUrls(css) {
  return [...css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((m) => m[1]).filter((u) => !u.startsWith('data:'));
}

function fileFor(url, contentType) {
  const u = new URL(url);
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 10);
  let base = (u.pathname.split('/').filter(Boolean).pop() || 'index').replace(/[^A-Za-z0-9._@+-]/g, '_').slice(0, 60);
  if (!extname(base)) {
    if (/javascript/.test(contentType)) base += '.js';
    else if (/css/.test(contentType)) base += '.css';
    else if (/json/.test(contentType)) base += '.json';
  }
  // `.cached` on EVERY body: these are third-party bytes, recorded verbatim.
  // With their own .js/.mjs/.css names the repo's source gates read them as
  // ours -- es-modules flagged chart.js's CommonJS export, and
  // no-control-characters flagged a literal 0x15 in esm.sh's decode.mjs. The
  // fixture serves by the manifest's contentType, so the name never mattered.
  return `files/${u.hostname}/${hash}-${base}.cached`;
}

async function fetchOnce(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': USER_AGENT, accept: '*/*' } });
      const body = Buffer.from(await res.arrayBuffer());
      return { status: res.status, finalUrl: res.url, contentType: res.headers.get('content-type') || 'application/octet-stream', body };
    } catch (e) {
      if (attempt >= 3) throw new Error(`${url}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

async function main() {
  const { seeds, unresolved } = findSeeds();
  if (process.argv.includes('--list')) {
    for (const [u, f] of seeds) console.log(`${u}  <- ${f}`);
    for (const u of unresolved) console.log(`UNRESOLVED ${u}`);
    return;
  }
  if (unresolved.length) console.warn(`unresolved template URLs (not recorded):\n  ${unresolved.join('\n  ')}`);

  rmSync(FILES, { recursive: true, force: true });
  mkdirSync(FILES, { recursive: true });

  const manifest = {};
  const meta = {}; // url -> { finalUrl, seed, from }
  const skipped = [];
  const queue = [...seeds.keys()].map((u) => ({ url: u, seed: true, from: seeds.get(u) }));
  const seen = new Set(queue.map((q) => q.url));
  const CONCURRENCY = 8;

  async function worker() {
    while (queue.length) {
      const { url, seed, from } = queue.shift();
      let r;
      try { r = await fetchOnce(url); } catch (e) { skipped.push(`${url} (${e.message})`); continue; }
      if (!seed && r.status >= 400) { skipped.push(`${url} (HTTP ${r.status}, discovered in ${from})`); continue; }
      const file = fileFor(url, r.contentType);
      mkdirSync(dirname(join(OUT, file)), { recursive: true });
      writeFileSync(join(OUT, file), r.body);
      manifest[url] = { file, contentType: r.contentType, status: r.status };
      // Unpinned URL: note the version actually served (from the build banner).
      const banner = /javascript/.test(r.contentType) ? /\bv?(\d+\.\d+\.\d+)\b/.exec(r.body.subarray(0, 600).toString('utf8')) : null;
      meta[url] = { finalUrl: r.finalUrl, seed, from, bannerVersion: banner ? banner[1] : '' };
      process.stdout.write(`${r.status} ${url}${r.finalUrl !== url ? `  -> ${r.finalUrl}` : ''}\n`);
      if (r.status >= 400) continue;

      const host = new URL(url).hostname;
      let found = [];
      if (/javascript|ecmascript/.test(r.contentType) && CRAWL_JS_HOSTS.has(host)) {
        found = importSpecifiers(r.body.toString('utf8'));
      } else if (/text\/css/.test(r.contentType)) {
        found = cssUrls(r.body.toString('utf8'));
      }
      for (const spec of found) {
        // The fixture fulfils the body under the REQUESTED url, so the browser
        // resolves relative specifiers against it -- resolve the same way.
        let next;
        try { next = new URL(spec, url).href; } catch { continue; }
        if (!/^https?:/.test(next) || seen.has(next)) continue;
        seen.add(next);
        queue.push({ url: next, seed: false, from: url });
      }
    }
  }
  // Workers drain a shared queue that grows while crawling; rerun until empty.
  while (queue.length) await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
  writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(sorted, null, 2) + '\n');
  writeFileSync(join(OUT, 'README.md'), readme(sorted, meta, skipped));

  let bytes = 0;
  for (const e of Object.values(sorted)) bytes += statSync(join(OUT, e.file)).size;
  console.log(`\n${Object.keys(sorted).length} URLs recorded, ${(bytes / 1024 / 1024).toFixed(2)} MB` +
    (skipped.length ? `; ${skipped.length} discovered URL(s) skipped:\n  ${skipped.join('\n  ')}` : ''));
}

// ── README ───────────────────────────────────────────────────────────────────

const LICENSES = {
  react: 'MIT', 'react-dom': 'MIT', vue: 'MIT', 'htmx.org': '0BSD (BSD Zero Clause)', '@babel/standalone': 'MIT',
  svelte: 'MIT', 'solid-js': 'MIT', 'babel-plugin-jsx-dom-expressions': 'MIT', 'zone.js': 'MIT',
  '@angular/core': 'MIT', '@angular/compiler': 'MIT', '@angular/platform-browser': 'MIT', '@angular/common': 'MIT',
  rxjs: 'Apache-2.0', tslib: '0BSD', ajv: 'MIT', 'fast-deep-equal': 'MIT', 'json-schema-traverse': 'MIT', 'fast-uri': 'BSD-3-Clause',
  'uri-js': 'BSD-2-Clause', marked: 'MIT', 'chart.js': 'MIT', '@kurkle/color': 'MIT', 'highlight.js': 'BSD-3-Clause',
  'dom-expressions': 'MIT', '@babel/helper-module-imports': 'MIT', 'html-entities': 'MIT', 'validate-html-nesting': 'ISC',
  acorn: 'MIT', 'css-tree': 'MIT', 'magic-string': 'MIT', 'estree-walker': 'MIT', 'periscopic': 'MIT', 'code-red': 'MIT',
  'aria-query': 'Apache-2.0', 'axobject-query': 'Apache-2.0', 'locate-character': 'MIT', 'is-reference': 'MIT',
  '@ampproject/remapping': 'Apache-2.0', '@jridgewell/sourcemap-codec': 'MIT', '@jridgewell/trace-mapping': 'MIT',
  '@jridgewell/gen-mapping': 'MIT', '@jridgewell/set-array': 'MIT', '@jridgewell/resolve-uri': 'MIT', '@types/estree': 'MIT',
  'mdn-data': 'CC0-1.0', 'source-map-js': 'BSD-3-Clause', '@babel/types': 'MIT', '@babel/helper-string-parser': 'MIT',
  '@babel/helper-validator-identifier': 'MIT', 'to-fast-properties': 'MIT', 'seroval': 'MIT', 'seroval-plugins': 'MIT',
  'csstype': 'MIT', 'es-module-lexer': 'MIT', entities: 'BSD-2-Clause', parse5: 'MIT',
  '@babel/helper-plugin-utils': 'MIT', '@babel/plugin-syntax-jsx': 'MIT',
  node: 'MIT (esm.sh Node.js built-in polyfills)',
};

/** npm package + version from a CDN URL (requested or final). */
function packageOf(url) {
  const u = new URL(url);
  const p = decodeURIComponent(u.pathname);
  if (u.hostname === 'cdnjs.cloudflare.com') {
    const m = /^\/ajax\/libs\/([^/]+)\/([^/]+)\//.exec(p);
    return m ? { name: m[1], version: m[2] } : null;
  }
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    const fam = u.searchParams.getAll('family').map((f) => f.split(':')[0].replace(/\+/g, ' '));
    if (fam.length) return { name: `Google Fonts: ${fam.join(', ')}`, version: 'css2 API' };
    const m = /^\/s\/([^/]+)\/(v\d+)\//.exec(p);
    return m ? { name: `Google Fonts: ${m[1]}`, version: m[2] } : null;
  }
  const path = u.hostname === 'cdn.jsdelivr.net' ? p.replace(/^\/npm\//, '/') : p;
  const m = /^\/(?:v\d+\/)?((?:@[^/@]+\/)?[^/@?]+)(?:@([^/?]+))?/.exec(path);
  if (!m) return null;
  return { name: m[1], version: m[2] || '(unpinned)' };
}

function readme(manifest, meta, skipped) {
  const hosts = {};
  const pkgs = new Map();
  for (const [url, e] of Object.entries(manifest)) {
    const host = new URL(url).hostname;
    hosts[host] = (hosts[host] || 0) + 1;
    const final = meta[url]?.finalUrl || url;
    const pk = packageOf(final) || packageOf(url);
    if (!pk) continue;
    const key = pk.name;
    if (!pkgs.has(key)) pkgs.set(key, { versions: new Set(), hosts: new Set(), files: 0 });
    const rec = pkgs.get(key);
    rec.versions.add(pk.version === '(unpinned)' && meta[url]?.bannerVersion ? `unpinned (served ${meta[url].bannerVersion})` : pk.version);
    rec.hosts.add(host);
    rec.files++;
    void e;
  }
  const rows = [...pkgs.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, r]) => {
    const lic = LICENSES[name] || (name.startsWith('Google Fonts') ? 'SIL Open Font License 1.1' : 'see the package on npm');
    return `| ${name} | ${[...r.versions].sort().join(', ')} | ${[...r.hosts].sort().join(', ')} | ${r.files} | ${lic} |`;
  });
  const hostRows = Object.entries(hosts).sort().map(([h, n]) => `| ${h} | ${n} |`);
  return `# Offline CDN cache (test fixture only)

Generated by \`node scripts/record-offline-cache.mjs\` -- do not edit by hand.

The site loads its third-party dependencies from CDNs, in development exactly
as in production. The tests must never touch the internet, so
\`tests/fixtures/offline.ts\` intercepts every external request the test
browser makes and answers it from this folder. The page code under test is
byte-for-byte what ships; only the network is replaced.

- \`manifest.json\` maps each exact URL to \`{ file, contentType, status }\`.
- \`files/<host>/\` holds the response bodies.

**These are unmodified third-party files**, recorded as the CDN served them
(redirects followed, final body stored under the requested URL). They are used
only by the test fixture: nothing in the site references this folder, nothing
here is deployed, and nothing here is re-distributed as part of the package.
Each file keeps whatever licence header its upstream build ships with; the
licences below are the upstream projects' own.

Sample media (photos, avatars, audio, video) is **not** recorded here; the
fixture maps those URLs onto generated stand-ins in \`media/\` (see
\`media/MEDIA.md\` and \`scripts/sample-media-catalog.mjs\`).

To refresh after a site dependency changes:

\`\`\`sh
NODE_USE_ENV_PROXY=1 node scripts/record-offline-cache.mjs
\`\`\`

Recorded ${new Date().toISOString().slice(0, 10)}: ${Object.keys(manifest).length} URLs.

## Hosts

| Host | URLs |
|---|---|
${hostRows.join('\n')}

## Packages

| Package | Version(s) | Host(s) | Files | Licence |
|---|---|---|---|---|
${rows.join('\n')}
${skipped.length ? `\n## Not recorded\n\nDiscovered while crawling but not fetchable (not requested by the browser in practice):\n\n${skipped.map((s) => `- ${s}`).join('\n')}\n` : ''}`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
