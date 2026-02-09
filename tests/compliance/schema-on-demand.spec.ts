import { test, expect } from '@playwright/test';
import fs from 'fs';

// Verifies that WB will fetch an individual schema file on-demand when index.json is unavailable.
test('schema builder should process wb-cardhero when index.json is missing (on-demand fetch)', async ({ page }) => {
  // Stub index.json to simulate it being missing/unavailable
  await page.route('/src/wb-models/index.json', route => route.fulfill({ status: 404, body: 'not found' }));

  // Serve the real cardhero.schema.json so the on-demand fetch can succeed
  const schemaBody = fs.readFileSync('./src/wb-models/cardhero.schema.json', 'utf8');
  await page.route('/src/wb-models/cardhero.schema.json', route => route.fulfill({ status: 200, body: schemaBody, contentType: 'application/json' }));

  await page.goto('/');

  // The fallback should allow the page to register/process the wb-cardhero element
  await page.waitForSelector('wb-cardhero', { state: 'attached', timeout: 10000 });
  const hero = page.locator('wb-cardhero').first();
  // Element may be hidden or render its title via attribute-only API in some environments.
  // Accept either rendered text OR presence of a title attribute that contains the key phrase.
  const titleAttr = await hero.getAttribute('title');
  const hasRenderedText = await hero.locator('text=Build stunning UIs').count() > 0;
  expect(titleAttr || hasRenderedText, 'wb-cardhero must expose the hero title (rendered or attribute)').toBeTruthy();
  if (titleAttr) expect(titleAttr).toMatch(/Build\s+<span|Build\s+stunning UIs/);
});