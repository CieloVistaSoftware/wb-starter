import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * #1151: 4.0.0 renamed the image behavior to img, but the catalogue the
 * Behaviors page is built from (data/behavior-examples.json) kept an x-image
 * entry. x-image is registered nowhere, so its example taught a behavior that
 * does nothing, next to the real x-img entry. Every catalogue key must be
 * x-<name> for a behavior in the runtime registry.
 */
test('every behavior-examples.json key names a registered behavior (#1151)', async () => {
  const { behaviorModules } = await import(pathToFileURL(path.resolve('src/wb-viewmodels/index.js')).href);
  const registered = new Set(Object.keys(behaviorModules));
  expect(registered.size, 'the registry was read').toBeGreaterThan(100);

  const { examples } = JSON.parse(fs.readFileSync('data/behavior-examples.json', 'utf8'));
  const keys = Object.keys(examples);
  expect(keys.length, 'the catalogue was read').toBeGreaterThan(100);

  const stray = keys.filter((k) => !(k.startsWith('x-') && registered.has(k.slice(2))));
  expect(stray, 'catalogue entries for behaviors that do not exist').toEqual([]);
});
