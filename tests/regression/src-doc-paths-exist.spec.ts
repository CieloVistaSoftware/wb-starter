import { test, expect } from '../fixtures/offline';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * EVERY DOC PATH THE CODE NAMES EXISTS (#1685)
 * ===========================================
 * src/wb-viewmodels/demo-docmap.js mapped 18 behaviors to doc paths under
 * /docs/components/, a folder that no longer exists -- every one a 404. It
 * stayed unnoticed because demo.js imported the map and never read it. A map
 * of dead links that looks live is a trap: the next "docs" link wired to a
 * demo would have picked one up.
 *
 * Every `docs/....md` string literal in src/ code (comments are examples, not
 * links, and are skipped) must name a file that exists.
 *
 * Seen to fail: on main before this change it reported the 18 demo-docmap.js
 * paths.
 */

function jsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? jsFiles(p) : p.endsWith('.js') ? [p] : [];
  });
}

/** Source with block and line comments blanked, so examples in prose are not read as links. */
function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\'"`])\/\/.*$/gm, '$1');
}

test('every docs/*.md path named in src/ code exists (#1685)', () => {
  const missing: string[] = [];
  let seen = 0;
  for (const file of jsFiles('src')) {
    for (const m of code(readFileSync(file, 'utf8')).matchAll(/['"`]\/?(docs\/[\w./-]+\.md)['"`]/g)) {
      seen++;
      if (!existsSync(m[1])) missing.push(`${file}: ${m[1]}`);
    }
  }
  expect(seen, 'no doc paths found in src/ -- the scan would pass vacuously').toBeGreaterThan(0);
  expect(missing, 'src/ names doc files that do not exist').toEqual([]);
});
