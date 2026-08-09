import fs from 'fs';
import path from 'path';
import { test, expect } from '@playwright/test';

test('behavior registry matches data/behavior-inventory.json', async ({ page }) => {
  const inventoryPath = path.join(process.cwd(), 'data', 'behavior-inventory.json');
  const raw = fs.readFileSync(inventoryPath, 'utf8');
  const inv = JSON.parse(raw);
  const expected = Object.values(inv.byType).flat();

  await page.goto('/index.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 10000 });

  const missing = await page.evaluate((expectedNames) => {
    const reg = Object.keys((window as any).WB?.behaviors || {});
    return expectedNames.filter((n: string) => !reg.includes(n));
  }, expected);

  if (missing.length) {
    console.error('Missing behaviors in runtime registry:', missing.slice(0, 50));
  }
  expect(missing, `Missing behaviors: ${missing.join(', ')}`).toEqual([]);
});