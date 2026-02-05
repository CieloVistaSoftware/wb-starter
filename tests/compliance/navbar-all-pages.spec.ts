import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('navbar includes every HTML page from pages/ (header shows all pages)', async ({ page }) => {
  const pagesDir = path.join(process.cwd(), 'pages');
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = require('path').join(dir, d.name);
    if (d.isDirectory()) return walk(p);
    return d.isFile() && d.name.endsWith('.html') ? [p] : [];
  });
  const files = walk(pagesDir).map(p => require('path').relative(pagesDir, p));
  const slugs = files.map(f => f.replace(/\.html$/, ''));

  await page.goto('/');
  // Ensure header/nav rendered
  await page.waitForSelector('#siteNav, wb-navbar', { state: 'visible', timeout: 5000 });

  const missing = [];
  for (const slug of slugs) {
    // Accept both ?page=slug and /slug.html links
    const linkByQuery = page.locator(`a[href*="?page=${slug}"]`);
    const linkByFile = page.locator(`a[href*="/${slug}.html"]`);
    const found = (await linkByQuery.count()) > 0 || (await linkByFile.count()) > 0;
    if (!found) missing.push(slug);
  }

  expect(missing, `Navbar missing links for pages: ${missing.join(', ')}`).toEqual([]);
});
