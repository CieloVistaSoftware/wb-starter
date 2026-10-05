/**
 * #1018 -- John: `<div id="clock" x-clock class="time-display"></div>` --
 * "remove the class value". A behavior's own example must not lean on a class
 * that only this repo's page CSS defines (pages/behaviors.css,
 * pages/components.css): copied into another project, the element would be
 * unstyled. x-clock got its base rule; x-countdown and x-relativetime carried
 * the same class in their examples and docs.
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';

const examples = fs.readFileSync('data/behavior-examples.json', 'utf8');

for (const token of ['x-clock', 'x-countdown', 'x-relativetime']) {
  test(`${token}'s examples and doc need no page-only class`, () => {
    const entry = JSON.parse(examples).examples[token];
    expect(JSON.stringify(entry), `${token} example`).not.toContain('time-display');
    const doc = `docs/behaviors/${token.slice(2)}.md`;
    if (fs.existsSync(doc)) expect(fs.readFileSync(doc, 'utf8'), doc).not.toContain('time-display');
  });
}

test('x-clock and x-countdown have base styles of their own', () => {
  const css = fs.readFileSync('src/styles/behaviors/helpers.css', 'utf8');
  expect(css).toMatch(/^\.x-clock\s*\{/m);
  expect(css).toMatch(/^\.x-countdown\s*\{/m);
});
