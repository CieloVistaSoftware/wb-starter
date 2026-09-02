import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { globSync } from 'glob';
// The depth-aware extractor, shared with the integrity script. A regex cannot
// find the end of a `<div x-demo>` block: the host is a <div> and `</div>` is
// the commonest closing tag in any document, so a lazy match stops at the
// first nested close rather than the block's own.
import { extractDemoBlocks } from '../../scripts/lib/demo-blocks.mjs';

/**
 * DEMOS-AND-DOCS-STANDARDS.md §1/§2: a live demo wrapper already renders the
 * example and its exact source. A separate fenced Usage block is redundant
 * when it repeats that same markup, so keep one source of truth.
 *
 * This file previously carried a regex left behind by the 4.0.0 rename:
 *
 *     new RegExp('<' + '[x-demo]\\b[^>]*>([\\s\\S]*?)' + '<' + '\\/x-demo>', 'gi')
 *
 * `[x-demo]` is a character CLASS, and `x-d` inside one is a range whose
 * endpoints are out of order, so constructing it threw
 * `SyntaxError: Range out of order in character class` at module load.
 * Playwright treats a collection-time throw as fatal for the whole PROJECT:
 * `npm run test:compliance` reported "Total: 0 tests" and exited without
 * running a single compliance check. The gate looked like it ran. It collected
 * nothing.
 *
 * The tag it was still hunting for (`</x-demo>`) had not existed since 4.0.0
 * either, so even repaired as a regex it would have matched zero blocks.
 */

// The glob already covers docs/behaviors/*.md; card.md was ALSO listed
// explicitly, so it was scanned twice.
const FILES = globSync('docs/behaviors/*.md', { cwd: process.cwd() }).sort();

function normalizeMarkup(markup: string): string {
  return markup.replace(/\s+/g, ' ').trim();
}

test('the sweep actually ran', () => {
  expect(FILES.length, 'no behavior docs matched docs/behaviors/*.md').toBeGreaterThan(10);
});

test('docs do not repeat an x-demo source in a fenced Usage block', () => {
  const violations: string[] = [];
  let demoBlocksSeen = 0;

  for (const file of FILES) {
    const text = readFileSync(file, 'utf8');
    const demos = extractDemoBlocks(text).map((block: { inner: string }) => normalizeMarkup(block.inner));
    demoBlocksSeen += demos.length;

    const fences = [...text.matchAll(/```html\s*([\s\S]*?)```/gi)]
      .map((match) => normalizeMarkup(match[1]));

    for (const source of fences) {
      if (source && demos.includes(source)) {
        violations.push(`${file}: fenced HTML repeats a live demo source`);
      }
    }
  }

  // A matcher that finds no demos at all cannot find a duplicate either —
  // which is exactly the state this check was in.
  expect(demoBlocksSeen, 'no <div x-demo> blocks were found in any behavior doc').toBeGreaterThan(0);
  expect(violations, violations.join('\n')).toEqual([]);
});
