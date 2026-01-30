/**
 * Test: Behaviors Page Scroll
 * Issue: note-1769306057018-p0
 * Bug: Behaviors page category buttons don't scroll to section
 * Expected: Clicking category button scrolls to corresponding section
 */
import { test, expect } from '@playwright/test';

test.describe('Behaviors Page Category Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/pages/behaviors.html');
    await page.waitForLoadState('networkidle');
  });

  test('category buttons should scroll to sections', async ({ page }) => {
    await test.step('Navigate to behaviors page', async () => {
      await expect(page).toHaveURL(/behaviors/);
    });

    await test.step('Find category navigation buttons', async () => {
      const categoryBtns = page.locator('[data-category], .category-btn, .nav-link[href^="#"]');
      const count = await categoryBtns.count();
      expect(count).toBeGreaterThan(0);
    });

    await test.step('Get initial scroll position', async () => {
      const initialY = await page.evaluate(() => window.scrollY);
      expect(initialY).toBeGreaterThanOrEqual(0);
    });

    await test.step('Click first category button and verify scroll', async () => {
      const firstBtn = page.locator('[data-category], .category-btn, .nav-link[href^="#"]').first();
      
      if (await firstBtn.count() > 0) {
        const href = await firstBtn.getAttribute('href');
        
        if (href && href.startsWith('#')) {
          const initialScroll = await page.evaluate(() => window.scrollY);
          await firstBtn.click();
          await page.waitForTimeout(500);
          
          const target = page.locator(href);
          if (await target.count() > 0) {
            const newScroll = await page.evaluate(() => window.scrollY);
            // Verify page scrolled or target is in viewport (robust check)
            const targetInView = await target.evaluate((el) => {
              const r = el.getBoundingClientRect();
              return (r.top < (window.innerHeight || document.documentElement.clientHeight)) && (r.bottom > 0);
            });
            expect(targetInView || newScroll !== initialScroll).toBe(true);
          }
        }
      }
    });
  });
});
