import { test, expect } from '@playwright/test';
import { loadSchema } from '../base';

test('builder-pages.schema.json: settings have type and setup examples are strings', () => {
  const schema = loadSchema('src/wb-models/builder-pages.schema.json');
  expect(schema.properties.settings.type, 'settings should declare type').toBe('object');
  expect(Array.isArray(schema.test.setup), 'test.setup must be an array').toBe(true);
  for (const s of schema.test.setup) expect(typeof s, 'each setup example should be a string').toBe('string');
});
