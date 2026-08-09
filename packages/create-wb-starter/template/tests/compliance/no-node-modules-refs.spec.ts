import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Deployed HTML must never reference `node_modules`.
 *
 * node_modules is NOT published to GitHub Pages, so any `../node_modules/...` asset
 * 404s in production. The doc-viewer linked its highlight.js theme CSS from
 * node_modules → on Pages the CSS was missing and code blocks rendered without
 * syntax colors ("not formatted as code"). Vendor such assets into src/ instead.
 */
const ROOT = process.cwd();
const DIRS = ['public', 'pages', 'demos', 'src'];

function walk(dir: string, out: string[]): void {
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(abs, out); }
    else if (e.name.endsWith('.html')) out.push(abs);
  }
}

test.describe('deployed HTML must not reference node_modules', () => {
  const files: string[] = [];
  for (const d of DIRS) walk(path.join(ROOT, d), files);

  const offenders = files
    .filter((f) => /node_modules/.test(fs.readFileSync(f, 'utf8')))
    .map((f) => path.relative(ROOT, f).replace(/\\/g, '/'));

  test('no node_modules references in published HTML (404s on GitHub Pages)', () => {
    expect(
      offenders,
      `these deployed HTML files reference node_modules (won't exist on Pages — vendor into src/ instead):\n  ${offenders.join('\n  ')}`,
    ).toEqual([]);
  });
});
