/**
 * data/schema-index.json is what scripts/build-schema-index.mjs makes of
 * src/wb-models, and nothing ran the script: the committed index listed 166
 * behaviors while the generator lists 174. Two readers trust it.
 *
 * - teach-by-example.js asks for a schema only if the index lists it (#1550),
 *   so an empty <div x-sheet> -- and x-offcanvas, x-clipboard, x-debug,
 *   x-highlight, x-imposter, x-scroll -- got no example at all: none has a
 *   curated one, and the schema fallback was never fetched.
 * - wb.js builds declared modifier classes from each entry's properties and
 *   baseClass (#770), so an entry that lags its schema applies stale classes.
 *
 * The file also ships in the npm package (package.json "files"). This fails
 * when the committed index is not what the generator produces today: run
 * `node scripts/build-schema-index.mjs` and commit the result.
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const OUT = path.join(root, 'data', 'schema-index.json');

// generatedAt is a timestamp and differs on every run; the content is the rest.
const content = (raw: string) => {
  const parsed = JSON.parse(raw);
  delete parsed.generatedAt;
  return parsed as { count: number; schemas: Array<{ name: string }> };
};

test('data/schema-index.json is what build-schema-index.mjs generates today', () => {
  const committed = fs.readFileSync(OUT, 'utf8');
  let generated: string;
  try {
    execFileSync(process.execPath, ['scripts/build-schema-index.mjs'], { cwd: root, encoding: 'utf8' });
    generated = fs.readFileSync(OUT, 'utf8');
  } finally {
    fs.writeFileSync(OUT, committed); // leave the tree as the test found it
  }

  const was = content(committed);
  const now = content(generated);
  const wasNames = new Set(was.schemas.map((s) => s.name));
  const nowNames = new Set(now.schemas.map((s) => s.name));
  const missing = [...nowNames].filter((n) => !wasNames.has(n));
  const extra = [...wasNames].filter((n) => !nowNames.has(n));
  const byName = new Map(was.schemas.map((s) => [s.name, JSON.stringify(s)]));
  const changed = now.schemas.filter((s) => byName.has(s.name) && byName.get(s.name) !== JSON.stringify(s)).map((s) => s.name);

  const why = 'data/schema-index.json is stale; run `node scripts/build-schema-index.mjs` and commit it.\n'
    + `  missing from the index: ${missing.join(', ') || '-'}\n`
    + `  in the index, no schema: ${extra.join(', ') || '-'}\n`
    + `  entries that differ: ${changed.join(', ') || '-'}`;
  expect({ missing, extra, changed }, why).toEqual({ missing: [], extra: [], changed: [] });
  expect(JSON.stringify(now), why).toBe(JSON.stringify(was));
});
