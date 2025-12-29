import { test, expect } from '@playwright/test';

test.describe('Clickable Card Fix', () => {
  test('Clickable card in components page should trigger toast', async ({ page }) => {
    // Navigate to components page
    await page.goto('/pages/components.html');

    // Find the clickable card
    const card = page.locator('#components-div-12');
    await expect(card).toBeVisible();
    
    // Verify it has the correct data attributes
    await expect(card).toHaveAttribute('data-wb', /toast/);
    await expect(card).toHaveAttribute('data-message', 'Card clicked!');
    await expect(card).toHaveAttribute('data-type', 'success');

    // Click the card
    await card.click();

    // Check for toast notification
    // The toast is created in a container .wb-toast-container
    const toast = page.locator('.wb-toast-container div');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Card clicked!');
  });
});
