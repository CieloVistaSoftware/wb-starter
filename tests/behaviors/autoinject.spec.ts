
import { test, expect } from '@playwright/test';

test.describe('Auto-Inject Demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/autoinject.html');
    // Wait for WB to initialize (autoInject happens during init/scan)
    await page.waitForFunction(() => typeof window['WB'] !== 'undefined');
    await page.waitForTimeout(1000); 
  });

  test('Page status indicates initialization', async ({ page }) => {
     const status = page.locator('#status');
     await expect(status).toHaveText(/WB Initialized/i);
  });

  test.describe('Form Elements', () => {
    test('Checkboxes are wrapped/enhanced', async ({ page }) => {
      const checkbox = page.locator('#autoinject-input-97');
      const parent = checkbox.locator('xpath=..');
      await expect(parent).toHaveClass(/wb-checkbox/);
      await expect(checkbox).toHaveClass(/wb-checkbox__input/);
      await expect(checkbox).toHaveClass(/wb-ready/);
    });

    test('Checkboxes have enhancements', async ({ page }) => {
        const wrapper = page.locator('.wb-checkbox').first();
        await expect(wrapper).toBeVisible();
        await expect(wrapper).toHaveClass(/wb-ready/);
    });

    test('Selects are enhanced', async ({ page }) => {
        const select = page.locator('#autoinject-select-147');
        await expect(select).toHaveClass(/wb-select/);
        await expect(select).toHaveClass(/wb-ready/);
    });
    
    test('Cards are enhanced', async ({ page }) => {
         const article = page.locator('#autoinject-article-345');
         await expect(article).toHaveClass(/wb-card/);
         await expect(article).toHaveClass(/wb-ready/);
    });
  });
});
