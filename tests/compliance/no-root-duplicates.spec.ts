import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('no page under pages/main/ is duplicated as full-content in pages root', async () => {
  const pagesDir = path.join(process.cwd(), 'pages');
  const mainDir = path.join(pagesDir, 'main');
  if (!fs.existsSync(mainDir)) return;

  const mainFiles = fs.readdirSync(mainDir).filter(f => f.endsWith('.html')).map(f => f.replace(/\.html$/, ''));
  const failures = [];

  for (const slug of mainFiles) {
    const rootPath = path.join(pagesDir, `${slug}.html`);
    if (!fs.existsSync(rootPath)) continue; // allowed (redirect stub or absent)

    const content = fs.readFileSync(rootPath, 'utf8');
    // Pass if root file is a redirect to /main/<slug>.html (meta refresh or canonical)
    const isRedirect = /<meta[^>]+refresh[^>]+url=\"\/main\/${slug}\.html\"/i.test(content)
      || /<link[^>]+rel=\"canonical\"[^>]+href=\"\/main\/${slug}\.html\"/i.test(content);

    if (!isRedirect) failures.push(slug);
  }

  expect(failures, `Found full-content duplicates in pages root for main pages: ${failures.join(', ')}`).toEqual([]);
});
