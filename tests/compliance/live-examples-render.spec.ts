import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';
import { buildEveryDemo, auditDemos } from '../helpers/x-demo-audit';

/**
 * TEST AUDIT — Dimension 2 of 4: "do all the examples work?" (John,
 * docs/_today/test-audit-2026-08-14.md). §16 of docs/standards/
 * DEMOS-AND-DOCS-STANDARDS.md: "every file in `demos/` must present BOTH a
 * working live demo AND the source code that produced it". This test
 * checks the LIVE half of that pair directly (the code-panel half is
 * doc-viewer-code-panel-audit.spec.ts).
 *
 * `tests/regression/component-index-doc-coverage.spec.ts` already does
 * this same check ("real rendered content, not empty/placeholder") for
 * every component DOC page (docs/behaviors/**\/*.md, driven by
 * data/component-index.json). This test generalizes the same check to the
 * plain demos/**\/*.html and pages/**\/*.html files that render `<div x-demo>`
 * DIRECTLY (no doc-viewer/mdhtml involved) -- a different rendering path
 * component-index-doc-coverage.spec.ts never exercises, and the one demo.js
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
    // #917: any host; the standard one is <figure x-demo>.
    return /<(?:figure|div|section|article) x-demo/.test(fs.readFileSync(file, 'utf8'));
  } catch {
    return false;
  }
}

const HTML_PAGES = [
  ...globSync('demos/**/*.html', { cwd: ROOT, posix: true }),
  ...globSync('pages/**/*.html', { cwd: ROOT, posix: true }),
]
  .map(toPosix)
  .filter((f) => hasWbDemo(path.join(ROOT, f)))
  .sort();

test.describe('Live examples render — every <div x-demo> shows real content, no page errors', () => {
  for (const rel of HTML_PAGES) {
    test(`${rel}: every [x-demo] renders real content with no page errors`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on('pageerror', (e) => pageErrors.push(String(e)));

      await page.goto('/' + rel, { waitUntil: 'domcontentloaded' });

      const demos = page.locator('[x-demo]');
      const demoCount = await demos.count();
      // The work here is per block: every demo has to be brought into view so the
      // lazy runtime (#491) builds it. demos/site/cards.html holds 293 of them and
      // needs ~22s on an idle machine, so the budget grows with the page. The base
      // is 60s rather than 30s because the wait below is now for the builds
      // themselves (#1817), and a busy machine is allowed to be slow at building.
      const budget = 60_000 + demoCount * 150;
      test.setTimeout(budget);
      if (demoCount === 0) test.skip(true, 'no <div x-demo> blocks actually rendered on this page');

      // #1817: wait for the builds themselves, then audit (tests/helpers/x-demo-audit.ts).
      const buildWait = budget - 15_000;
      const builtInTime = await buildEveryDemo(page, buildWait);
      const emptyDemos = await auditDemos(page, buildWait);

      const message = `${rel}:\n` +
        (pageErrors.length ? `PAGE ERRORS:\n  ${pageErrors.join('\n  ')}\n` : '') +
        (emptyDemos.length ? `EMPTY/BROKEN DEMOS:\n  ${emptyDemos.join('\n  ')}\n` : '') +
        (builtInTime ? '' : `(not every block had finished building within ${buildWait}ms)\n`);

      expect(pageErrors, message).toEqual([]);
      expect(emptyDemos, message).toEqual([]);
    });
  }
});
