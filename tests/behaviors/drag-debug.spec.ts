import { test, expect } from '@playwright/test';

test('drag debug capture', async ({ page }) => {
  await page.goto('/?page=home');
  const el = page.locator('#drag-me-btn');
  // Ensure WB is available and force-inject the draggable behavior for deterministic tests
  await page.waitForFunction(() => !!window.WB && !!window.WB.inject, null, { timeout: 5000 });
  await page.evaluate(async () => {
    // Force inject the behavior to guarantee listeners are attached during the test
    await window.WB.inject('#drag-me-btn', 'draggable');
  });

  // Verify the behavior API exists on the element
  const hasApi = await page.evaluate(() => !!document.querySelector('#drag-me-btn')?.wbDraggable);
  const hasError = await page.evaluate(() => document.querySelector('#drag-me-btn')?.dataset?.wbError || null);
  console.log('HAS-WB-DRAGGABLE:', hasApi, 'WB-ERROR:', hasError);
  // If the behavior didn't attach, surface the error data attribute for debugging
  if (!hasApi) {
    console.warn('Draggable behavior did not attach; wbError=', hasError);
  }

  const initial = await el.boundingBox();
  await page.mouse.move(initial.x + initial.width / 2, initial.y + initial.height / 2);
  await page.mouse.down();
  // Move mostly vertically
  await page.mouse.move(initial.x + initial.width / 2 + 4, initial.y + initial.height / 2 + 100, { steps: 12 });
  await page.mouse.up();

  // Small delay to ensure attribute is set
  await page.waitForTimeout(50);
  const attr = await el.getAttribute('data-wb-last-drag');
  // Print value so it appears in test output and context
  console.log('WB-LAST-DRAG:', attr);
  expect(attr).not.toBeNull();
  const parsed = JSON.parse(attr!);
  console.log('WB-LAST-DRAG-PARSED:', parsed);
  expect(parsed).toHaveProperty('deltaY');
});