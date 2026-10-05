import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * #1447: data/templates.json was deleted -- the Builder that read it is gone --
 * and its doc, docs/templates.md, with it. A deleted doc leaves entries behind
 * in three indexes that are maintained separately: the curated
 * docs/manifest.json (the docs page's cards), the generated
 * data/docs-manifest.json, and the search index data/search.json (#1503). Each stale
 * entry is a card or a search hit that opens a 404.
 *
 * Every doc these indexes name must exist.
 */
const root = process.cwd();
const exists = (rel: string) => fs.existsSync(path.join(root, rel));

test('the curated docs manifest names only docs that exist (#1447)', () => {
  const curated = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'manifest.json'), 'utf8'));
  const missing: string[] = [];
  for (const category of curated.categories || []) {
    for (const entry of category.docs || []) {
      if (!entry.file || /^https?:/i.test(entry.file)) continue;
      const rel = entry.file.replace(/^\/+/, '');
      const file = rel.startsWith('docs/') ? rel : `docs/${rel}`;
      if (!exists(file)) missing.push(`${category.name || category.id}: ${file}`);
    }
    for (const entry of category.pages || []) {
      if (entry.page && !exists(`pages/${entry.page}.html`)) missing.push(`${category.name || category.id}: pages/${entry.page}.html`);
    }
  }
  expect(missing, 'docs/manifest.json cards that open a missing doc').toEqual([]);
});

test('the generated docs manifest names only docs that exist (#1447)', () => {
  const generated = JSON.parse(fs.readFileSync(path.join(root, 'data', 'docs-manifest.json'), 'utf8'));
  const missing = (generated.files || []).map((f: { path: string }) => f.path).filter((p: string) => !exists(p));
  expect(missing, 'data/docs-manifest.json is stale; run scripts/update-docs-manifest.js').toEqual([]);
});

// The search index (data/search.json) gets the same check under #1503 -- it is
// stale far beyond this deletion and needs regenerating first.
