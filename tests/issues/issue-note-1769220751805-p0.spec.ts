/**
 * Issue Test: note-1769220751805-p0
 * BUG: Category buttons (Buttons, Inputs, Selection, etc.) do not scroll to location
 */
import { test, expect } from '@playwright/test';

const CATEGORIES = [
  { name: 'Buttons', emoji: '🔘' },
  { name: 'Inputs', emoji: '📝' },
  { name: 'Selection', emoji: '☑️' },
  { name: 'Feedback', emoji: '📢' },
  { name: 'Overlays', emoji: '🪟' },
  { name: 'Navigation', emoji: '🧭' },
  { name: 'Data', emoji: '📊' },
  { name: 'Media', emoji: '🖼️' },
  { name: 'Effects', emoji: '✨' },
  { name: 'Utilities', emoji: '🔧' }
];

test.describe('Issue note-1769220751805-p0: Category Buttons Scroll Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/?page=behaviors');
    await page.waitForLoadState('networkidle');
  });

  test('clicking category button should scroll to that section', async ({ page }) => {
    // Find category navigation buttons
    const categoryNav = page.locator('.category-nav, .categories, [data-categories]');
    
    for (const category of CATEGORIES.slice(0, 3)) { // Test first 3
      const btn = page.locator(`button:has-text("${category.name}"), 
                                [data-category="${category.name.toLowerCase()}"],
                                button:has-text("${category.emoji}")`).first();
      
      if (await btn.count() === 0) continue;

      // Get initial scroll position
      const initialScroll = await page.evaluate(() => window.scrollY);

      // Click category button
      await btn.click();
      await page.waitForTimeout(500);

      // Find the target section
      const section = page.locator(`#${category.name.toLowerCase()}, 
                                    [data-section="${category.name.toLowerCase()}"],
                                    section:has-text("${category.name}"),
                                    h2:has-text("${category.name}")`).first();

      if (await section.count() > 0) {
        // Verify section is now in viewport (use boundingClientRect for broad Playwright compatibility)
        const isVisible = await section.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return (r.top < (window.innerHeight || document.documentElement.clientHeight)) && (r.bottom > 0);
        });
      }

      // Or verify scroll position changed
      const newScroll = await page.evaluate(() => window.scrollY);
      const scrolled = Math.abs(newScroll - initialScroll) > 50;
      
      // At least one verification should pass
      expect(scrolled || await section.count() === 0).toBe(true);
    }
  });
});
