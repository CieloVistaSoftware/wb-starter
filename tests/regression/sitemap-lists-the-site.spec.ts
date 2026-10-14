import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import path from 'path';
import { FOLDER_PAGES } from '../../src/core/routes.js';
import { shellPages } from '../../scripts/generate-404.mjs';
import { siteUrl } from '../../scripts/generate-sitemap.mjs';

/**
 * sitemap.xml names every address of the live site a search engine should
 * index. The site is a single-page shell, so a crawler that does not run the
 * nav's JavaScript finds no pages without it.
 *
 * main's stamp workflow regenerates it (node scripts/generate-sitemap.mjs), so
 * this checks what the file must always hold, not a byte-for-byte copy: a doc
 * added on a branch reaches the sitemap at the next stamp, as its manifest
 * entry does.
 */
const ROOT = process.cwd();

const sitemapLocs = (): string[] => {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
};

test('sitemap.xml is a sitemaps.org urlset', () => {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  expect(xml.trimEnd().endsWith('</urlset>')).toBe(true);
  // A sitemap holds at most 50,000 addresses (sitemaps.org).
  expect(sitemapLocs().length).toBeLessThanOrEqual(50_000);
});

test('the sitemap lists home and every page, each once, all on the live site', () => {
  const site = siteUrl();
  const locs = sitemapLocs();
  expect(site.startsWith('https://cielovistasoftware.github.io/')).toBe(true);
  expect(locs[0], 'home comes first').toBe(site);
  const pages = shellPages();
  expect(pages.length, 'the page list is not empty, so this can fail').toBeGreaterThan(5);
  const missing = [
    ...pages.map((p) => `${site}${p}`),
    ...[...FOLDER_PAGES].map((p) => `${site}?page=${p}`),
  ].filter((loc) => !locs.includes(loc));
  expect(missing, 'run node scripts/generate-sitemap.mjs').toEqual([]);
  expect(locs.filter((loc) => !loc.startsWith(site)), 'an address off the site').toEqual([]);
  expect(locs.length, 'an address listed twice').toBe(new Set(locs).size);
});

test('every doc address in the sitemap names a doc that exists', () => {
  const docs = sitemapLocs()
    .filter((loc) => loc.includes('public/doc-viewer.html?file='))
    .map((loc) => new URL(loc).searchParams.get('file') ?? '');
  expect(docs.length, 'the docs are listed, so this can fail').toBeGreaterThan(5);
  expect(docs.filter((file) => !fs.existsSync(path.join(ROOT, file))), 'a doc that is gone').toEqual([]);
});
