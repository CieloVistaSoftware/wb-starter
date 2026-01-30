import { test, expect } from '@playwright/test';

test('Component context menu Inspect sets window.$i and logs Inspect message', async ({ page }) => {
  await page.goto('/builder.html');

  const comp = page.locator('.canvas-component').first();
  await expect(comp).toBeVisible();

  // Capture console messages for later assertion
  const messages: string[] = [];
  page.on('console', (m) => messages.push(m.text()));

  // Right-click the component to open context menu
  await comp.click({ button: 'right' });

  const menu = page.locator('#builderContextMenu');
  await expect(menu).toBeVisible();

  // Click Inspect
  await menu.locator('#ctx-inspect').click();

  // Wait for inspect event to be emitted / lastInspect to be set
  await page.waitForFunction(() => !!(window as any).__lastInspect);

  const last = await page.evaluate(() => (window as any).__lastInspect);
  expect(last).toBeTruthy();

  const idOrTag = await page.evaluate(() => {
    const el = (window as any).$i as HTMLElement | undefined;
    if (!el) return null;
    return el.id || el.tagName || el.outerHTML?.slice(0, 200);
  });

  expect(idOrTag).toBeTruthy();

  // Ensure an Inspect-related console message was logged
  const hasInspectMsg = messages.some(m => m.includes('[Inspect]'));
  expect(hasInspectMsg).toBeTruthy();
});
