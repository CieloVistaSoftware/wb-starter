import { test, expect } from '@playwright/test';

test.describe('Smoke: builder properties-panel theme readiness', () => {
  test('properties-panel exposes readiness flag or populated native select', async ({ page }) => {
    await page.goto('http://localhost:3000/builder.html');
    await page.waitForLoadState('networkidle');

    // Wait for the properties panel and theme-section anchor to appear
    await page.waitForSelector('#propertiesPanel', { timeout: 5000 });
    await page.waitForSelector('#propertiesPanel [data-test="element-theme-section"], #propertiesPanel [data-test="element-theme-select"], #propertiesPanel select[name="elementTheme"]', { timeout: 5000 });

    const ready = await page.evaluate(() => {
      const panel = document.getElementById('propertiesPanel');
      if (!panel) return false;
      // Contract: either readiness dataset flag OR a populated native <select>
      if (panel.dataset.themeSectionReady === 'true') return true;
      const sel = panel.querySelector('select[name="elementTheme"], [data-test="element-theme-select"]') as HTMLSelectElement | null;
      return !!(sel && sel.options && sel.options.length > 0);
    });

    expect(ready).toBe(true);
  });
});
