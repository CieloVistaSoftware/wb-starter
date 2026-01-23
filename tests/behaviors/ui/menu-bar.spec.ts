import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000/public/builder.html';

test.describe('<wb-menu-bar> Component', () => {
  test('should render menu bar and menu items', async ({ page }) => {
    await page.goto(BASE_URL);
    const menuBar = page.locator('wb-menu-bar');
    await expect(menuBar).toBeVisible();
    await expect(menuBar.locator('.menu-item')).toHaveCount(6); // 5 menus + spacer
  });

  test('should open and close dropdowns on click', async ({ page }) => {
    await page.goto(BASE_URL);
    const menuBar = page.locator('wb-menu-bar');
    const fileMenu = menuBar.locator('#menuFile');
    await fileMenu.click();
    await expect(fileMenu).toHaveClass(/open/);
    // Click outside to close
    await page.click('body');
    await expect(fileMenu).not.toHaveClass(/open/);
  });

  test('should load external HTML for menu bar', async ({ page }) => {
    await page.goto(BASE_URL);
    const menuBar = page.locator('wb-menu-bar');
    await expect(menuBar.locator('.menu-bar')).toBeVisible();
  });
});
