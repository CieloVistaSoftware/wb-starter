#!/usr/bin/env node
// scripts/add-missing-ids.js
// Add deterministic autogen ids to common container elements that lack an id
// Usage: node scripts/add-missing-ids.js <path1> <path2> ...

import fs from 'fs';
import path from 'path';
import { load } from 'cheerio';

if (process.argv.length < 3) {
  console.error('Usage: node scripts/add-missing-ids.js <file1> [file2 ...]');
  process.exit(1);
}

const files = process.argv.slice(2);
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const $ = load(src, { decodeEntities: false });
  let counter = 0;
  const selectors = ['header > div', 'main', 'section', 'div.demo-row', 'div.demo-container', 'div.page__section', 'div.stats-banner', 'div.demo-grid', 'div.demo-area'];
  for (const sel of selectors) {
    $(sel).each((i, el) => {
      const $el = $(el);
      const children = $el.children().length;
      if (children > 1 && !$el.attr('id')) {
        const base = path.basename(file).replace(/\W+/g, '-').replace(/^-|-$/g, '');
        const id = `autogen-${base}-${counter++}`;
        $el.attr('id', id);
      }
    });
  }

  // Also ensure top-level body > div.page__hero has an id
  $('div.page__hero').each((i, el) => {
    const $el = $(el);
    if (!$el.attr('id')) {
      const base = path.basename(file).replace(/\W+/g, '-').replace(/^-|-$/g, '');
      const id = `hero-${base}-${counter++}`;
      $el.attr('id', id);
    }
  });

  fs.writeFileSync(file, $.html(), 'utf8');
  console.log(`patched ids in ${file} (+${counter})`);
}
