import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { LEGACY_SYNTAX_FIXTURES, isLegacySyntaxFixture, isLegacySyntaxFixtureUrl } from '../utils/legacy-syntax-fixtures';

/**
 * #1173: two different files are named legacy-syntax-check.html (a demo and a
 * strict-mode fixture), and compliance specs exempted that NAME, so an
 * exemption meant for one silently covered the other: put retired markup in
 * either and the checks that should catch it looked away (as in #910).
 * Exemptions now name one file each, by repo-relative path.
 */
const ROOT = process.cwd();
const BASENAME = 'legacy-syntax-check' + '.html';

test('every legacy-syntax exemption names a file that exists (#1173)', () => {
  const missing = Object.keys(LEGACY_SYNTAX_FIXTURES).filter((p) => !fs.existsSync(path.join(ROOT, p)));
  expect(missing, 'exempt paths with no file behind them').toEqual([]);
});

test('an exemption covers its own file, not a namesake elsewhere (#1173)', () => {
  expect(isLegacySyntaxFixture('demos/legacy-syntax-check.html')).toBe(true);
  expect(isLegacySyntaxFixture('tests\\compliance\\legacy-syntax-check.html')).toBe(true);
  expect(isLegacySyntaxFixture('pages/legacy-syntax-check.html')).toBe(false);
  expect(isLegacySyntaxFixtureUrl('http://localhost:3000/demos/legacy-syntax-check.html?x=1')).toBe(true);
  expect(isLegacySyntaxFixtureUrl('/pages/legacy-syntax-check.html')).toBe(false);
  expect(isLegacySyntaxFixtureUrl(undefined)).toBe(false);
});

test('no compliance spec exempts the legacy-syntax fixture by bare file name (#1173)', () => {
  const dir = path.join(ROOT, 'tests', 'compliance');
  const quoted = new RegExp(`['"\`]${BASENAME.replace(/\./g, '\\.')}['"\`]|\\.includes\\(\\s*['"\`]${BASENAME.replace(/\./g, '\\.')}`);
  const hits: string[] = [];
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.ts')) continue;
    fs.readFileSync(path.join(dir, name), 'utf8').split(/\r?\n/).forEach((line, i) => {
      if (/^\s*(\/\/|\*)/.test(line)) return;
      if (quoted.test(line)) hits.push(`tests/compliance/${name}:${i + 1}: ${line.trim()}`);
    });
  }
  expect(hits, 'match by path via tests/utils/legacy-syntax-fixtures.ts instead').toEqual([]);
});
