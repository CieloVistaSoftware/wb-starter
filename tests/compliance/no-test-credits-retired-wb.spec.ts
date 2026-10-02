import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { globSync } from 'glob';

/**
 * #1144 guard. John: "this is an outdated rule. we don't use wb-* any more."
 * 4.0.0 retired <wb-*> tags, data-wb and the "component" tier: a semantic tag
 * IS its behavior (nativeMap), everything else is an x-* attribute.
 *
 * Tests may FORBID the retired forms (demos-no-legacy-data-attrs and friends
 * keep doing so). They must never again REQUIRE or CREDIT them -- accept a
 * <wb-*> tag as a valid way to attach a behavior, or tell the reader to use
 * one. These are the phrasings that did, until #1144 removed them.
 */
const CREDITS_RETIRED = [
  /\bhasWbTag\b/,
  /\bhasDataWb\b/,
  /\bUse <wb-/,
  /migrate to <wb-/,
  /uses <wb-\*> tags/,
  /missing <wb-\*> tag/,
  /should be <wb-/,
];

test('no test requires or credits <wb-*> tags or data-wb', () => {
  const offenders: string[] = [];
  for (const file of globSync('tests/**/*.{ts,mjs,js}', { ignore: ['tests/compliance/no-test-credits-retired-wb.spec.ts'] })) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (CREDITS_RETIRED.some((re) => re.test(line))) offenders.push(`${file}:${i + 1}: ${line.trim().slice(0, 120)}`);
    });
  }
  expect(offenders, 'These tests treat a retired <wb-*>/data-wb form as valid (#1144):\n' + offenders.join('\n')).toEqual([]);
});

test('the schema guide teaches x-* setup examples, not <wb-*>', () => {
  expect(readFileSync('docs/claude/SCHEMAS-GUIDE.md', 'utf8')).not.toMatch(/"setup":\s*\["<wb-/);
});
