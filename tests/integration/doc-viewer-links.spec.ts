import { test, expect, request as pwRequest } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * FUNCTIONAL TEST (#226): every link the doc-viewer renders must resolve.
 *
 * Loads http://localhost:3000/public/doc-viewer.html?file=<doc> for each doc in
 * docs/manifest.json, waits for the markdown to render, then:
 *   1. asserts the doc itself loaded (no "Unable to Load Documentation" error), and
 *   2. collects every internal <a> link it rendered, resolves each the way a
 *      browser click would, and HTTP-GETs the target — asserting it isn't a 404.
 *
 * This is the live-page version of the dead-link bug: a doc card / in-doc link
 * that points at a moved-or-missing .md (e.g. architecture/SCHEMA-SPECIFICATION.md
 * when the file lives under architecture/standards/) 404s in the viewer.
 */
const ROOT = process.cwd();
const DOCS = path.join(ROOT, 'docs');

type DocEntry = { file: string; title?: string };

function manifestDocs(): DocEntry[] {
  const manifest = JSON.parse(fs.readFileSync(path.join(DOCS, 'manifest.json'), 'utf8'));
  const out: DocEntry[] = [];
  for (const cat of manifest.categories || []) {
    for (const d of cat.docs || []) {
      if (d && typeof d.file === 'string' && !/^https?:/i.test(d.file)) out.push({ file: d.file, title: d.title });
    }
  }
  // Always include the default landing doc.
  if (!out.some((d) => d.file === 'index.md')) out.unshift({ file: 'index.md' });
  return out;
}

// Resolve a rendered link href (relative to the doc's own directory) to a
// SITE-root-relative path, mirroring the browser's URL resolution. Returns null
// for external / anchor-only links. Doc-to-doc links usually land under docs/,
// but the viewer's path-linkifier can also link non-docs repo files (data/…),
// so we keep the full path rather than assuming a docs/ prefix.
function resolveDocLink(docFile: string, href: string): string | null {
  const h = href.trim();
  if (!h || h.startsWith('#') || /^(https?:|mailto:|tel:)/i.test(h)) return null;
  if (!/\.md(#.*)?$/i.test(h)) return null; // only doc-to-doc links
  const base = new URL('http://x/docs/' + docFile.replace(/^\/+/, ''));
  const resolved = new URL(h.replace(/#.*$/, ''), base);
  return resolved.pathname.replace(/^\/+/, ''); // e.g. 'docs/standards/x.md' or 'data/x.md'
}

const docs = manifestDocs();

test.describe('doc-viewer renders no dead links (#226)', () => {
  for (const doc of docs) {
    test(`${doc.file}: loads and every internal link resolves`, async ({ page, baseURL }) => {
      const req = await pwRequest.newContext({ baseURL });

      // Load the doc in the viewer (file= is site-root-relative, docs/-prefixed).
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto(`/public/doc-viewer.html?file=${encodeURIComponent('docs/' + doc.file)}`, {
        waitUntil: 'domcontentloaded',
      });

      // Wait for either rendered content or the error state (class/element),
      // NOT a text match — some docs legitimately contain the words "failed to
      // load" in code samples.
      await page.waitForFunction(
        () => {
          const c = document.getElementById('content');
          if (!c) return false;
          const errored = c.classList.contains('wb-mdhtml--error') || c.querySelector('.error') !== null;
          return errored || c.querySelector('h1, h2, p, ul, table') !== null;
        },
        { timeout: 20000 }
      );

      // 1) The doc itself must have loaded (check the real error state, not text).
      const errored = await page.evaluate(() => {
        const c = document.getElementById('content');
        return !!c && (c.classList.contains('wb-mdhtml--error') || c.querySelector('.error') !== null);
      });
      expect(errored, `${doc.file} failed to load in the doc-viewer`).toBe(false);

      // 2) Every internal doc-to-doc link must resolve (no 404).
      const hrefs = await page.$$eval('#content a[href]', (els) => els.map((a) => a.getAttribute('href') || ''));
      const targets = [...new Set(hrefs.map((h) => resolveDocLink(doc.file, h)).filter(Boolean) as string[])];

      const broken: string[] = [];
      for (const rel of targets) {
        const res = await req.get(`/${rel}`);
        if (res.status() >= 400) broken.push(`${rel} → HTTP ${res.status()}`);
      }
      await req.dispose();

      expect(broken, `${doc.file} renders dead links:\n  ${broken.join('\n  ')}`).toEqual([]);
    });
  }
});
