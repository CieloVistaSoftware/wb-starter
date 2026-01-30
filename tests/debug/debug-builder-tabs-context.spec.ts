import { test, expect } from '@playwright/test';

test('Drop-zone context menu inserts Tabs component into main section', async ({ page }) => {
  await page.goto('/builder.html');

  const mainDrop = page.locator('.canvas-drop-zone[section="main"]');
  await expect(mainDrop).toBeVisible();

  // Open semantic context menu on drop zone
  await mainDrop.click({ button: 'right' });

  const menu = page.locator('#semanticContextMenu');
  await expect(menu).toBeVisible();

  // Find the Tabs card and click it
  const tabsCard = menu.locator('.component-picker-card', { hasText: 'Tabs' }).first();
  await expect(tabsCard).toBeVisible();

  // Debug: capture console messages
  const messages = [] as string[];
  page.on('console', m => messages.push(m.text()));

  // Instrument addComponentToCanvas to record calls
  await page.evaluate(() => {
    (window as any).__lastAdd = null;
    const orig = (window as any).addComponentToCanvas;
    (window as any).addComponentToCanvas = function(type, section) {
      (window as any).__lastAdd = { type, section };
      if (orig) return orig(type, section);
    };
  });

  // Record current number of components, then click
  const beforeCount = await page.evaluate(() => document.querySelectorAll('.canvas-component').length);
  await tabsCard.click();

  // Wait briefly for call to addComponentToCanvas or a console message
  await page.waitForTimeout(250);
  const lastAdd = await page.evaluate(() => (window as any).__lastAdd);
  console.log('DEBUG: lastAdd=', lastAdd);
  console.log('DEBUG: console messages after click:', messages.slice(-20));

  if (!lastAdd) throw new Error('addComponentToCanvas was not called');

  // Wait for the DOM to update (if it happens)
  try {
    await page.waitForFunction((n) => document.querySelectorAll('.canvas-component').length > n, beforeCount, { timeout: 3000 });
  } catch (e) {
    // no DOM change observed yet - log current state
    const afterCount = await page.evaluate(() => document.querySelectorAll('.canvas-component').length);
    console.log('DEBUG: afterCount=', afterCount);
    const lastHtml = await page.evaluate(() => {
      const el = document.querySelector('.canvas-component:last-child');
      return el ? el.innerHTML.slice(0, 1000) : null;
    });
    console.log('DEBUG: last component innerHTML=', lastHtml);
  }

  // Expect wb-tabs in the last canvas component
  const tabs = page.locator('.canvas-component:last-child wb-tabs');
  await expect(tabs).toBeVisible();

  // Check for nav tabs and panels
  const navCount = await tabs.locator('.wb-tabs__tab').count();
  expect(navCount).toBeGreaterThanOrEqual(3);

  const firstPanelText = await tabs.locator('.wb-tabs__panel').first().innerText();
  expect(firstPanelText.toLowerCase()).toContain('lorem');
});