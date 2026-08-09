import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * COMPLIANCE GATE: SPA-injected page fragments must load resources root-relative.
 *
 * pages/*.html are FRAGMENTS (no <!doctype>/<html>) — the shell fetches them and
 * injects via innerHTML, so their relative URLs resolve against the shell's base
 * (the site root, /wb-starter/ on the deploy), NOT the page's own location.
 * Therefore a resource link like <link href="../src/styles/pages/docs.css"> walks
 * UP past the site root to the domain root (/src/styles/… → 404), and a leading-
 * slash href (/src/…) hits the domain root too. Both 404 on the project-pages
 * deploy while passing in local dev at '/'.
 *
 * Rule: in a fragment page, every resource-loading tag (link/script/img/source/
 * audio/video) must reference resources root-relative — no leading `../`, no
 * leading `/`. (Navigation <a href> is out of scope for this gate.)
 */
const ROOT = process.cwd();
const RESOURCE_REF = /<(?:link|script|img|source|audio|video)\b[^>]*?\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;

function pageFiles(): string[] {
  const dir = path.join(ROOT, 'pages');
  let names: string[] = [];
  try { names = fs.readdirSync(dir).filter((n) => n.endsWith('.html')); } catch { return []; }
  return names.map((n) => `pages/${n}`);
}

function isFragment(content: string): boolean {
  return !/<!doctype|<html[\s>]/i.test(content);
}

test.describe('Injected page fragments load resources root-relative', () => {
  for (const rel of pageFiles()) {
    test(`${rel}: resource refs are root-relative`, () => {
      const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      if (!isFragment(content)) return; // standalone page — resolves from its own dir

      const bad: string[] = [];
      for (const m of content.matchAll(RESOURCE_REF)) {
        const ref = m[1].trim();
        if (/^(https?:|data:|mailto:|#)/i.test(ref) || ref.startsWith('//')) continue;
        if (ref.startsWith('../') || ref.startsWith('/')) bad.push(ref);
      }
      const offenders = [...new Set(bad)].sort();

      expect(
        offenders,
        `${rel} loads resources with ../ or /-absolute paths that 404 under the ` +
        `/wb-starter/ base (fragments inject at the site root):\n  ${offenders.join('\n  ')}\n  ` +
        `Use a root-relative path (e.g. src/styles/pages/x.css).`
      ).toEqual([]);
    });
  }
});
