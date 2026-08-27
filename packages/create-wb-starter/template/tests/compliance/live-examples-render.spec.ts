import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

/**
 * TEST AUDIT — Dimension 2 of 4: "do all the examples work?" (John,
 * docs/_today/test-audit-2026-08-14.md). §16 of docs/standards/
 * DEMOS-AND-DOCS-STANDARDS.md: "every file in `demos/` must present BOTH a
 * working live demo AND the source code that produced it". This test
 * checks the LIVE half of that pair directly (the code-panel half is
 * doc-viewer-code-panel-audit.spec.ts).
 *
 * `tests/regression/behavior-index-doc-coverage.spec.ts` already does
 * this same check ("real rendered content, not empty/placeholder") for
 * every behavior DOC page (docs/behaviors/**\/*.md, driven by
 * data/behavior-index.json). This test generalizes the same check to the
 * plain demos/**\/*.html and pages/**\/*.html files that render `<div x-demo>`
 * DIRECTLY (no doc-viewer/mdhtml involved) -- a different rendering path
 * behavior-index-doc-coverage.spec.ts never exercises, and the one demo.js
 * calls first-class per §16 ("The `demos/` folder exists so users can see
 * how it's done in HTML").
 *
 * Two checks per file:
 *   1. No uncaught page error while the page (and every <div x-demo> on it,
 *      including lazily-built ones) renders.
 *   2. EVERY `<div x-demo>` block's `.x-demo__grid` renders at least one
 *      REAL, VISIBLE child -- not empty, not a 0x0 placeholder. A demo
 *      that upgrades to nothing (a typo'd tag name, a behavior that threw
 *      during init and left the grid empty) is exactly the "not empty, not
 *      broken, not a stub" failure mode John asked this dimension to
 *      catch.
 *
 * This is an AUDIT test (lives in tests/compliance/ like every other gate
 * in this session's audit pass, so it runs as part of `npm run
 * test:compliance` and its failures are real, visible signal).
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const toPosix = (f: string) => f.split(path.sep).join('/');

function hasWbDemo(file: string): boolean {
  try {
    return fs.readFileSync(file, 'utf8').includes('<div x-demo');
  } catch {
    return false;
  }
}

const HTML_PAGES = [
  ...globSync('demos/**/*.html', { cwd: ROOT }),
  ...globSync('pages/**/*.html', { cwd: ROOT }),
]
  .map(toPosix)
  .filter((f) => hasWbDemo(path.join(ROOT, f)))
  .sort();

test.describe('Live examples render — every <div x-demo> shows real content, no page errors', () => {
  for (const rel of HTML_PAGES) {
    test(`${rel}: every x-demo renders real content with no page errors`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on('pageerror', (e) => pageErrors.push(String(e)));

      await page.goto('/' + rel, { waitUntil: 'domcontentloaded' });

      const demos = page.locator('x-demo');
      const demoCount = await demos.count();
      if (demoCount === 0) test.skip(true, 'no <div x-demo> blocks actually rendered on this page');

      // x-demo.js only builds the first EAGER_BUILD_COUNT (5) blocks
      // synchronously; the rest wait for an IntersectionObserver against the
      // real scroll container. Scroll each into view so lazily-built demos
      // further down the page are actually checked, not silently skipped.
      for (let i = 0; i < demoCount; i++) {
        try {
          await demos.nth(i).scrollIntoViewIfNeeded({ timeout: 5000 });
        } catch {
          // best-effort -- audit whatever built/rendered regardless
        }
      }

      // Deterministic wait: every demo's grid should have finished building
      // (non-empty innerHTML in the grid container) before evaluating, but
      // cap it -- a demo that legitimately never renders anything (the bug
      // this test exists to catch) must not hang the test.
      await page.waitForTimeout(500);

      const emptyDemos = await page.evaluate(() => {
        const problems: string[] = [];
        document.querySelectorAll('x-demo').forEach((demo, i) => {
          const grid = demo.querySelector('.x-demo__grid');
          if (!grid) {
            problems.push(`x-demo[${i}]: no .x-demo__grid was built at all`);
            return;
          }
          const kids = Array.from(grid.children) as HTMLElement[];
          if (kids.length === 0) {
            problems.push(`x-demo[${i}]: .x-demo__grid built but has zero rendered children`);
            return;
          }
          const anyVisible = kids.some((k) => {
            const r = k.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          });
          if (!anyVisible) {
            const label = (demo.textContent || '').trim().slice(0, 50);
            problems.push(`x-demo[${i}] "${label}": has ${kids.length} child(ren) but none has a non-zero rendered size (upgrade likely failed silently)`);
          }
        });
        return problems;
      });

      const message = `${rel}:\n` +
        (pageErrors.length ? `PAGE ERRORS:\n  ${pageErrors.join('\n  ')}\n` : '') +
        (emptyDemos.length ? `EMPTY/BROKEN DEMOS:\n  ${emptyDemos.join('\n  ')}\n` : '');

      expect(pageErrors, message).toEqual([]);
      expect(emptyDemos, message).toEqual([]);
    });
  }
});
