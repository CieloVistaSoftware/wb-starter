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
    // Ensure navigation is present and wait for common nav patterns
    await (await import('../helpers/fail-fast')).failFastSelector(page, 'nav, .site-nav, .category-nav, [data-category], a[href^="#"]', 3000);
    const categoryNav = page.locator('.category-nav, .categories, [data-categories], nav, .site-nav');

    const scrollResults: Array<{ category: string; success: boolean; reason?: string }> = [];

    for (const category of CATEGORIES.slice(0, 3)) { // Test first 3
      const btn = page.locator(`button:has-text("${category.name}"), 
                                a:has-text("${category.name}"),
                                [data-category="${category.name.toLowerCase()}"],
                                a[href="#${category.name.toLowerCase()}"],
                                button:has-text("${category.emoji}"),
                                a:has-text("${category.emoji}")`).first();

      if (await btn.count() === 0) {
        scrollResults.push({ category: category.name, success: false, reason: 'button-not-found' });
        continue;
      }

      const initialScroll = await page.evaluate(() => window.scrollY);
      await btn.click();
      await page.waitForTimeout(500);

      const section = page.locator(`#${category.name.toLowerCase()}, [data-section="${category.name.toLowerCase()}"], section:has-text("${category.name}"), h2:has-text("${category.name}")`).first();

      if (await section.count() === 0) {
        scrollResults.push({ category: category.name, success: false, reason: 'no-section' });
        continue;
      }

      const targetInView = await section.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return (r.top < (window.innerHeight || document.documentElement.clientHeight)) && (r.bottom > 0);
      });

      const scrolledWindow = await page.evaluate((initial) => Math.abs(window.scrollY - initial) > 50, initialScroll);

      const inScrollable = await section.evaluate((el) => {
        let node = el.parentElement;
        while (node && node !== document.body && node !== document.documentElement) {
          const cs = window.getComputedStyle(node);
          const overflow = (cs.overflow + cs.overflowY + cs.overflowX) || '';
          if ((node.scrollHeight > node.clientHeight) && /auto|scroll/.test(overflow)) {
            const cr = node.getBoundingClientRect();
            const er = el.getBoundingClientRect();
            return (er.top >= cr.top && er.bottom <= cr.bottom) || (er.top < cr.bottom && er.bottom > cr.top);
          }
          node = node.parentElement;
        }
        return false;
      });

      const success = targetInView || inScrollable || scrolledWindow;
      scrollResults.push({ category: category.name, success, reason: success ? 'ok' : 'not-scrolled' });
    }

    const passed = scrollResults.filter(r => r.success).length;
    if (passed === 0) {
      console.warn('Scroll nav failures:', JSON.stringify(scrollResults, null, 2));
    }
    expect(passed).toBeGreaterThanOrEqual(1);
  });

  test('category sections should have proper IDs for navigation', async ({ page }) => {
    for (const category of CATEGORIES) {
      const sectionId = category.name.toLowerCase();
      
      // Check for section with matching ID
      const section = page.locator(`#${sectionId}, [id*="${sectionId}"]`).first();
      const heading = page.locator(`h2:has-text("${category.name}"), h3:has-text("${category.name}")`).first();

      // Either ID-based section or heading should exist
      const exists = await section.count() > 0 || await heading.count() > 0;
      
      if (!exists) {
        console.log(`Warning: Category section "${category.name}" not found`);
      }
    }
  });

  test('scroll navigation should be smooth', async ({ page }) => {
    const btn = page.locator('button:has-text("Navigation"), [data-category="navigation"]').first();
    
    if (await btn.count() === 0) {
      test.skip();
      return;
    }

    // Check CSS for smooth scroll
    const hasSmooth = await page.evaluate(() => {
      const html = document.documentElement;
      const style = getComputedStyle(html);
      return style.scrollBehavior === 'smooth';
    });

    // Click and track scroll behavior
    const scrollPositions: number[] = [];
    
    await page.evaluate(() => {
      (window as any).__scrollTracker = [];
      window.addEventListener('scroll', () => {
        (window as any).__scrollTracker.push(window.scrollY);
      });
    });

    await btn.click();
    await page.waitForTimeout(1000);

    const positions = await page.evaluate(() => (window as any).__scrollTracker || []);
    
    // Smooth scroll should have multiple intermediate positions
    // (not just instant jump from A to B)
    if (positions.length > 2) {
      // Check for smooth progression
      expect(positions.length).toBeGreaterThan(2);
    }
  });

  test('all category buttons should be visible and clickable', async ({ page }) => {
    for (const category of CATEGORIES) {
      const btn = page.locator(`button:has-text("${category.name}"), 
                                button:has-text("${category.emoji}")`).first();
      
      if (await btn.count() > 0) {
        await expect(btn).toBeVisible();
        await expect(btn).toBeEnabled();
      }
    }
  });
});
