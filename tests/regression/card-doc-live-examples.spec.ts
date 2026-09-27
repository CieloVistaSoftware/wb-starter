import { test, expect } from '../fixtures/offline';
import { readFileSync } from 'fs';

const CARD_DOC = 'docs/behaviors/card.md';
const RENDERABLE = /<(wb-[a-z-]+)[\s>]|\sx-[a-z][a-z0-9-]*(=|[\s>])/;

test.describe('card component documentation examples (#419)', () => {
  test('keeps executable examples live and generated structure explanatory', () => {
    const text = readFileSync(CARD_DOC, 'utf8');
    // A demo block closes with the `</div>` that starts its own line. The
    // pattern used to end at `</x-demo>` -- the closing tag of the element
    // form retired in 4.0.0, which a <div x-demo> never has -- so it matched
    // nothing and reported ten live demos as zero.
    const demos = [...text.matchAll(/^<div x-demo\b[^>]*>([\s\S]*?)^<\/div>/gim)]
      .map((match) => match[1]);
    const fences = [...text.matchAll(/```(\w*)\r?\n([\s\S]*?)```/g)]
      .map((match) => ({ language: match[1], source: match[2] }));

    expect(demos, 'card.md should keep the ten live card examples').toHaveLength(10);
    expect(
      // <article> is a card by itself; any other host names the behavior.
      demos.filter((source) => /<article[\s>]|<[a-z]+\s+x-card[\s>]/i.test(source)),
      'each live card example should contain a card usage element'
    ).toHaveLength(10);

    const renderableFences = fences.filter(
      ({ language, source }) => language.toLowerCase() === 'html' && RENDERABLE.test(source)
    );
    expect(renderableFences, 'executable card markup must not be hidden in a static fence').toEqual([]);

    // The structure is described by tag now: cards stopped emitting
    // .x-card__header (a8a7362e), so the doc names the header as the selector
    // card.css actually uses.
    const structureFence = fences.find(({ source }) => source.includes('article > header'));
    expect(structureFence?.language, 'generated internal DOM remains a text reference').toBe('text');
  });
});