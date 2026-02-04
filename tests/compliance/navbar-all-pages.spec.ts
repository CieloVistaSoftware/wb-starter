import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('navbar includes every HTML page from pages/ (header shows all pages)', async ({ page }) => {
  const pagesDir = path.join(process.cwd(), 'pages');
  const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));
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
