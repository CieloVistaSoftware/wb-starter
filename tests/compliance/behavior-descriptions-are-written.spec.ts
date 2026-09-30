import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * #1198. 41 behavior schemas shipped the scaffold's own placeholder as their
 * description -- "Behavior applied with x-clock." -- and generate-behavior-docs.mjs
 * copies that line into the doc's summary, so the docs explained nothing about
 * what each element is for. The generator never overwrites an existing doc, so a
 * schema fix alone never reached the page, and nothing noticed either gap.
 *
 * Two guards:
 *  1. No schema carries the placeholder.
 *  2. No behavior doc carries it either, so a fixed schema whose generated doc
 *     was never updated is caught too.
 */

const ROOT = process.cwd();
const MODELS = path.join(ROOT, 'src', 'wb-models');
const DOCS = path.join(ROOT, 'docs', 'behaviors');
const PLACEHOLDER = /^Behavior applied with x-[A-Za-z0-9]+\.$/;

/**
 * image.schema.json documents x-image, which 4.0.0 renamed to img and nothing
 * registers (#1151). Describing a behavior that does not exist would be
 * inventing it; the file is deleted or repointed under #1151.
 */
const DEAD_SCHEMAS = new Set(['image.schema.json']);

test('#1198 -- every behavior schema says what the behavior is for', () => {
  const files = fs.readdirSync(MODELS).filter((f) => f.endsWith('.schema.json'));
  expect(files.length, 'no schemas found -- the check would pass vacuously').toBeGreaterThan(100);

  const placeholders = files
    .filter((f) => !DEAD_SCHEMAS.has(f))
    .filter((f) => {
      const description = JSON.parse(fs.readFileSync(path.join(MODELS, f), 'utf8')).description || '';
      return PLACEHOLDER.test(description.trim());
    });

  expect(placeholders, 'these schemas still carry the scaffold placeholder as their description').toEqual([]);
});

test('#1198 -- no behavior doc shows the placeholder as its summary', () => {
  const docs = fs.readdirSync(DOCS).filter((f) => f.endsWith('.md'));
  expect(docs.length, 'no behavior docs found -- the check would pass vacuously').toBeGreaterThan(100);

  const placeholders = docs.filter((f) =>
    fs.readFileSync(path.join(DOCS, f), 'utf8').split(/\r?\n/).some((line) => PLACEHOLDER.test(line.trim())));

  expect(placeholders, 'these docs still show "Behavior applied with x-..." instead of saying what the behavior does').toEqual([]);
});
