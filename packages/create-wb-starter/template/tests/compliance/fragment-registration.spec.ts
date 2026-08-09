/**
 * Fragment Registration Validation
 * 
 * Source of truth: config/site.json + page.schema.json → $defs/pageFragment
 * 
 * Every HTML file in pages/ is a fragment hosted by index.html via site-engine.js.
 * This test ensures:
 *   1. Every nav reference in site.json has a matching fragment file
 *   2. Inventory of registered vs unregistered fragments
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const FRAGMENTS_DIR = path.resolve('pages');
const CONFIG_PATH = path.resolve('config/site.json');

function loadSiteConfig(): any {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

const siteConfig = loadSiteConfig();
const navPages = new Set<string>();

// Collect all pageToLoad values from navigation + footer
for (const item of siteConfig.navigationMenu ?? []) {
  if (item.pageToLoad) navPages.add(item.pageToLoad);
}
for (const link of siteConfig.additionalFooterLinks ?? []) {
  if (link.pageToLoad) navPages.add(link.pageToLoad);
}

const fragmentFiles = fs.readdirSync(FRAGMENTS_DIR)
  .filter(f => f.endsWith('.html'))
  .map(f => f.replace('.html', ''));


test.describe('Fragment Registration — Site Config Coverage', () => {
  test('inventory — registered vs unregistered fragments', () => {
    const registered: string[] = [];
    const unregistered: string[] = [];

    for (const frag of fragmentFiles) {
      if (navPages.has(frag)) {
        registered.push(frag);
      } else {
        unregistered.push(frag);
      }
    }

    console.log(`\n📋 Fragment Registration:`);
    console.log(`   Registered in nav: ${registered.length} — ${registered.join(', ')}`);
    console.log(`   Not in nav: ${unregistered.length} — ${unregistered.join(', ')}`);
    console.log(`   (Unregistered fragments still work via ?page=name but aren't in the menu)\n`);

    expect(true).toBe(true);
  });

  // Every nav reference should have a matching fragment file
  for (const navPage of navPages) {
    

    test(`nav item "${navPage}" — has matching pages/${navPage}.html`, () => {
      expect(fragmentFiles.includes(navPage), `site.json references "${navPage}" but pages/${navPage}.html doesn't exist`).toBe(true);
    });
  }
});
