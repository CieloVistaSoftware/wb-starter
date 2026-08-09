import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { globSync } from 'glob';

/**
 * DEMOS-AND-DOCS-STANDARDS.md §1/§2: a live demo wrapper already renders the
 * example and its exact source. A separate fenced Usage block is redundant
 * when it repeats that same markup, so keep one source of truth.
 */

const FILES = [
  ...globSync('docs/behaviors/*.md', { cwd: process.cwd() }),
  'docs/components/cards/card.md',
].sort();
const DEMO_BLOCK = new RegExp(
  String.fromCharCode(60) + 'wb-demo\\b[^>]*>([\\s\\S]*?)' + String.fromCharCode(60) + '\\/wb-demo>',
  'gi'
);

function normalizeMarkup(markup: string): string {
  return markup.replace(/\s+/g, ' ').trim();
}

test('docs do not repeat a wb-demo source in a fenced Usage block', () => {
  const violations: string[] = [];

  for (const file of FILES) {
    const text = readFileSync(file, 'utf8');
    const demos = [...text.matchAll(DEMO_BLOCK)]
      .map((match) => normalizeMarkup(match[1]));
    const fences = [...text.matchAll(/```html\s*([\s\S]*?)```/gi)]
      .map((match) => normalizeMarkup(match[1]));

    for (const source of fences) {
      if (source && demos.includes(source)) {
        violations.push(`${file}: fenced HTML repeats a live demo source`);
      }
    }
  }

  expect(violations, violations.join('\n')).toEqual([]);
});