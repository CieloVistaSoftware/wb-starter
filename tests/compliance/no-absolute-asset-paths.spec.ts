import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * COMPLIANCE GATE: no domain-absolute media/asset paths in HTML.
 *
 * Sibling of no-absolute-nav-links (#226), for media dirs. `<wb-audio
 * src="/demos/sample.wav">`, `<img src="/images/x.png">`, etc. resolve to the
 * DOMAIN root under the GitHub Pages sub-path (/wb-starter/) and 404 — even when
 * the file exists in the repo (which is why sample.wav 404'd despite being
 * present). Local dev at '/' hides it.
 *
 * Rule: media refs must be relative (resolve against the page base) or base-aware
 * (new URL(rel, import.meta.url)). External URLs and comments are ignored.
 */
const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.git', 'data', 'test-results', '.playwright-artifacts', 'coverage', 'dist', 'out']);

// Domain-absolute path into a known media dir, in a src/href attribute.
const OFFENDER = /['"`]\/(?:demos|assets|images|media|img|audio|video|fonts|icons)\/[^'"`]*/g;

function walk(dir: string, exts: string[], out: string[]): void {
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, exts, out);
    else if (exts.some((x) => e.name.endsWith(x))) out.push(path.relative(ROOT, abs).replace(/\\/g, '/'));
  }
}

function stripComments(src: string): string {
  return src.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
            .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
            .replace(/(^|[^:])\/\/[^\n]*/g, (_m, p1) => p1);
}

function files(): string[] {
  const out: string[] = [];
  for (const dir of ['pages', 'demos', 'public']) walk(path.join(ROOT, dir), ['.html'], out);
  return [...new Set(out)];
}

test.describe('No domain-absolute media/asset paths in HTML', () => {
  for (const rel of files()) {
    test(`${rel}: no domain-absolute asset paths`, () => {
      const src = stripComments(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
      const hits = [...src.matchAll(OFFENDER)].map((m) => m[0].slice(1));
      const offenders = [...new Set(hits)].sort();

      expect(
        offenders,
        `${rel} uses domain-absolute asset paths that 404 under a sub-path base (e.g. /wb-starter/).\n  ` +
        `${offenders.join('\n  ')}\n  Make them relative or base-aware (new URL(rel, import.meta.url)).`
      ).toEqual([]);
    });
  }
});
