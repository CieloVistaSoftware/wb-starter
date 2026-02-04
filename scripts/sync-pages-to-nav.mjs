#!/usr/bin/env node
/*
 * sync-pages-to-nav.mjs
 * - Scans the `pages/` directory for `.html` pages and updates
 *   `config/site.json` -> `navigationMenu` to include them.
 * - Safe: preserves existing top-priority entries and appends any missing pages.
 */
import fs from 'fs/promises';
import path from 'path';

const ROOT = path.resolve(new URL(import.meta.url).pathname, '..', '..');
const PAGES_DIR = path.join(ROOT, 'pages');
const SITE_JSON = path.join(ROOT, 'config', 'site.json');

async function listPages() {
  const files = await fs.readdir(PAGES_DIR);
  return files
    .filter(f => f.endsWith('.html'))
    .map(f => ({ file: f, slug: f.replace(/\.html$/, '') }));
}

async function loadSiteConfig() {
  const raw = await fs.readFile(SITE_JSON, 'utf8');
  return JSON.parse(raw);
}

async function writeSiteConfig(cfg) {
  const pretty = JSON.stringify(cfg, null, 2) + '\n';
  await fs.writeFile(SITE_JSON, pretty, 'utf8');
}

(async function main() {
  const pages = await listPages();
  const cfg = await loadSiteConfig();
  const existing = Array.isArray(cfg.navigationMenu) ? cfg.navigationMenu.slice() : [];

  // Keep existing entries first (by menuItemId or pageToLoad)
  const existingIds = new Set(existing.map(i => i.menuItemId || i.pageToLoad));

  // Append missing pages (alphabetical)
  const missing = pages
    .filter(p => !existingIds.has(p.slug))
    .sort((a, b) => a.slug.localeCompare(b.slug));

  for (const p of missing) {
    existing.push({ menuItemId: p.slug, menuItemText: p.slug, pageToLoad: p.slug });
  }

  cfg.navigationMenu = existing;
  await writeSiteConfig(cfg);
  console.log(`Synced ${missing.length} pages to navigationMenu (total: ${cfg.navigationMenu.length})`);
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
