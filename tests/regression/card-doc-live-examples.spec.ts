import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';

const CARD_DOC = 'docs/behaviors/card.md';
const RENDERABLE = /<(wb-[a-z-]+)[\s>]|\sx-[a-z][a-z0-9-]*(=|[\s>])/;

test.describe('card component documentation examples (#419)', () => {
  test('keeps executable examples live and generated structure explanatory', () => {
    const text = readFileSync(CARD_DOC, 'utf8');
    const demos = [...text.matchAll(/<div x-demo\b[^>]*>([\s\S]*?)<\/x-demo>/gi)]
      .map((match) => match[1]);
    const fences = [...text.matchAll(/```(\w*)\r?\n([\s\S]*?)```/g)]
      .map((match) => ({ language: match[1], source: match[2] }));

    expect(demos, 'card.md should keep the ten live card examples').toHaveLength(10);
    expect(
      demos.filter((source) => /<article[\s>]|<article[\s\S]*\sx-card[\s>]/i.test(source)),
      'each live card example should contain a card usage element'
    ).toHaveLength(10);

    const renderableFences = fences.filter(
      ({ language, source }) => language.toLowerCase() === 'html' && RENDERABLE.test(source)
    );
    expect(renderableFences, 'executable card markup must not be hidden in a static fence').toEqual([]);

    const structureFence = fences.find(({ source }) => source.includes('.x-card__header'));
    expect(structureFence?.language, 'generated internal DOM remains a text reference').toBe('text');
  });
});