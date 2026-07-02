import { test, expect } from '@playwright/test';

/**
 * REGRESSION: the doc-viewer must adopt the theme the user selected elsewhere.
 *
 * The theme system (src/core/theme.js) persists the choice in the shared,
 * same-origin localStorage key 'wb-theme'. The doc-viewer is a standalone page,
 * so it has to read that key on load and set data-theme — otherwise a doc opened
 * from the (themed) docs listing renders in the default theme.
 */
test('doc-viewer applies the persisted wb-theme on load', async ({ page }) => {
  // Seed the persisted theme on the app origin before the doc-viewer loads.
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.setItem('wb-theme', 'ocean'));

  await page.goto('/public/doc-viewer.html?file=docs/index.md', { waitUntil: 'domcontentloaded' });

  const applied = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(applied, 'doc-viewer did not apply the persisted wb-theme').toBe('ocean');
});
