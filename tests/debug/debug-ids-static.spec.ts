import { test, expect } from '@playwright/test';

test('IDs are static and cannot be edited via builder UI', async ({ page }) => {
  await page.goto('/builder.html');

  // Wait for builder canvas and components
  await page.waitForSelector('.canvas');

  // Ensure there's at least one component: add a semantic <section> into main if none exist
  let comp = page.locator('.canvas-component').first();
  if (await comp.count() === 0) {
    await page.evaluate(() => {
      if (typeof window.addSemanticElement === 'function') {
        window.addSemanticElement('section', 'main', { name: 'Section', icon: '📑' });
      }
    });
    comp = page.locator('.canvas-component').first();
  }
  await comp.click();

  const idInput = page.locator('#propertiesPanel input[placeholder="Optional element ID"]');
  await expect(idInput).toBeVisible();
  await expect(idInput).toBeDisabled();

  // Ensure updateElementId API is a no-op
  const hadToast = await page.evaluate(() => {
    const origToast = window.toast;
    window.toast = (msg) => { window._lastToast = msg; };
    if (typeof window.updateElementId === 'function') window.updateElementId('nonexistent', 'trychange');
    const res = window._lastToast || null;
    window.toast = origToast;
    return res;
  });
  expect(hadToast).toBeTruthy();
});