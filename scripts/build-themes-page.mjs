/**
 * build-themes-page.mjs -- write the Themes page's counts and cards (#1025)
 *
 * Reads src/core/themes-registry.js and src/styles/themes.css and rewrites the
 * derived parts of pages/themes.html, and the theme count on
 * pages/features.html (see scripts/lib/themes-page.mjs).
 *
 * Usage:
 *   node scripts/build-themes-page.mjs           # rewrite the pages
 *   node scripts/build-themes-page.mjs --check   # exit 1 if either page is stale
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEMES } from '../src/core/themes-registry.js';
import { classifyThemes, renderFeaturesPage, renderThemesPage, themeCounts } from './lib/themes-page.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CSS = path.join(ROOT, 'src', 'styles', 'themes.css');
const PAGES = [
  ['pages/themes.html', renderThemesPage],
  ['pages/features.html', renderFeaturesPage],
];

const classified = classifyThemes(THEMES, fs.readFileSync(CSS, 'utf8'));
const { total, dark, light } = themeCounts(classified);
const CHECK = process.argv.includes('--check');
let stale = 0;

for (const [rel, render] of PAGES) {
  const file = path.join(ROOT, rel);
  const before = fs.readFileSync(file, 'utf8');
  const after = render(before, classified);
  if (before === after) {
    console.log(`✓ ${rel} is up to date (${total} themes: ${dark} dark, ${light} light).`);
  } else if (CHECK) {
    stale++;
    console.error(`✖ ${rel} is out of date with the theme registry (${total} themes).`);
  } else {
    fs.writeFileSync(file, after);
    console.log(`Wrote ${rel} -- ${total} themes (${dark} dark, ${light} light).`);
  }
}

if (stale) {
  console.error('  Run: node scripts/build-themes-page.mjs');
  process.exit(1);
}
