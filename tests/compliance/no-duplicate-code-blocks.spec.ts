/**
 * src/ does not grow new copies of its own code (#883).
 *
 * John: "no duplicates of any code allowed." #883 measured 85 duplicate
 * clusters in src/; PRs #1278 and #1281 removed all but the blocks that
 * src/core/wb.js and src/core/wb-lazy.js, the two runtimes, both carry. Until
 * now nothing in the repo could count them, so nothing stopped a copy coming
 * back.
 *
 * CEILING is the count on main today. It only goes down: when a PR removes a
 * block, lower CEILING to the new count in the same PR. #883 is done at 0.
 */
import fs from 'fs';
import path from 'path';
import { test, expect } from '../fixtures/offline';
import { ROOT } from '../base';
import { duplicateBlocks } from '../../scripts/lib/duplicate-blocks.mjs';

const CEILING = 7;

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return sourceFiles(full);
    return /\.js$/.test(e.name) && !/\.min\.js$/.test(e.name) ? [full] : [];
  });
}

test('the detector finds a copied block and ignores code that only looks alike', () => {
  const body = ['const a = read(el);', 'if (!a) return;', 'el.classList.add(a);', 'el.dataset.x = a;', 'emit(el, a);', 'log(a);'].join('\n');
  expect(duplicateBlocks({ 'one.js': `function f(el) {\n${body}\n}`, 'two.js': `function g(el) {\n${body}\n}` })).toHaveLength(1);
  // Same shape, different identifiers: not a copy.
  expect(duplicateBlocks({ 'one.js': body, 'two.js': body.replace(/\ba\b/g, 'b') })).toHaveLength(0);
});

test(`src/ has at most ${CEILING} duplicated code blocks`, () => {
  const files = Object.fromEntries(
    sourceFiles(path.join(ROOT, 'src')).map((f) => [path.relative(ROOT, f).replace(/\\/g, '/'), fs.readFileSync(f, 'utf8')])
  );
  const blocks = duplicateBlocks(files);
  const listing = blocks.map((b) => `  ${b.lines} lines: ${b.places.map((p) => `${p.path}:${p.start}-${p.end}`).join('  ==  ')}`).join('\n');
  expect(blocks.length, `${blocks.length} duplicated blocks (ceiling ${CEILING}). Move the shared code into one module both import:\n${listing}`).toBeLessThanOrEqual(CEILING);
});
