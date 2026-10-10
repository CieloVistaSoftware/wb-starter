import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * EVERY BEHAVIOR SCHEMA SAYS WHETHER IT IS AN ELEMENT OR A DECORATOR (#835)
 * =========================================================================
 * Some behaviors are an element: x-card is an <article>, x-checkbox is an
 * <input type=checkbox>, and the tag map turns the native element into the
 * behavior. The rest are decorators: x-ripple, x-tooltip, x-sticky add
 * behavior to whatever host they land on. Until now nothing in a schema said
 * which, so every tool that needed to know (the Behaviors page, the wizard,
 * IntelliSense) had to guess from the tag map or the examples.
 *
 * The schema now says it: "kind": "element" with "element": the native
 * selector, or "kind": "decorator". This gate keeps that in step with the tag
 * map in src/core/tag-map.js -- kind element exactly when nativeMap maps a
 * native element onto the behavior, and element names one of those selectors.
 *
 * Static: it reads files, no browser.
 */

const root = process.cwd();

async function load() {
  const { nativeMap } = await import(pathToFileURL(path.join(root, 'src', 'core', 'tag-map.js')).href);
  const { NOT_COMPONENTS } = await import(
    pathToFileURL(path.join(root, 'scripts', 'lib', 'schema-behavior-reads.mjs')).href
  );
  const selectorsOf = new Map<string, string[]>();
  for (const [selector, behavior] of Object.entries(nativeMap as Record<string, string>)) {
    selectorsOf.set(behavior, [...(selectorsOf.get(behavior) ?? []), selector]);
  }
  const dir = path.join(root, 'src', 'wb-models');
  const schemas = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.schema.json'))
    .map((file) => ({ file, json: JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')) }))
    .filter(({ json }) => json.schemaFor && !(NOT_COMPONENTS as Set<string>).has(json.schemaFor))
    // Only the component tier is a behavior (schema.schema.json's _schemaTypes);
    // a base, definition or page schema carries no kind -- see the test below.
    .filter(({ json }) => !json.schemaType || json.schemaType === 'component');
  return { selectorsOf, schemas };
}

test('every behavior schema declares kind element or decorator (#835)', async () => {
  const { schemas } = await load();
  // A filter that finds nothing passes vacuously.
  expect(schemas.length, 'found almost no behavior schemas -- the gate is broken, not clean').toBeGreaterThan(100);

  const missing = schemas
    .filter(({ json }) => json.kind !== 'element' && json.kind !== 'decorator')
    .map(({ file, json }) => `${file}: kind is ${JSON.stringify(json.kind)}`);
  expect(missing, 'add "kind": "element" (with "element") or "kind": "decorator" after schemaFor').toEqual([]);
});

test('kind agrees with the tag map: element exactly when a native element maps onto the behavior (#835)', async () => {
  const { selectorsOf, schemas } = await load();
  const wrong: string[] = [];
  for (const { file, json } of schemas) {
    const selectors = selectorsOf.get(json.schemaFor);
    if (selectors && json.kind !== 'element') {
      wrong.push(`${file}: the tag map maps ${selectors.join(', ')} onto it, so kind is element`);
    } else if (!selectors && json.kind === 'element') {
      wrong.push(`${file}: no native element maps onto it in src/core/tag-map.js, so kind is decorator`);
    } else if (selectors && !selectors.includes(json.element)) {
      wrong.push(`${file}: element is ${JSON.stringify(json.element)}, expected one of ${selectors.join(', ')}`);
    } else if (!selectors && json.element !== undefined) {
      wrong.push(`${file}: a decorator names no element`);
    }
  }
  expect(wrong).toEqual([]);
});

test('non-behavior schemas (base, definition, page) carry no kind (#835)', () => {
  // schema.schema.json's _schemaTypes: only the component tier is a behavior.
  const dir = path.join(root, 'src', 'wb-models');
  const stray: string[] = [];
  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!entry.name.endsWith('.schema.json') || entry.name === 'schema.schema.json') continue;
      const json = JSON.parse(fs.readFileSync(full, 'utf8'));
      const behavior = !json.schemaType || json.schemaType === 'component';
      if (!behavior && (json.kind !== undefined || json.element !== undefined)) stray.push(`${path.relative(root, full)} (${json.schemaType})`);
    }
  };
  walk(dir);
  expect(stray).toEqual([]);
});

test('data/schema-index.json carries each behavior schema\'s kind and element for the Behaviors page (#835)', async () => {
  const { schemas } = await load();
  const index = JSON.parse(fs.readFileSync(path.join(root, 'data', 'schema-index.json'), 'utf8'));
  const byFile = new Map((index.schemas as Array<{ file: string; kind?: string; element?: string }>).map((e) => [e.file, e]));
  const wrong: string[] = [];
  for (const { file, json } of schemas) {
    const entry = byFile.get(file);
    if (!entry) continue;
    if (entry.kind !== json.kind || entry.element !== json.element) {
      wrong.push(`${file}: index has ${JSON.stringify({ kind: entry.kind, element: entry.element })}, schema has ${JSON.stringify({ kind: json.kind, element: json.element })}`);
    }
  }
  expect(byFile.size, 'the index was read').toBeGreaterThan(100);
  expect(wrong, 'run node scripts/build-schema-index.mjs').toEqual([]);
});
