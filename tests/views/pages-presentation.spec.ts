import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const PAGES_DIR = path.join(process.cwd(), 'pages');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return walk(p);
    return d.isFile() && d.name.endsWith('.html') ? [p] : [];
  });
}

const files = (fs.existsSync(PAGES_DIR) ? walk(PAGES_DIR) : []).map(f => path.relative(PAGES_DIR, f));

if (files.length === 0) {
  // Defensive: ensure test suite fails loudly if pages/ is missing
  test('pages folder exists and contains HTML', async () => {
    expect(files.length).toBeGreaterThan(0);
  });
} else {
  for (const rel of files) {
    test(`pages/${rel} — loads without console/page/network errors`, async ({ page, baseURL }) => {
      const errors: string[] = [];

      page.on('console', m => {
        try {
          if (m.type() === 'error') errors.push(`console:${m.text()}`);
        } catch (e) {
          errors.push(`console: (could not read message)`);
        }
      });

      page.on('pageerror', e => errors.push(`pageerror:${String(e)}`));

      page.on('requestfailed', r => {
        const url = r.url();
        // ignore favicon/png 204-style failures sometimes produced by CI infra
        errors.push(`requestfailed:${r.failure()?.errorText || 'failed'}:${url}`);
      });

      const urlPath = `/pages/${rel.replace(/\\\\/g, '/')}`; // use forward slashes for browser
      const res = await page.goto(urlPath, { waitUntil: 'load', timeout: 30_000 });

      // Basic HTTP check
      expect(res, `no response for ${urlPath}`).toBeTruthy();
      expect(res?.ok(), `http ${res?.status()} for ${urlPath}`).toBeTruthy();

      // give any async logs a short moment
      await page.waitForTimeout(250);

      expect(errors, `errors while loading ${urlPath}: ${errors.join(' || ')}`).toEqual([]);
    });
  }
}
