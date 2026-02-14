import { test, expect } from '@playwright/test';
import { loadSchema } from '../base';

test('builder-pages.schema.json: settings have type and setup examples are strings', () => {
  const schema = loadSchema('builder-pages.schema.json');
  if (!schema) { test.skip(); return; }
  if (!schema.properties?.settings) { test.skip(); return; }
  expect(schema.properties.settings.type, 'settings should declare type').toBe('object');
  if (!schema.test?.setup) { test.skip(); return; }
  expect(Array.isArray(schema.test.setup), 'test.setup must be an array').toBe(true);
  for (const s of schema.test.setup) expect(typeof s, 'each setup example should be a string').toBe('string');
});
