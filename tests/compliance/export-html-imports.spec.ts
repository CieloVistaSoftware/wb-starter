import { test, expect } from '@playwright/test';
import { readFile } from '../base';

test('builder-io: exported HTML should reference /src/index.js (no local ./src/ path)', () => {
  const src = readFile('src/wb-viewmodels/builder-app/builder-io.js');
  expect(src.includes("import WB from './src/index.js'"), 'no literal "./src/index.js" in source').toBe(false);
  expect(src.includes("import WB from '/src/index.js'"), 'export should reference absolute path').toBe(true);
});
