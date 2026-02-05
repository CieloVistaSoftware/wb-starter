import { test, expect } from '@playwright/test';

/**
 * Tests to catch duplicate button rendering issues
 */
test.describe('No Duplicate Buttons', () => {
  
  test('Home page should not have duplicate buttons', async ({ page }) => {
    await page.goto('/?page=home', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000); // Wait for behaviors to initialize
    
    // Check CTA section has exactly 2 buttons (Get Started + View on GitHub)
    const ctaButtons = page.locator('.cta-actions > *');
    const ctaCount = await ctaButtons.count();
    expect(ctaCount).toBe(2);
    
    // Check preview row has expected number of buttons (3 in first row)
    const previewRow1Buttons = page.locator('#home-preview-row-1 wb-button');
    const row1Count = await previewRow1Buttons.count();
    expect(row1Count).toBe(3);
    
    // Check hero section - cardhero should have exactly 2 CTA links
    const heroCtaGroup = page.locator('wb-cardhero .wb-card__cta-group > *');
    const heroCtaCount = await heroCtaGroup.count();
    expect(heroCtaCount).toBe(2);
  });

  test('Behaviors page should not have duplicate buttons', async ({ page }) => {
    await page.goto('/?page=behaviors', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Check button variants demo row
    const buttonVariantsRow = page.locator('#buttons .demo-row').first();
    const variantButtons = buttonVariantsRow.locator('wb-button');
    const variantCount = await variantButtons.count();
    // Should be 4: Primary, Secondary, Ghost, Disabled
    expect(variantCount).toBe(4);
    
    // Check button sizes demo row
    const buttonSizesRow = page.locator('#buttons .demo-row').nth(1);
    const sizeButtons = buttonSizesRow.locator('wb-button');
    const sizeCount = await sizeButtons.count();
    // Should be 3: Small, Medium, Large
    expect(sizeCount).toBe(3);
  });

  test('No visible double-rendered content', async ({ page }) => {
    await page.goto('/?page=home', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Check for common symptoms of double rendering
    // 1. Multiple stat banners
    const statBanners = page.locator('.stats-banner');
    await expect(statBanners).toHaveCount(1);
    
    // 2. Multiple feature grids
    const featureGrids = page.locator('.features-grid');
    await expect(featureGrids).toHaveCount(1);
    
    // 3. Multiple CTA sections
    const ctaSections = page.locator('.cta-section');
    await expect(ctaSections).toHaveCount(1);
    
    // 4. Multiple hero sections
    const heroSections = page.locator('wb-cardhero');
    await expect(heroSections).toHaveCount(1);
  });
});
