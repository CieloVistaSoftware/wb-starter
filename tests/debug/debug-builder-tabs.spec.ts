import { test, expect } from '@playwright/test';

test('Adding tabs component inserts 3 default tabs with lorem ipsum', async ({ page }) => {
  await page.goto('/builder.html');

  // Debug: list available templates and ensure function exists
  const templateKeys = await page.evaluate(() => {
    const t = window.componentTemplates || (typeof componentTemplates !== 'undefined' ? componentTemplates : {});
    return Object.keys(t || {});
  });
  console.log('DEBUG: templateKeys=', templateKeys.join(','));

  // Call builder helper to add tabs to main section
  const added = await page.evaluate(() => {
    if (typeof addComponentToCanvas === 'function') {
      try {
        addComponentToCanvas('tabs', 'main');
        return true;
      } catch (e) {
        return { error: e && e.message };
      }
    } else {
      return { error: 'addComponentToCanvas is not available' };
    }
  });
  console.log('DEBUG: addComponentToCanvas result=', added);

  // Debug: capture current canvas-component state
  const componentCount = await page.evaluate(() => document.querySelectorAll('.canvas-component').length);
  console.log('DEBUG: componentCount=', componentCount);
  const lastHtml = await page.evaluate(() => {
    const el = document.querySelector('.canvas-component:last-child');
    return el ? el.innerHTML.slice(0,1000) : null;
  });
  console.log('DEBUG: lastHtml=', lastHtml);

  // Expect a wb-tabs element to appear within the newly added component
  const tabs = page.locator('.canvas-component wb-tabs').first();
  await expect(tabs).toBeVisible();

  // Count wb-tab children
  const tabCount = await tabs.locator('wb-tab').count();
  expect(tabCount).toBeGreaterThanOrEqual(3);

  // Check that first tab contains lorem ipsum
  const firstText = await tabs.locator('wb-tab').first().innerText();
  expect(firstText.toLowerCase()).toContain('lorem');
});
