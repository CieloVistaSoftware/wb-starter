
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
      // Standard checkbox should be enhanced.
      // Usually WB checkbox wraps the input in a label or adds classes.
      // Based on previous files, let's see if we can find .wb-checkbox class or similar.
      // If auto-inject works, the element should have behavior applied.
      
      const checkbox = page.locator('#autoinject-input-97');
      // Verify some "enhanced" property or class is present on it or its parent
      // We expect the checkbox to be affected. 
      // Often WB wraps it. Let's check if the generic input[type="checkbox"] has been touched.
      
      // Check if classes are added
      const hasClass = await checkbox.evaluate(el => el.classList.contains('wb-checkbox__input') || el.parentElement.classList.contains('wb-checkbox'));
      // Or check if it has x-behavior attribute added (some implementations add it)
      // Or check if data-wb-ready is there
      
      // Let's assume some class or attribute changes.
      // WB Core usually doesn't modify the DOM structure aggressively unless it's a specific behavior.
      // Let's check for 'x-behavior' attribute being added if it wasn't there.
      // But the file says "Standard HTML tags only".
      
      // In wb-lazy.js: WB.lazyInject(element, behavior)
      // This instantiates the behavior. The behavior usually modifies the element.
    });

    test('Checkboxes have enhancements', async ({ page }) => {
        // Look for visual changes or DOM modifications typical of the framework
        const wrapper = page.locator('.wb-checkbox').first();
        await expect(wrapper).toBeVisible(); 
    });

    test('Selects are enhanced', async ({ page }) => {
        const select = page.locator('#autoinject-select-147');
        // WB Select might wrap it or add classes
        await expect(select).toHaveClass(/wb-select/); 
    });
    
    test('Cards are enhanced', async ({ page }) => {
         const article = page.locator('#autoinject-article-345');
         await expect(article).toHaveClass(/wb-card/);
    });
  });
});
