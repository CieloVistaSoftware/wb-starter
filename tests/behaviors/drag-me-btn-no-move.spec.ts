import { test, expect } from '@playwright/test';

test('Drag Me Around button does not move on single click', async ({ page }) => {
  await page.goto('/?page=home');
  const dragBtn = await page.locator('#drag-me-btn');
  const initialBox = await dragBtn.boundingBox();
  // Move mouse to element center and perform down/up without moving to avoid
  // accidental synthetic moves from the test runner.
  await page.mouse.move(initialBox.x + initialBox.width / 2, initialBox.y + initialBox.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  const afterClickBox = await dragBtn.boundingBox();
  expect(afterClickBox.x).toBeCloseTo(initialBox.x, 1);
  expect(afterClickBox.y).toBeCloseTo(initialBox.y, 1);
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
  const dx = Math.abs(after.x - initial.x);
  const dy = Math.abs(after.y - initial.y);
  // Ensure something moved significantly in the direction the user dragged
  expect(dx > 40 || dy > 40).toBe(true);
});
