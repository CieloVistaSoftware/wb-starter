#!/usr/bin/env node
/**
 * wb-starter -- run and build a site that USES wb-starter (#813, #771).
 *
 * John, 2026-09-29: "I want a cli that allows me to create a website which uses
 * wb-starter", with wb-starter as an npm dependency. `npm create wb-starter`
 * writes the site; this is what the site's own `npm start` / `npm run build`
 * call. The site holds only what is ITS: index.html, config/site.json, pages/,
 * its own assets. The runtime comes from this package.
 *
 *   wb-starter serve [siteDir] [--port 3000]
 *       Serves siteDir, and for any path the site does not have, the wb-starter
 *       runtime underneath it. The site's files always win.
 *
 *   wb-starter build [siteDir] [--out dist]
 *       Writes a static copy -- the site plus the runtime it uses -- to --out,
 *       ready for GitHub Pages or any static host.
 *
 * Zero dependencies, like the runtime: node:http and node:fs only.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * What a site gets from this package. Anything else belongs to the site, so a
 * site without pages/about.html gets a 404 -- never wb-starter's own page by
 * that name, and never wb-starter's config or shell.
 */
export const RUNTIME_PATHS = [
  'src/',
  'assets/',
  'docs/behaviors/',
  'public/doc-viewer.html',
  'data/schema-index.json',
  'data/fix-registry.json',
  'data/behavior-examples.json',
  // main.js registers ../sw.js for every site. It is network-first and
  // resolves everything relative to where it is served, so it is generic.
  'sw.js',
];

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.webm': 'video/webm', '.txt': 'text/plain; charset=utf-8',
};

const isRuntimePath = (rel) => RUNTIME_PATHS.some((p) => (p.endsWith('/') ? rel.startsWith(p) : rel === p));

/** A file under root for this URL path, or null. Never escapes root. */
function fileUnder(root, rel) {
  const abs = path.resolve(root, rel);
  if (abs !== root && !abs.startsWith(root + path.sep)) return null;
  try {
    const st = fs.statSync(abs);
    if (st.isFile()) return abs;
    if (st.isDirectory()) {
      const index = path.join(abs, 'index.html');
      if (fs.existsSync(index)) return index;
    }
  } catch { /* not there */ }
  return null;
}

/** Resolve a request: the site first, then the runtime for runtime paths. */
export function resolveRequest(siteDir, urlPath) {
  let rel = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  if (rel === '') rel = 'index.html';
  return fileUnder(siteDir, rel) || (isRuntimePath(rel) ? fileUnder(PKG_ROOT, rel) : null);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) out[a.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    else out._.push(a);
  }
  return out;
}

function serve(siteDir, port) {
  if (!fs.existsSync(path.join(siteDir, 'index.html'))) {
    console.error(`\n✖ ${siteDir} has no index.html -- run this from your site's folder.\n`);
    process.exit(1);
  }
  const server = http.createServer((req, res) => {
    // The runtime reports client errors to this route when it is served
    // locally. A site server has nowhere to keep them, so it accepts and
    // drops them rather than answering 404 on every page load.
    if (req.method === 'POST' && req.url.startsWith('/api/')) { req.resume(); res.writeHead(204).end(); return; }
    const file = resolveRequest(siteDir, req.url);
    if (!file) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found'); return; }
    res.writeHead(200, {
      'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      // Development server: always the file on disk, never a stale copy.
      'cache-control': 'no-store',
    });
    fs.createReadStream(file).pipe(res);
  });
  server.listen(port, () => {
    console.log(`\n  wb-starter: serving ${siteDir}\n  → http://localhost:${port}/\n`);
  });
  return server;
}

function build(siteDir, outDir) {
  if (!fs.existsSync(path.join(siteDir, 'index.html'))) {
    console.error(`\n✖ ${siteDir} has no index.html -- run this from your site's folder.\n`);
    process.exit(1);
  }
  const skip = new Set(['node_modules', '.git', path.basename(outDir)]);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  // The runtime first, then the site over it, so the site's files win -- the
  // same precedence serve uses.
  for (const p of RUNTIME_PATHS) {
    const from = path.join(PKG_ROOT, p);
    if (fs.existsSync(from)) fs.cpSync(from, path.join(outDir, p), { recursive: true });
  }
  for (const entry of fs.readdirSync(siteDir)) {
    if (skip.has(entry) || entry.startsWith('.')) continue;
    fs.cpSync(path.join(siteDir, entry), path.join(outDir, entry), { recursive: true });
  }
  // GitHub Pages runs Jekyll unless told not to, and Jekyll drops files and
  // folders that start with an underscore.
  fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
  console.log(`\n  wb-starter: built ${siteDir} → ${outDir}\n  Upload that folder to any static host.\n`);
}

const HELP = `
wb-starter -- run and build a site that uses wb-starter

  wb-starter serve [siteDir] [--port 3000]   serve the site with the runtime
  wb-starter build [siteDir] [--out dist]    write a static copy to --out

New site: npm create wb-starter my-site
`;

// Run as a command, not imported by a test. realpath: npm runs a `bin` through
// a symlink in node_modules/.bin, so argv[1] is the link, not this file.
const invokedDirectly = (() => {
  try { return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
})();
if (invokedDirectly) {
  const args = parseArgs(process.argv.slice(2));
  const [cmd, dir = '.'] = args._;
  const siteDir = path.resolve(process.cwd(), dir);
  if (cmd === 'serve') serve(siteDir, Number(args.port || process.env.PORT || 3000));
  else if (cmd === 'build') build(siteDir, path.resolve(siteDir, typeof args.out === 'string' ? args.out : 'dist'));
  else { console.log(HELP); process.exit(cmd ? 1 : 0); }
}
