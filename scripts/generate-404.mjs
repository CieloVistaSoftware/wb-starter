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
 * Generated, never edited: main's stamp workflow runs this after stamping
 * index.html, and tests/regression/pages-have-real-paths.spec.ts fails if the
 * committed copy differs from index.html by more than the <base>.
 *
 *   node scripts/generate-404.mjs           # write 404.html
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The site root on GitHub Pages: /<repository name>/. */
export function pagesBase(root = ROOT) {
  const { name } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  return `/${name}/`;
}

/** index.html with a <base href> as the first thing in <head>. */
export function build404(indexHtml, base) {
  const marker = '<!-- generated from index.html by scripts/generate-404.mjs (#1001); do not edit -->';
  if (!/<head[^>]*>/i.test(indexHtml)) throw new Error('index.html has no <head>');
  return indexHtml.replace(/<head([^>]*)>/i, `<head$1>\n  ${marker}\n  <base href="${base}">`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const html = build404(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), pagesBase());
  fs.writeFileSync(path.join(ROOT, '404.html'), html);
  console.log(`[generate-404] wrote 404.html (base ${pagesBase()})`);
}
