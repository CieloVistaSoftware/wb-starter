import { test, expect } from '@playwright/test';

test.describe('Card Schema-First Architecture', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the static test file
    await page.goto('/tests/views/card-schema-test.html');
    
    // Wait for WB to initialize
    await page.waitForFunction(() => (window as any).WB);
  });

  test('Enhancer: Preserves existing semantic structure', async ({ page }) => {
    const card = page.locator('#semantic-card');
    
    // Check that the original content is still there
    await expect(card.locator('h3')).toHaveText('Semantic Title');
    await expect(card.locator('main')).toHaveText('Semantic Body');
    await expect(card.locator('footer')).toHaveText('Semantic Footer');
  });

  test('Enhancer: Injects badge into existing header', async ({ page }) => {
    const card = page.locator('#semantic-card-badge');
    // The JS should have injected the badge into the header
    const badge = card.locator('.wb-card__badge');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('Verified');
    
    // And the title should still be there
    await expect(card.locator('h3')).toHaveText('Title');
  });

  test('Schema: Creates structure when missing', async ({ page }) => {
    const card = page.locator('#empty-card');
    
    // The schema-builder should have built the structure
    await expect(card.locator('h3')).toHaveText('Builder Title');
    await expect(card.locator('main')).toHaveText('Builder Body');
  });

});
