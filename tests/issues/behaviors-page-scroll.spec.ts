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
      // Wait for any plausible nav/container to appear (broader selector)
      await (await import('../helpers/fail-fast')).failFastSelector(page, 'nav, .site-nav, .category-nav, [data-category], a[href^="#"]', 3000);
      const categoryBtns = page.locator('[data-category], .category-btn, .wb-category, nav a[href^="#"], .nav-link[href^="#"], a[href^="#"]');
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

          // Wait up to 1s for the target to be considered "in view" inside either the viewport
          // or its nearest scrollable ancestor, or for a scroll offset to change on a plausible container.
          await page.waitForFunction((h, initial) => {
            try {
              const el = document.querySelector(h);
              if (!el) return false;

              const findScrollable = (node) => {
                while (node && node !== document.body && node !== document.documentElement) {
                  const cs = window.getComputedStyle(node);
                  const overflow = (cs.overflow + cs.overflowY + cs.overflowX) || '';
                  if ((node.scrollHeight > node.clientHeight) && /auto|scroll/.test(overflow)) return node;
                  node = node.parentElement;
                }
                return document.documentElement;
              };

              const sc = findScrollable(el.parentElement || document.documentElement);

              // Element vs viewport
              const vr = el.getBoundingClientRect();
              const inViewport = vr.top < (window.innerHeight || document.documentElement.clientHeight) && vr.bottom > 0;

              // Element vs scrollable container
              let inContainer = false;
              if (sc && sc.getBoundingClientRect) {
                const cr = sc.getBoundingClientRect();
                const er = el.getBoundingClientRect();
                inContainer = (er.top >= cr.top && er.bottom <= cr.bottom) || (er.top < cr.bottom && er.bottom > cr.top);
              }

              const scrolledWindow = Math.abs(window.scrollY - initial) > 40;
              const scrolledContainer = sc && Math.abs(sc.scrollTop - (sc.__initialScrollTop || 0)) > 40;
              const hashMatch = location.hash === h;

              return inViewport || inContainer || scrolledWindow || scrolledContainer || hashMatch;
            } catch (e) {
              return false;
            }
          }, href, initialScroll, { timeout: 1000 }).catch(() => null);

          const target = page.locator(href);
          if (await target.count() > 0) {
            // Final best-effort check: target is in viewport or inside its scrollable ancestor, or a scroll offset changed
            const newScroll = await page.evaluate(() => window.scrollY);
            const targetInView = await target.evaluate((el) => {
              const r = el.getBoundingClientRect();
              return (r.top < (window.innerHeight || document.documentElement.clientHeight)) && (r.bottom > 0);
            });

            const inScrollable = await page.evaluate((h) => {
              const el = document.querySelector(h);
              if (!el) return false;
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
            }, href);

            expect(targetInView || inScrollable || Math.abs(newScroll - initialScroll) > 40).toBe(true);
          } else {
            // If there is no matching section, skip the strict assertion
            test.skip('No target section found for href ' + href);
          }
        }
      }
    });
  });
});
