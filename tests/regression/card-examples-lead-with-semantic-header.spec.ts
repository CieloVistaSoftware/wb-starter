import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * #1987 -- the first card example a reader sees must be valid, semantic HTML:
 * a real <header> with an <h3>, not title/subtitle attributes. `subtitle` is
 * not an HTML attribute, and `title` is the browser's tooltip, so the attribute
 * form shows the heading as a hover tooltip and loses it with JS off. A dev.to
 * reader judged WB by exactly that example.
 *
 * The attribute form stays supported (and documented as a shorthand in
 * card.md); it just must not be what each of these places leads with.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function leadsWithSemanticHeader(markup: string) {
  expect(markup, 'card example has a real <header>').toMatch(/<header>[\s\S]*<h3>[\s\S]*<\/h3>[\s\S]*<\/header>/);
  expect(markup, 'card example uses no subtitle attribute').not.toMatch(/\ssubtitle=/);
  expect(markup, 'card example uses no title attribute').not.toMatch(/\stitle=/);
}

test('Behaviors page x-card example (data/behavior-examples.json) leads with a semantic header', () => {
  const data = JSON.parse(read('data/behavior-examples.json'));
  const card = (data.examples || data)['x-card'];
  leadsWithSemanticHeader(card.source);
  for (const alt of card.alternates || []) leadsWithSemanticHeader(alt);
});

test('docs/behaviors/card.md Usage opens with a semantic header', () => {
  const md = read('docs/behaviors/card.md');
  const firstDemo = md.match(/<figure x-demo>([\s\S]*?)<\/figure>/);
  expect(firstDemo, 'card.md has an x-demo').not.toBeNull();
  leadsWithSemanticHeader(firstDemo![1]);
});

test('README card example is semantic HTML', () => {
  const readme = read('README.md');
  const block = readme.match(/Then write HTML:\s*```html\s*([\s\S]*?)```/);
  expect(block, 'README has the "Then write HTML" example').not.toBeNull();
  leadsWithSemanticHeader(block![1]);
});

test('seed-behavior-examples x-card is semantic HTML', () => {
  const seed = read('scripts/seed-behavior-examples.mjs');
  const entry = seed.match(/'x-card':\s*`([\s\S]*?)`/);
  expect(entry, 'seed has an x-card entry').not.toBeNull();
  leadsWithSemanticHeader(entry![1]);
});
