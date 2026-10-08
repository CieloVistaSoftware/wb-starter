import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * THE BUNDLED marked IS THE ONE package.json DECLARES
 * ===================================================
 * src/lib/marked.esm.js ships with the site so markdown never depends on a
 * CDN (tests/regression/mdhtml-renders-without-a-cdn.spec.ts). The cost is
 * keeping that copy current, so this makes an upgrade impossible to half-do:
 * bump "marked" in package.json, `npm install`, and this fails until the copy
 * is refreshed with
 *   cp node_modules/marked/lib/marked.esm.js src/lib/marked.esm.js
 * (then drop its trailing `//# sourceMappingURL` line; the map is not shipped).
 *
 * Static: it reads files, no browser.
 */
test('src/lib/marked.esm.js is the version package.json declares', () => {
  const root = process.cwd();
  const declared = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).dependencies?.marked
    ?? JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).devDependencies?.marked;
  expect(declared, 'package.json declares marked').toBeTruthy();
  const bundled = readFileSync(join(root, 'src', 'lib', 'marked.esm.js'), 'utf8').match(/marked v(\d+\.\d+\.\d+)/)?.[1];
  expect(bundled, 'src/lib/marked.esm.js starts with its "marked vX.Y.Z" banner').toBeTruthy();
  expect(String(declared).replace(/^[\^~=v]+/, ''), 'package.json marked vs the bundled copy').toBe(bundled);
});
