import { test, expect } from '@playwright/test';

test.describe('Semantic Context Menu', () => {
  test('is expandable, draggable, and shows 3-column grid when expanded', async ({ page }) => {
    await page.goto('/builder.html');

    const mainDrop = page.locator('.canvas-drop-zone[section="main"]');
    await expect(mainDrop).toBeVisible();

    // Open context menu on drop zone
    await mainDrop.click({ button: 'right' });

    const menu = page.locator('#semanticContextMenu');
    await expect(menu).toBeVisible();

    const toggle = menu.locator('.semantic-toggle-btn');
    await expect(toggle).toBeVisible();

    // Expand to grid view
    await toggle.click();

    // Expect at least one card in expanded view
    const card = menu.locator('.semantic-item-card').first();
    await expect(card).toBeVisible();

    // Check that the content has a 3-column grid (computed style)
    const cols = await page.evaluate(() => {
      const el = document.querySelector('#semanticContextMenu .semantic-content');
      if (!el) return null;
      return getComputedStyle(el).gridTemplateColumns;
    });
    expect(cols).toBeTruthy();
    // crude check: should contain 3 columns when expanded (repeat(3... or three values)
    expect(cols.includes('repeat(3') || cols.split(' ').length >= 3).toBeTruthy();

    // Drag the menu by its header and ensure position changes
    const header = menu.locator('.semantic-header');
    const menuBoxBefore = await menu.boundingBox();
    const headerBox = await header.boundingBox();
    test.expect(menuBoxBefore).not.toBeNull();
    test.expect(headerBox).not.toBeNull();

    const startX = headerBox!.x + headerBox!.width / 2;
    const startY = headerBox!.y + headerBox!.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 80, startY + 30);
    await page.mouse.up();

    const menuBoxAfter = await menu.boundingBox();

    // Position should have changed by at least a few pixels
    expect(menuBoxAfter).not.toBeNull();
    expect(Math.abs((menuBoxAfter!.x || 0) - (menuBoxBefore!.x || 0)) > 5).toBeTruthy();
  });
});
