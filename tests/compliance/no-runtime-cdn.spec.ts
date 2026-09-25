import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * The site's own JavaScript never loads anything from a CDN at runtime --
 * no scripts, no stylesheets.
 *
 * mdhtml.js injected <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js">
 * -- unpinned, while package.json already pinned marked 17.0.1 -- and
 * code.js/codecontrol.js built every code theme's URL on cdnjs, pinned to
 * highlight.js 11.9.0 while the vendored highlighter is 11.11.1. When a CDN
 * was unreachable (offline, firewall, outage) markdown did not render, code
 * lost its colours, and errors landed in the page log: failures the site
 * could neither prevent nor fix. The "dracula" theme 404'd everywhere.
 *
 * Third-party code is vendored and imported like any other module:
 *   src/lib/                      highlight.js, marked
 *   src/styles/code-themes/hljs/  highlight.js themes (scripts/vendor-code-themes.mjs)
 *
 * Scope: src/**\/*.js, except the vendored libraries in src/lib.
 */
const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const VENDORED = path.join(SRC, 'lib');

const CDN_URL = /https?:\/\/(?:cdn\.jsdelivr\.net|unpkg\.com|esm\.sh|cdn\.skypack\.dev|cdnjs\.cloudflare\.com)\/[^'"`\s)]*/g;

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

/** Comment lines may name a CDN to explain why it is no longer used. */
const isComment = (line: string): boolean => /^\s*(\/\/|\*|\/\*)/.test(line);

test('no src/ JavaScript loads anything from a CDN at runtime', () => {
  const files = jsFiles(SRC);
  expect(files.length, 'found no JavaScript under src/ -- this check is measuring nothing').toBeGreaterThan(50);

  const offenders: string[] = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (isComment(line)) return;
      for (const url of line.match(CDN_URL) || []) {
        offenders.push(`${path.relative(ROOT, file).replace(/\\/g, '/')}:${i + 1}  ${url}`);
      }
    });
  }

  expect(
    offenders,
    `These load third-party files from a CDN at runtime. Vendor them into src/ and serve them from the site:\n${offenders.join('\n')}`
  ).toEqual([]);
});

test('marked is vendored at the version package.json pins', () => {
  const pinned = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).dependencies?.marked as string;
  const header = fs.readFileSync(path.join(VENDORED, 'marked.js'), 'utf8').slice(0, 200);
  const vendored = header.match(/marked v(\d+\.\d+\.\d+)/)?.[1];
  expect(vendored, 'src/lib/marked.js has no "marked vX.Y.Z" header').toBeTruthy();
  expect(pinned.replace(/^[\^~]/, ''), 'src/lib/marked.js drifted from package.json').toBe(vendored);
});

test('every code theme the picker offers has a local stylesheet', async () => {
  const { CODE_THEMES, codeThemeHref } = await import('../../src/wb-viewmodels/codecontrol.js');
  expect(CODE_THEMES.length, 'CODE_THEMES is empty -- this check is measuring nothing').toBeGreaterThan(10);

  const problems: string[] = [];
  for (const theme of CODE_THEMES as Array<{ id: string }>) {
    const href: string = codeThemeHref(theme.id);
    if (!href.startsWith('file:')) {
      problems.push(`${theme.id}: ${href} is not served by this site`);
      continue;
    }
    const file = fileURLToPath(href);
    if (!fs.existsSync(file)) {
      problems.push(`${theme.id}: ${path.relative(ROOT, file)} is missing -- run node scripts/vendor-code-themes.mjs`);
    } else if (fs.statSync(file).size < 100) {
      problems.push(`${theme.id}: ${path.relative(ROOT, file)} is empty`);
    }
  }

  expect(problems, problems.join('\n')).toEqual([]);
});
