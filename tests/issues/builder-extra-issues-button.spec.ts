/**
 * Test: Builder Extra Issues Button
 * Issue: note-1769305932956-p0
 * Bug: builder.html has an issues button in bottom right corner - remove it
 * Expected: No floating issues button in bottom right of builder
 */
import { test, expect } from '@playwright/test';

test.describe('Builder Extra Issues Button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/builder.html');
    await page.waitForLoadState('networkidle');
  });

  test('should not have floating button in bottom right', async ({ page }) => {
    // Look for any fixed/absolute positioned element in bottom-right
    const floatingElements = await page.evaluate(() => {
      const found: Array<{tag: string, text: string, position: string}> = [];
      
      document.querySelectorAll('button, wb-issues, [data-action="issues"], .issues-btn').forEach(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        // Check if positioned in bottom-right quadrant
        if ((style.position === 'fixed' || style.position === 'absolute') &&
            rect.bottom > window.innerHeight - 200 &&
            rect.right > window.innerWidth - 200) {
          found.push({
            tag: el.tagName.toLowerCase(),
            text: (el.textContent || '').trim().substring(0, 50),
            position: `${Math.round(rect.right)}x${Math.round(rect.bottom)}`
          });
        }
      });
      
      return found;
    });
    
    // Should be no floating buttons in bottom right
    expect(floatingElements.length).toBe(0);
  });

  test('wb-issues should only exist in navbar', async ({ page }) => {
    const wbIssues = await page.locator('wb-issues').all();
    
    for (const el of wbIssues) {
      const box = await el.boundingBox();
      if (box) {
        // Should be in top navbar area (y < 100)
        expect(box.y).toBeLessThan(100);
      }
    }
  });
});
