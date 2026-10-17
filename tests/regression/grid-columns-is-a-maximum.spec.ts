import { test, expect } from '../fixtures/offline';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * x-grid's `columns` is a maximum (#1930).
 *
 * John, 2026-10-16, in the Playground with columns=2 and four rows: "this is
 * not 2 columns it's three before the next row". columns="1" showed 4. The
 * template was repeat(auto-fit, minmax(<floor>, 1fr)) -- as many columns as
 * fit at the floor width, uncapped. Now each column is at least 1/N of the
 * width, so a wide container shows exactly N and a narrow one fewer.
 */
const columnsOf = (page) => page.locator('#test-container [x-grid]').evaluate((g) =>
  new Set([...g.children].map((c) => Math.round(c.getBoundingClientRect().x))).size);

test.beforeEach(async ({ page }) => {
  await setupBehaviorTest(page);
});

for (const n of [1, 2, 3, 4]) {
  test(`columns="${n}" shows ${n} columns when there is room, never more`, async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    const items = Array.from({ length: 8 }, (_, i) => `<div>Item ${i + 1}</div>`).join('');
    await setupTestContainer(page, `<div x-grid columns="${n}" altRows>${items}</div>`);
    await expect(page.locator('#test-container [x-grid]')).toHaveClass(/x-grid/);
    expect(await columnsOf(page)).toBe(n);
  });
}

test('a narrow screen still drops to fewer columns', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  const items = Array.from({ length: 8 }, (_, i) => `<div>Item ${i + 1}</div>`).join('');
  await setupTestContainer(page, `<div x-grid columns="4">${items}</div>`);
  await expect(page.locator('#test-container [x-grid]')).toHaveClass(/x-grid/);
  const cols = await columnsOf(page);
  expect(cols).toBeGreaterThanOrEqual(1);
  expect(cols).toBeLessThan(4);
});
