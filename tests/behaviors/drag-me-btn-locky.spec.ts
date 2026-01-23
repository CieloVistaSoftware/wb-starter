import { test, expect } from '@playwright/test';

// Verify element doesn't move on single click (existing test covers this)
// New test: when axis is locked to X, Y should not change during a horizontal drag

test('Drag Me Around respects X-axis lock (Y does not change) during drag', async ({ page }) => {
  await page.goto('/?page=home');
  const el = page.locator('#drag-me-btn');
  const initial = await el.boundingBox();
  // start drag: mousedown at center
  await page.mouse.move(initial.x + initial.width / 2, initial.y + initial.height / 2);
  await page.mouse.down();
  // move horizontally and slightly vertically; Y should remain the same because axis="x"
  await page.mouse.move(initial.x + initial.width / 2 + 80, initial.y + initial.height / 2 + 12, { steps: 10 });
  await page.mouse.up();

  const after = await el.boundingBox();
  // X should have changed by ~80, Y should be approximately equal to initial Y
  expect(after.x).toBeGreaterThan(initial.x + 40);
  expect(after.y).toBeCloseTo(initial.y, 1);
});

test('If user drags primarily vertically, Y movement is allowed even with axis="x"', async ({ page }) => {
  await page.goto('/?page=home');
  const el = page.locator('#drag-me-btn');
  const initial = await el.boundingBox();
  await page.mouse.move(initial.x + initial.width / 2, initial.y + initial.height / 2);
  await page.mouse.down();
  // Move mostly vertically
  await page.mouse.move(initial.x + initial.width / 2 + 4, initial.y + initial.height / 2 + 100, { steps: 12 });
  await page.mouse.up();

  const after = await el.boundingBox();
  expect(after.y).toBeGreaterThan(initial.y + 40);
});