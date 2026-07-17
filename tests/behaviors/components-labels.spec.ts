/**
 * Components page card demos use descriptive labels, not the generic
 * repeated "Basic Card" (issue #136).
 */
import { test, expect } from '@playwright/test';

test('Basic Cards demo has descriptive, non-generic card titles', async ({ page }) => {
  await page.goto('/?page=components');
  await page.waitForSelector('wb-card', { timeout: 20000 });
  await page.waitForTimeout(800);
  const titles = await page.locator('wb-card').evaluateAll((els) =>
    els.map((e) => (e.getAttribute('title') || '').trim()).filter(Boolean)
  );
  // the generic placeholder must be gone
  expect(titles, 'no card should be titled the generic "Basic Card"').not.toContain('Basic Card');
  // and the descriptive one is present
  expect(titles.join('|')).toContain('This is the title');
});
