import { test, expect } from '@playwright/test';
import { getFiles, readFile, PATHS, relativePath } from '../base';

// Spot-check that the files changed in this PR no longer declare the old identifiers.
// Global duplicate cleanup is tracked separately (large sweep required).
test('duplicate-spot-checks: patched files do not contain old duplicate identifiers', () => {
  const core = readFile('src/wb-viewmodels/builder-app/builder-components-core.js');
  const components = readFile('src/wb-viewmodels/builder-app/builder-components.js');
  const dnd = readFile('src/wb-viewmodels/builder-app/builder-dnd.js');

  expect(core.includes('const semanticTags'), 'builder-components-core.js should not declare "semanticTags"').toBe(false);
  expect(components.includes('const semanticTags'), 'builder-components.js should not declare "semanticTags"').toBe(false);
  // Ensure builder-dnd now uses the unified name
  expect(dnd.includes('templateComponent'), 'builder-dnd.js should use "templateComponent" after rename').toBe(true);
});
