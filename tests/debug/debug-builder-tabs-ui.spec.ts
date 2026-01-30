import { test, expect } from '@playwright/test';

test('UI: Adding Tabs via toolbar component picker inserts wb-tabs with 3 wb-tab children', async ({ page }) => {
  await page.goto('/builder.html');

  // Open component dropdown via toolbar
  const compBtn = page.locator('button.toolbar-btn', { hasText: '+ Component' }).first();
  await expect(compBtn).toBeVisible();
  await compBtn.click();

  // Dropdown should open
  const dropdown = page.locator('#dropdown-component');
  await expect(dropdown).toHaveClass(/open/);

  // Click the 'tabs' item
  const tabsItem = dropdown.locator('.dropdown-item-flat', { hasText: 'tabs' }).first();
  await expect(tabsItem).toBeVisible();
  await tabsItem.click();

  // Expect a wb-tabs element in the canvas
  const tabs = page.locator('.canvas-component wb-tabs').first();
  await expect(tabs).toBeVisible();

  // Debug: print innerHTML
  const inner = await page.evaluate(() => {
    const el = document.querySelector('.canvas-component wb-tabs');
    return el ? el.innerHTML : null;
  });
  console.log('DEBUG: wb-tabs innerHTML=', inner);

  // Tabs behavior transforms children into nav buttons and panels — assert on those
  const navCount = await tabs.locator('.wb-tabs__tab').count();
  expect(navCount).toBeGreaterThanOrEqual(3);

  const firstPanelText = await tabs.locator('.wb-tabs__panel').first().innerText();
  expect(firstPanelText.toLowerCase()).toContain('lorem');
});