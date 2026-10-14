#!/usr/bin/env node
/**
 * sitemap.xml: every address of the live site a search engine should index.
 *
 * The site is a single-page shell, so a crawler finds pages only by following
 * links the JavaScript draws. The sitemap names them outright: home, every page
 * shell scripts/generate-404.mjs writes, the two folder pages (demos, docs,
 * which keep ?page=), and every doc in docs/manifest.json at its doc-viewer
 * address, with the doc's "modified" date as <lastmod>.
 *
 * Deterministic (sorted, dates from the manifest, no timestamp), so main's
 * stamp workflow regenerates it byte-identical when nothing changed. It runs
 * there after update-docs-manifest.js and generate-404.mjs.
 *
 * robots.txt is not written here: crawlers read it only at the domain root,
 * which is the cielovistasoftware.github.io repository, not this one.
 *
 *   node scripts/generate-sitemap.mjs        # write sitemap.xml
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FOLDER_PAGES } from '../src/core/routes.js';
import { pagesBase, shellPages } from './generate-404.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** GitHub Pages' host for the CieloVistaSoftware account (index.html's og:url). */
export const PAGES_ORIGIN = 'https://cielovistasoftware.github.io';

/** The live site's root: the Pages host plus /<repository name>/. */
export function siteUrl(root = ROOT) {
  return `${PAGES_ORIGIN}${pagesBase(root)}`;
}

/** Every doc in docs/manifest.json: its file under docs/ and its modified date. */
export function manifestDocs(root = ROOT) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'manifest.json'), 'utf8'));
  return manifest.categories
    .flatMap((category) => category.docs)
    .map(({ file, modified }) => ({ file, modified }))
    .sort((a, b) => a.file.localeCompare(b.file));
}

const escapeXml = (text) => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

/** The sitemap's addresses, in order: home, pages, folder pages, docs. */
export function sitemapUrls(root = ROOT) {
  const site = siteUrl(root);
  const pages = shellPages(root).map((page) => ({ loc: `${site}${page}` }));
  const folderPages = [...FOLDER_PAGES].sort().map((page) => ({ loc: `${site}?page=${page}` }));
  const docs = manifestDocs(root).map(({ file, modified }) => ({
    loc: `${site}public/doc-viewer.html?file=${encodeURIComponent(`docs/${file}`)}`,
    ...(modified ? { lastmod: modified } : {}),
  }));
  return [{ loc: site }, ...pages, ...folderPages, ...docs];
}

/** sitemap.xml's text for the given addresses. */
export function buildSitemap(urls) {
  const entries = urls.map(({ loc, lastmod }) => '  <url>\n'
    + `    <loc>${escapeXml(loc)}</loc>\n`
    + (lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>\n` : '')
    + '  </url>');
  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + `${entries.join('\n')}\n`
    + '</urlset>\n';
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const urls = sitemapUrls();
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), buildSitemap(urls));
  console.log(`[generate-sitemap] wrote sitemap.xml with ${urls.length} addresses (${siteUrl()})`);
}
