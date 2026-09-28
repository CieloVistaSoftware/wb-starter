import { test, expect } from '../fixtures/offline';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Media Path Validation — REGRESSION TEST
 *
 * Asset references in authored markup (src/href on img, script, link, audio,
 * video, source, track, iframe, embed) must NOT be root-absolute (`/path`).
 *
 * THIS RULE WAS INVERTED, ON PURPOSE.
 *
 * It used to demand the opposite -- every path absolute -- after bug #1/#2,
 * where pages/behaviors.html and pages/home.html referenced audio relatively
 * and missed. Then #1047: GitHub Pages serves the site under `/wb-starter/`,
 * so `/images/placeholder.svg` is a 404 in the only place visitors see it,
 * while being correct under `npm start`. The project moved to document-relative
 * asset paths (tests/compliance/assets-resolve-under-a-subpath.spec.ts proves
 * them over the network), and this file kept failing on the 600 paths that fix
 * made correct. The durable form of #1/#2's lesson is "resolve where the site
 * is served", which relative paths do and root-absolute ones cannot.
 *
 * Protocol-relative `//host/...`, external URLs, data: and fragments are fine.
 * Comments and inline script/style bodies are stripped first: markup that
 * QUOTES the anti-pattern to warn about it is not an instance of it.
 */

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../');
const DIRS = ['demos', 'pages', 'public'];
const FILES = ['index.html', 'project-index.html'];
const ASSET_TAG = /<(img|script|link|audio|video|source|track|iframe|embed)\b[^>]*>/gi;
const ASSET_ATTR = /\s(src|href)\s*=\s*["']([^"']*)["']/gi;

function htmlFiles(): string[] {
  const out: string[] = [];
  const recurse = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) recurse(full);
      else if (entry.name.endsWith('.html')) out.push(full);
    }
  };
  for (const d of DIRS) if (fs.existsSync(path.join(ROOT, d))) recurse(path.join(ROOT, d));
  for (const f of FILES) if (fs.existsSync(path.join(ROOT, f))) out.push(path.join(ROOT, f));
  return out;
}

test.describe('Media Path Validation', () => {
  test('the sweep reads real markup — it is not silently empty', () => {
    const files = htmlFiles();
    expect(files.length).toBeGreaterThan(20);
    const tags = files.reduce((n, f) => n + (fs.readFileSync(f, 'utf-8').match(ASSET_TAG) || []).length, 0);
    expect(tags, 'no asset tags found — the rule would pass vacuously').toBeGreaterThan(100);
  });

  test('no asset src/href is root-absolute (breaks under the /wb-starter/ deploy)', () => {
    const violations: string[] = [];
    for (const file of htmlFiles()) {
      // Inline <script>/<style> bodies are code, not markup: doc-viewer.html
      // explains the bug in a JS comment that quotes `<img src="/images/x.svg">`.
      const content = fs.readFileSync(file, 'utf-8')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/(<(script|style)\b[^>]*>)[\s\S]*?(<\/\2>)/gi, '$1$3');
      for (const tag of content.match(ASSET_TAG) || []) {
        for (const m of tag.matchAll(ASSET_ATTR)) {
          const value = m[2];
          if (value.startsWith('/') && !value.startsWith('//')) {
            violations.push(`${path.relative(ROOT, file)}: ${m[1]}="${value}"`);
          }
        }
      }
    }

    expect(
      violations,
      `Found ${violations.length} root-absolute asset paths. Under GitHub Pages the site ` +
      `lives at /wb-starter/, so these 404 there (#1047). Make them relative to the document:\n` +
      violations.join('\n'),
    ).toEqual([]);
  });
});
