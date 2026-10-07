import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * THE VALUES COLUMN SAYS WHAT YOU MAY WRITE (#749)
 * ================================================
 * John, on the Figure doc: "the attributes description don't explain what they
 * do." Every attribute table's Values column printed the JS type `string` for
 * 347 rows in 95 docs. Every attribute value is a string, so the cell told a
 * reader nothing. It now names the values (`bottom` · `overlay`) or the shape:
 * CSS length, URL, CSS selector, comma-separated list, JSON array of {…}.
 */
const DOCS = path.join(process.cwd(), 'docs/behaviors');

test('no behavior doc gives `string` as an attribute\'s values', () => {
  const files = fs.readdirSync(DOCS).filter((f) => f.endsWith('.md'));
  expect(files.length, 'the docs were read, so this can fail').toBeGreaterThan(100);
  const bad: string[] = [];
  let rows = 0;
  for (const f of files) {
    fs.readFileSync(path.join(DOCS, f), 'utf8').split('\n').forEach((line, i) => {
      const m = line.match(/^\| `[A-Za-z0-9-]+` \| ([^|]+?) \|/);
      if (!m) return;
      rows++;
      if (/^`?string`?$/.test(m[1].trim())) bad.push(`${f}:${i + 1}`);
    });
  }
  expect(rows, 'attribute rows were found').toBeGreaterThan(500);
  expect(bad, 'name the values or the shape (CSS length, URL, CSS selector, …)').toEqual([]);
});
