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

  test('component setup entries use their declared behavior surface', () => {
    const mismatches: string[] = [];
    const coverageGaps: string[] = [];

    for (const { file, schema } of loadSchemas()) {
      const behavior = schema.behavior || schema.schemaFor;
      const setups = schema.test?.setup || [];
      const surface = behaviorSurface(behavior);
      if (behavior.startsWith('card')) surface.push('<wb-card');
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