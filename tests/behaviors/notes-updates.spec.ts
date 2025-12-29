import { test, expect } from '@playwright/test';

test.describe('Notes Behavior Updates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/components.html');
  });

  test('Notes should show current URL on open', async ({ page }) => {
    // Open notes
    await page.click('button[data-wb="sheet"][data-title="My Notes"]');
    
    // Check textarea content
    const textarea = page.locator('.wb-notes__textarea');
    await expect(textarea).toBeVisible();
    
    const value = await textarea.inputValue();
    const currentUrl = page.url();
    expect(value).toContain(currentUrl);
  });

  test('Saving a note should show "Note added" and View button should work', async ({ page }) => {
    // Open notes
    await page.click('button[data-wb="sheet"][data-title="My Notes"]');
    
    // Add some text
    const textarea = page.locator('.wb-notes__textarea');
    await textarea.fill('Test note content');
    
    // Click save
    await page.click('button[data-action="save"]');
    
    // Check status message
    const status = page.locator('.wb-notes__status');
    await expect(status).toHaveText('Note added');
    
    // Click view button
    await page.click('button[data-action="view"]');
    
    // Check viewer
    const viewer = page.locator('h3:has-text("Saved Notes")');
    await expect(viewer).toBeVisible();
    
    const pre = page.locator('pre');
    await expect(pre).toContainText('Test note content');
  });
});
