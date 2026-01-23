import { test } from '@playwright/test';
import fs from 'fs';

test('debug home page state', async ({ page }) => {
  await page.goto('/');
  const html = await page.content();
  const hasHero = await page.$('wb-cardhero') !== null;
  const indexLoaded = await page.evaluate(() => !!document.documentElement.dataset.testIndexLoaded);
  const out = { hasHero, indexLoaded, htmlSnapshot: html.slice(0, 2000) };
  fs.writeFileSync('data/test-results/debug-home.json', JSON.stringify(out, null, 2));
});
