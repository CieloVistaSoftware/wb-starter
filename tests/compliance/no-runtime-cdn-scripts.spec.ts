import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * The site's own JavaScript never loads code from a CDN at runtime.
 *
 * mdhtml.js injected <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js">
 * -- unpinned, while package.json already pinned marked 17.0.1. Every x-mdhtml
 * then depended on a third party being reachable, and when it was not
 * (offline, firewall, CDN outage) "Failed to load marked.js from CDN" landed
 * in the page error log: a failure the site could neither prevent nor fix.
 * Third-party code is vendored into src/lib (highlight.js, marked) and
 * imported like any other module.
 *
 * Scope: script/module URLs in src/**\/*.js, except the vendored files
 * themselves. Stylesheet URLs are not covered here (highlight.js themes still
 * fall back to cdnjs for themes not stored locally).
 */
const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const VENDORED = path.join(SRC, 'lib');

const CDN_URL = /https?:\/\/(?:cdn\.jsdelivr\.net|unpkg\.com|esm\.sh|cdn\.skypack\.dev|cdnjs\.cloudflare\.com)\/[^'"`\s)]*/g;

/**
 * Judged by how the URL ENDS, not by any ".js" inside it: cdnjs serves
 * highlight.js theme STYLESHEETS from .../highlight.js/11.9.0/styles/x.min.css,
 * and that folder name is not a script.
 */
const isScriptUrl = (url: string): boolean => /(?:\.m?js|\+esm)$/.test(url);

function jsFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (abs !== VENDORED) jsFiles(abs, out);
    } else if (/\.m?js$/.test(entry.name)) {
      out.push(abs);
    }
  }
  return out;
}

test('no src/ JavaScript loads a script from a CDN at runtime', () => {
  const files = jsFiles(SRC);
  expect(files.length, 'found no JavaScript under src/ -- this check is measuring nothing').toBeGreaterThan(50);

  const offenders: string[] = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const url of (line.match(CDN_URL) || []).filter(isScriptUrl)) {
        offenders.push(`${path.relative(ROOT, file).replace(/\\/g, '/')}:${i + 1}  ${url}`);
      }
    });
  }

  expect(
    offenders,
    `These load third-party code from a CDN at runtime. Vendor it into src/lib and import it:\n${offenders.join('\n')}`
  ).toEqual([]);
});

test('marked is vendored at the version package.json pins', () => {
  const pinned = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).dependencies?.marked as string;
  const header = fs.readFileSync(path.join(VENDORED, 'marked.js'), 'utf8').slice(0, 200);
  const vendored = header.match(/marked v(\d+\.\d+\.\d+)/)?.[1];
  expect(vendored, 'src/lib/marked.js has no "marked vX.Y.Z" header').toBeTruthy();
  expect(pinned.replace(/^[\^~]/, ''), 'src/lib/marked.js drifted from package.json').toBe(vendored);
});
