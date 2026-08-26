import fs from 'fs';
import path from 'path';
import { test, expect } from '@playwright/test';

const ROOT = process.cwd();
const SCHEMA_DIR = path.join(ROOT, 'src', 'wb-models');
const VIEWMODEL_DIR = path.join(ROOT, 'src', 'wb-viewmodels');
const REGISTRY_PATH = path.join(VIEWMODEL_DIR, 'index.js');

const EXPORT_ALIASES: Record<string, string> = {
  switch: 'switchInput',
  image: 'img',
  'drawer-layout': 'drawerLayout',
  'sidebar-layout': 'sidebarlayout',
  searchfield: 'searchField',
  copybutton: 'copyButton',
  'fix-card': 'fixCard',
};

const NON_COMPONENT_SCHEMAS = new Set([
  'behavior',
  'behaviors',
  'css-oop',
  'home-page',
]);

function listFiles(dir: string, extension: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) listFiles(fullPath, extension, files);
    else if (entry.name.endsWith(extension)) files.push(fullPath);
  }
  return files;
}

function loadSchemas() {
  return listFiles(SCHEMA_DIR, '.schema.json').map((file) => ({
    file: path.relative(ROOT, file),
    schema: JSON.parse(fs.readFileSync(file, 'utf8')),
  })).filter(({ file, schema }) => {
    const behavior = schema.behavior || schema.schemaFor;
    return (schema.schemaType || 'component') === 'component' &&
      !path.basename(file).includes('.base.') &&
      behavior && !NON_COMPONENT_SCHEMAS.has(behavior);
  });
}

function registryKeys() {
  const source = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const match = source.match(/const behaviorModules = \{([\s\S]*?)\n\};/);
  if (!match) throw new Error('behaviorModules registry not found');

  const keys = new Set<string>();
  for (const line of match[1].split('\n')) {
    const withoutComment = line.replace(/\/\/.*$/, '').trim();
    const keyMatch = withoutComment.match(/^['"]?([a-zA-Z0-9_-]+)['"]?\s*:/);
    if (keyMatch) keys.add(keyMatch[1]);
    const inlineKeys = withoutComment.matchAll(/(?:^|,)\s*['"]?([a-zA-Z0-9_-]+)['"]?\s*:/g);
    for (const inlineKey of inlineKeys) keys.add(inlineKey[1]);
  }
  return keys;
}

function allViewmodelSource() {
  return listFiles(VIEWMODEL_DIR, '.js')
    .map(file => fs.readFileSync(file, 'utf8')).join('\n');
}

function behaviorSurface(behavior: string) {
  const kebab = behavior.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  return [`<wb-${kebab}`, `x-${kebab}`];
}

test.describe('Schema/behavior completeness audit (#344)', () => {
  test('component schemas resolve through the behavior registry and source exports', () => {
    const registry = registryKeys();
    const source = allViewmodelSource();
    const missingRegistry: string[] = [];
    const missingFunctions: string[] = [];

    for (const { file, schema } of loadSchemas()) {
      const behavior = schema.behavior || schema.schemaFor;
      if (!registry.has(behavior)) missingRegistry.push(`${file}: ${behavior}`);

      const functionName = EXPORT_ALIASES[behavior] || behavior;
      const functionPattern = new RegExp(`export\\s+(?:default\\s+)?(?:async\\s+)?function\\s+${functionName}\\s*\\(`);
      if (!functionPattern.test(source)) missingFunctions.push(`${file}: ${functionName}()`);
    }

    expect(missingRegistry, `Missing registry entries:\n${missingRegistry.join('\n')}`).toEqual([]);
    expect(missingFunctions, `Missing exported functions:\n${missingFunctions.join('\n')}`).toEqual([]);
  });

  /**
   * The REVERSE direction, which nothing checked.
   *
   * The test above walks schema -> behavior: every schema must resolve to a
   * registry entry and an exported function. It cannot see a behavior that has
   * NO schema, because there is no schema to start from.
   *
   * That matters more than it sounds, because a schema is not just
   * documentation here -- it is the input to
   * tests/behaviors/every-declared-attribute.spec.ts (#768), which sets every
   * declared attribute and asserts the rendered element actually changed. A
   * behavior with no schema declares no attributes, so that sweep has nothing
   * to test and passes it in silence. The behavior is not verified; it is
   * INVISIBLE.
   *
   * `fill` (#764) was exactly that: registered in tag-map, implemented,
   * documented, styled, shipped -- and exempt from the property sweep because
   * nobody wrote fill.schema.json. It also had no entry in
   * data/behavior-examples.json, so the showcase rendered a placeholder for
   * it, which is how it was finally noticed.
   *
   * John: "we need a unit test that ensures all properties are rendered for
   * everything we have." The sweep that does that already exists; this is the
   * assertion that keeps "everything we have" honest.
   */
  test('every registered behavior has a schema, so none escapes the property sweep', () => {
    const tagMap = fs.readFileSync(path.join(ROOT, 'src', 'core', 'tag-map.js'), 'utf8');
    const block = tagMap.match(/extensionMap\s*=\s*\{([\s\S]*?)\n\}/);
    expect(block, 'could not read extensionMap from tag-map.js').toBeTruthy();

    const behaviors = new Set(
      [...(block ? block[1] : '').matchAll(/'x-[a-z0-9-]+'\s*:\s*'([a-z0-9-]+)'/g)].map((m) => m[1]),
    );
    expect(
      behaviors.size,
      'no behaviors parsed out of extensionMap — this check would pass vacuously',
    ).toBeGreaterThan(50);

    const haveSchema = new Set(
      fs.readdirSync(SCHEMA_DIR)
        .filter((f) => f.endsWith('.schema.json'))
        .map((f) => f.replace('.schema.json', '')),
    );

    const missing = [...behaviors].filter((b) => !haveSchema.has(b) && !NON_COMPONENT_SCHEMAS.has(b)).sort();

    expect(
      missing,
      `${missing.length} registered behavior(s) have no schema in src/wb-models, so ` +
      `every-declared-attribute.spec.ts (#768) cannot test their properties and passes ` +
      `them in silence:\n  ${missing.join('\n  ')}\n\n` +
      `Add <name>.schema.json declaring each attribute the behavior reads.`,
    ).toEqual([]);
  });

  test('component setup entries use their declared behavior surface', () => {
    const mismatches: string[] = [];
    const coverageGaps: string[] = [];

    for (const { file, schema } of loadSchemas()) {
      const behavior = schema.behavior || schema.schemaFor;
      const setups = schema.test?.setup || [];
      const surface = behaviorSurface(behavior);
      if (behavior.startsWith('card')) surface.push('<article');
      const relevant = setups.filter((html: string) => surface.some(marker => html.includes(marker)));

      if (setups.some((html: string) => !surface.some(marker => html.includes(marker)))) {
        mismatches.push(`${file}: setup entry does not use <wb-${behavior}> or x-${behavior}`);
      }
      if (relevant.length < 5) coverageGaps.push(`${file}: ${relevant.length}/5 relevant setup entries`);
    }

    if (coverageGaps.length) console.warn(`Schema coverage gaps (#344):\n${coverageGaps.join('\n')}`);
    expect(mismatches, `Setup/behavior mismatches:\n${mismatches.join('\n')}`).toEqual([]);
  });
});