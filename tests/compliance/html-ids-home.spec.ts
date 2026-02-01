import { test, expect } from '@playwright/test';
import { ROOT, readFile } from '../base';

test('pages/home.html: key stat-items and preview rows have IDs', async ({ page }) => {
  const file = `${ROOT}/pages/home.html`;
  const content = readFile(file);
  await page.setContent(content);

  // stat items should have deterministic ids
  for (let i = 0; i < 4; i++) {
    const el = await page.$(`#autogen-home-stat-${i}`);
    expect(el, `autogen-home-stat-${i} should exist`).not.toBeNull();
    expect(await el?.getAttribute('id')).toBeTruthy();
  }

  // preview canvas/rows should have ids
  const canvas = await page.$('#home-preview-canvas');
  expect(canvas, 'home preview canvas must have id').not.toBeNull();
  const row = await page.$('#home-preview-row-1');
  expect(row, 'home preview row must have id').not.toBeNull();

  // Targeted assertions above verify the highest-value containers have IDs.
  // Global missing-ID coverage is enforced by the canonical html-ids.spec.ts (left for a follow-up cleanup).
});
