import { test, expect } from '@playwright/test';

test.describe('Button Toast Notifications', () => {
  test.beforeEach(async ({ page }) => {
    // use dev server route so moved page folders are resolved by the server
    await page.goto('/pages/components.html');
  });

  test('Modal button should trigger toast', async ({ page }) => {
    const button = page.locator('button:has-text("Open Modal")');
    await button.click();
    
    const toast = page.locator('.wb-toast-container div').last();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('From: Open Modal Button -> To: Modal Dialog');
    
    // Close modal to clean up
    await page.keyboard.press('Escape');
  });

  test('Drawer button should trigger toast', async ({ page }) => {
    const button = page.locator('button:has-text("Left")').first();
    await button.click();
    
    const toast = page.locator('.wb-toast-container div').last();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('From: Left Drawer Button -> To: Left Drawer');
    
    // Close drawer
    await page.locator('.wb-drawer button').click();
  });

  test('Reanimate button should trigger toast', async ({ page }) => {
    const button = page.locator('button:has-text("Reanimate All Slowly")');
    await button.click();
    
    const toast = page.locator('.wb-toast-container div').last();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('From: Reanimate Button -> To: Progress Bars');
  });

  test('Toast trigger button should show updated message', async ({ page }) => {
    const button = page.locator('button:has-text("Info Toast")');
    await button.click();
    
    const toast = page.locator('.wb-toast-container div').last();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('From: Info Toast Button -> To: Info Toast');
  });
});
