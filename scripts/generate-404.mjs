#!/usr/bin/env node
/**
 * 404.html: the site shell for any path GitHub Pages has no file for (#1001).
 *
 * John: "I want regular routing for navigation pull out the pages thing".
 * The site is static files on GitHub Pages, which cannot rewrite /behaviors to
 * index.html; it serves 404.html for any path it has no file for. So 404.html
 * IS index.html, plus a <base> naming the site root, because /wb-starter/
 * behaviors/ is one folder deeper than the shell's relative links expect.
 * src/core/routes.js then reads the page from the path; a path naming no page
 * renders the not-found page.
 *
 * The same shell is also written to <page>/index.html for every page (#1001
 * acceptance): GitHub Pages answers 404.html with a 404 STATUS, and a search
 * engine drops a page that answers 404, so /behaviors would never be indexed
 * while /?page=behaviors (a 200) had been. With a real file at the path, Pages
 * answers 200. demos and docs are real folders already (routes.js
 * FOLDER_PAGES) and keep ?page=; home is the root itself. A folder this script
 * wrote for a page that no longer exists is removed.
 *
 * Generated, never edited: main's stamp workflow runs this after stamping
 * index.html, and tests/regression/pages-have-real-paths.spec.ts fails if a
 * committed copy differs from index.html by more than the <base>, or a page
 * has no shell.
 *
 *   node scripts/generate-404.mjs           # write 404.html and the page shells
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FOLDER_PAGES } from '../src/core/routes.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The site root on GitHub Pages: /<repository name>/. */
export function pagesBase(root = ROOT) {
  const { name } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  return `/${name}/`;
}

/** The comment every generated shell carries: how a generated folder is told from a real one. */
export const SHELL_MARKER = '<!-- generated from index.html by scripts/generate-404.mjs (#1001); do not edit -->';

/**
 * pages/ files that are not pages a reader opens: the new-page template and a
 * test harness (tests/regression/non-nav-pages-reachable.spec.ts says the same).
 */
const NOT_PAGES = new Set(['newpage', 'ai-permutation-test']);

/** The pages that get a <page>/index.html: every page but home and the folder pages. */
export function shellPages(root = ROOT) {
  return fs.readdirSync(path.join(root, 'pages'))
    .filter((f) => f.endsWith('.html'))
    .map((f) => f.slice(0, -5))
    .filter((p) => p !== 'home' && !FOLDER_PAGES.has(p) && !NOT_PAGES.has(p))
    .sort();
}

/** Root folders holding only a shell this script wrote. */
export function generatedFolders(root = ROOT) {
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name)
    .filter((name) => {
      const files = fs.readdirSync(path.join(root, name));
      if (files.length !== 1 || files[0] !== 'index.html') return false;
      return fs.readFileSync(path.join(root, name, 'index.html'), 'utf8').includes(SHELL_MARKER);
    })
    .sort();
}

/** index.html with a <base href> as the first thing in <head>. */
export function build404(indexHtml, base) {
  const marker = SHELL_MARKER;
  if (!/<head[^>]*>/i.test(indexHtml)) throw new Error('index.html has no <head>');
  return indexHtml.replace(/<head([^>]*)>/i, `<head$1>\n  ${marker}\n  <base href="${base}">`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const html = build404(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), pagesBase());
  fs.writeFileSync(path.join(ROOT, '404.html'), html);
  const pages = shellPages();
  for (const page of pages) {
    fs.mkdirSync(path.join(ROOT, page), { recursive: true });
    fs.writeFileSync(path.join(ROOT, page, 'index.html'), html);
  }
  const stale = generatedFolders().filter((name) => !pages.includes(name));
  for (const name of stale) fs.rmSync(path.join(ROOT, name), { recursive: true });
  console.log(`[generate-404] wrote 404.html and ${pages.length} page shells (base ${pagesBase()})`
    + (stale.length ? `; removed ${stale.join(', ')}` : ''));
}
