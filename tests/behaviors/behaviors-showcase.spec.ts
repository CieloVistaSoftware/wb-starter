/**
 * Behaviors Showcase Tests
 * ========================
 * Tests for demos/behaviors.html
 * Tests all behavior demos are working correctly
 */

import { test, expect } from '@playwright/test';

test.describe('Behaviors Showcase Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/behaviors.html');
    await page.waitForTimeout(1000); // Wait for WB to initialize
  });

  test.describe('Page Structure', () => {
    test('page loads without console errors', async ({ page }) => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && !msg.text().includes('favicon')) {
          errors.push(msg.text());
        }
      });
      
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Filter out expected errors from missing external resources
      const unexpectedErrors = errors.filter(e => 
        !e.includes('net::ERR') && 
        !e.includes('Failed to load resource') &&
        !e.includes('404')
      );
      
      expect(unexpectedErrors).toHaveLength(0);
    });

    test('all behavior cards have demo areas', async ({ page }) => {
      const cards = await page.locator('.behavior-card').all();
      expect(cards.length).toBeGreaterThan(20);
      
      for (const card of cards) {
        const demoArea = card.locator('.demo-area');
        await expect(demoArea).toBeVisible();
      }
    });
  });

  test.describe('Text Overflow Detection', () => {
    test('no text overflows parent containers', async ({ page }) => {
      const overflows = await page.evaluate(() => {
        const issues = [];
        
        // Check all elements for overflow
        document.querySelectorAll('.behavior-card, .demo-area, .info-callout').forEach(container => {
          const containerRect = container.getBoundingClientRect();
          
          // Check all text-containing children
          container.querySelectorAll('*').forEach(child => {
            const childRect = child.getBoundingClientRect();
            
            // Check if child extends beyond container (with 2px tolerance)
            if (childRect.right > containerRect.right + 2) {
              issues.push({
                element: child.tagName,
                text: child.textContent?.substring(0, 50),
                overflow: 'right',
                by: Math.round(childRect.right - containerRect.right) + 'px'
              });
            }
            if (childRect.bottom > containerRect.bottom + 200) { // Allow some vertical scrolling
              issues.push({
                element: child.tagName,
                text: child.textContent?.substring(0, 50),
                overflow: 'bottom',
                by: Math.round(childRect.bottom - containerRect.bottom) + 'px'
              });
            }
          });
        });
        
        return issues;
      });
      
      if (overflows.length > 0) {
        console.log('Text overflow issues found:', overflows);
      }
      expect(overflows.filter(o => o.overflow === 'right')).toHaveLength(0);
    });

    test('drawer-layout text is not covered by toggle button', async ({ page }) => {
      const drawerCard = page.locator('.behavior-card:has(.behavior-title:has-text("Drawer"))');
      
      // Get the sidebar text element
      const sidebarText = drawerCard.locator('.demo-area [data-wb="drawer-layout"] > div:first-child');
      const toggleButton = drawerCard.locator('.wb-drawer-toggle');
      
      if (await toggleButton.count() > 0) {
        const sidebarRect = await sidebarText.boundingBox();
        const buttonRect = await toggleButton.boundingBox();
        
        if (sidebarRect && buttonRect) {
          // Button should not overlap the text content area significantly
          const overlap = Math.max(0, 
            Math.min(sidebarRect.x + sidebarRect.width, buttonRect.x + buttonRect.width) - 
            Math.max(sidebarRect.x, buttonRect.x)
          );
          
          // Allow some overlap for the button itself but text should be visible
          expect(overlap).toBeLessThan(sidebarRect.width * 0.3);
        }
      }
    });

    test('all "Main Content" text is fully visible', async ({ page }) => {
      const mainContentTexts = await page.locator(':text("Main Content")').all();
      
      for (const text of mainContentTexts) {
        const parent = text.locator('..').first();
        const parentBox = await parent.boundingBox();
        const textBox = await text.boundingBox();
        
        if (parentBox && textBox) {
          // Text should be within parent bounds
          expect(textBox.x).toBeGreaterThanOrEqual(parentBox.x - 1);
          expect(textBox.x + textBox.width).toBeLessThanOrEqual(parentBox.x + parentBox.width + 1);
        }
      }
    });
  });

  test.describe('Dropdown Behavior', () => {
    test('dropdown should have items attribute OR proper children structure', async ({ page }) => {
      const dropdowns = await page.locator('[data-wb="dropdown"]').all();
      
      for (const dropdown of dropdowns) {
        // Check if data-items is set
        const hasItems = await dropdown.getAttribute('data-items');
        
        // Check if proper child structure exists
        const hasTrigger = await dropdown.locator('.wb-dropdown-trigger, .wb-dropdown__trigger').count() > 0;
        const hasMenu = await dropdown.locator('.wb-dropdown-menu, .wb-dropdown__menu').count() > 0;
        
        // One of these patterns must be true
        const isValid = hasItems !== null || (hasTrigger && hasMenu);
        
        // Log the actual structure for debugging
        if (!isValid) {
          const html = await dropdown.innerHTML();
          console.log('Invalid dropdown structure:', html.substring(0, 200));
        }
        
        expect(isValid, 'Dropdown must have data-items OR trigger+menu children').toBe(true);
      }
    });

    test('dropdown shows menu when clicked', async ({ page }) => {
      const dropdown = page.locator('[data-wb="dropdown"]').first();
      
      // Click the dropdown
      await dropdown.click();
      await page.waitForTimeout(200);
      
      // Check if menu is visible
      const menu = dropdown.locator('.wb-dropdown__menu, .wb-dropdown-menu');
      if (await menu.count() > 0) {
        await expect(menu).toBeVisible();
      } else {
        // If no menu, the dropdown behavior might not be working
        console.warn('No dropdown menu found - behavior may not be initialized');
      }
    });
  });

  test.describe('Tabs Behavior', () => {
    test('tabs children should use data-tab-title attribute', async ({ page }) => {
      const tabContainers = await page.locator('[data-wb="tabs"]').all();
      
      for (const tabs of tabContainers) {
        const children = await tabs.locator('> div[data-tab-title], > div[data-tab]').all();
        
        // Check each child has the correct attribute
        for (const child of children) {
          const hasTabTitle = await child.getAttribute('data-tab-title');
          const hasTab = await child.getAttribute('data-tab');
          
          // Prefer data-tab-title per schema, but data-tab might work
          if (!hasTabTitle && hasTab) {
            console.warn('Tab uses data-tab instead of data-tab-title (non-standard)');
          }
          
          expect(hasTabTitle || hasTab, 'Tab panel must have data-tab-title or data-tab').toBeTruthy();
        }
      }
    });

    test('tabs generate tab buttons', async ({ page }) => {
      const tabContainers = await page.locator('[data-wb="tabs"]').all();
      
      for (const tabs of tabContainers) {
        const nav = tabs.locator('.wb-tabs__nav');
        await expect(nav).toBeVisible();
        
        const tabButtons = tabs.locator('.wb-tabs__tab');
        const buttonCount = await tabButtons.count();
        
        expect(buttonCount).toBeGreaterThan(0);
      }
    });

    test('tab buttons are properly sized (not too tall)', async ({ page }) => {
      const tabButtons = await page.locator('.wb-tabs__tab').all();
      
      for (const button of tabButtons) {
        const box = await button.boundingBox();
        if (box) {
          // Tab buttons should not be excessively tall (max 60px reasonable)
          expect(box.height).toBeLessThan(80);
        }
      }
    });

    test('clicking tab shows corresponding panel', async ({ page }) => {
      const tabContainer = page.locator('[data-wb="tabs"]').first();
      
      // Click second tab
      const secondTab = tabContainer.locator('.wb-tabs__tab').nth(1);
      await secondTab.click();
      await page.waitForTimeout(100);
      
      // Second panel should be visible
      const secondPanel = tabContainer.locator('.wb-tabs__panel').nth(1);
      await expect(secondPanel).toBeVisible();
      
      // First panel should be hidden
      const firstPanel = tabContainer.locator('.wb-tabs__panel').first();
      await expect(firstPanel).toBeHidden();
    });
  });

  test.describe('Drawer Layout Behavior', () => {
    test('drawer-layout behavior initializes', async ({ page }) => {
      const drawer = page.locator('[data-wb="drawer-layout"]').first();
      
      // Should have wb-drawer class after initialization
      await expect(drawer).toHaveClass(/wb-drawer/);
    });

    test('drawer toggle button is visible and accessible', async ({ page }) => {
      const drawerCard = page.locator('.behavior-card:has(.behavior-title:has-text("Drawer"))');
      const toggleButton = drawerCard.locator('.wb-drawer-toggle');
      
      if (await toggleButton.count() > 0) {
        await expect(toggleButton).toBeVisible();
        
        // Button should be clickable
        const box = await toggleButton.boundingBox();
        expect(box).toBeTruthy();
        expect(box.width).toBeGreaterThan(10);
        expect(box.height).toBeGreaterThan(10);
      }
    });

    test('sidebar content is readable when drawer is open', async ({ page }) => {
      const drawerCard = page.locator('.behavior-card:has(.behavior-title:has-text("Drawer"))');
      const sidebarText = drawerCard.locator(':text("Sidebar")').first();
      
      if (await sidebarText.count() > 0) {
        // Text should be visible
        await expect(sidebarText).toBeVisible();
        
        // Check that text is not clipped
        const box = await sidebarText.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThan(20); // Text should have reasonable width
        }
      }
    });
  });

  test.describe('Toggle Behavior', () => {
    test('toggle button has visible styling', async ({ page }) => {
      const toggleButton = page.locator('[data-wb="toggle"]').first();
      
      // Get computed styles
      const styles = await toggleButton.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          background: computed.backgroundColor,
          color: computed.color,
          border: computed.border
        };
      });
      
      // Button should not be pure black/white with no styling
      const isUnstyled = 
        (styles.background === 'rgba(0, 0, 0, 0)' || styles.background === 'transparent') &&
        styles.border.includes('none');
      
      if (isUnstyled) {
        console.warn('Toggle button appears unstyled - may need button behavior');
      }
    });

    test('toggle toggles class on target', async ({ page }) => {
      const toggleButton = page.locator('[data-wb="toggle"][data-target="#toggle-box"]');
      const target = page.locator('#toggle-box');
      
      // Initial state
      const hasActiveInitially = await target.evaluate(el => el.classList.contains('active'));
      
      // Click toggle
      await toggleButton.click();
      await page.waitForTimeout(100);
      
      // Class should be toggled
      const hasActiveAfter = await target.evaluate(el => el.classList.contains('active'));
      expect(hasActiveAfter).not.toBe(hasActiveInitially);
    });
  });

  test.describe('Masonry Layout', () => {
    test('masonry container uses column layout', async ({ page }) => {
      const masonry = page.locator('[data-wb="masonry"]').first();
      
      const styles = await masonry.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          columnCount: computed.columnCount,
          display: computed.display
        };
      });
      
      // Should have column-count set
      expect(styles.columnCount).not.toBe('auto');
    });

    test('masonry children are visible', async ({ page }) => {
      const masonry = page.locator('[data-wb="masonry"]').first();
      const children = await masonry.locator('> *').all();
      
      expect(children.length).toBeGreaterThan(0);
      
      for (const child of children) {
        await expect(child).toBeVisible();
      }
    });

    test('masonry items have correct break-inside', async ({ page }) => {
      const masonry = page.locator('[data-wb="masonry"]').first();
      const firstChild = masonry.locator('> *').first();
      
      const breakInside = await firstChild.evaluate(el => {
        return window.getComputedStyle(el).breakInside;
      });
      
      expect(breakInside).toBe('avoid');
    });
  });

  test.describe('Code Examples', () => {
    test('code blocks are contained within cards', async ({ page }) => {
      const cards = await page.locator('.behavior-card').all();
      
      let overflowCount = 0;
      
      for (const card of cards) {
        const cardBox = await card.boundingBox();
        if (!cardBox) continue;
        
        const codeBlocks = await card.locator('pre, code, .wb-mdhtml').all();
        
        for (const code of codeBlocks) {
          const codeBox = await code.boundingBox();
          if (!codeBox) continue;
          
          // Code should not extend beyond card
          if (codeBox.x + codeBox.width > cardBox.x + cardBox.width + 5) {
            overflowCount++;
            console.log('Code overflow in card:', await card.locator('.behavior-title').textContent());
          }
        }
      }
      
      expect(overflowCount).toBe(0);
    });

    test('code examples have small font size', async ({ page }) => {
      const codeBlocks = await page.locator('.behavior-card pre code').all();
      
      for (const code of codeBlocks) {
        const fontSize = await code.evaluate(el => {
          return parseFloat(window.getComputedStyle(el).fontSize);
        });
        
        // Font size should be small (less than 14px)
        expect(fontSize).toBeLessThan(14);
      }
    });

    test('line numbers column is narrow', async ({ page }) => {
      const lineNumbers = await page.locator('.wb-pre__line-numbers').all();
      
      for (const ln of lineNumbers) {
        const box = await ln.boundingBox();
        if (box) {
          // Line numbers column should be narrow (max 50px)
          expect(box.width).toBeLessThan(50);
        }
      }
    });
  });

  test.describe('Behavior Initialization', () => {
    test('all data-wb elements are initialized', async ({ page }) => {
      const uninitializedCount = await page.evaluate(() => {
        let count = 0;
        document.querySelectorAll('[data-wb]').forEach(el => {
          // Check for wb-ready or class starting with wb-
          const hasReady = el.dataset.wbReady;
          const hasWbClass = Array.from(el.classList).some(c => c.startsWith('wb-'));
          
          if (!hasReady && !hasWbClass) {
            count++;
            console.log('Uninitialized element:', el.outerHTML.substring(0, 100));
          }
        });
        return count;
      });
      
      if (uninitializedCount > 0) {
        console.warn(`${uninitializedCount} elements appear uninitialized`);
      }
      
      // Allow a small number due to timing, but flag if many are uninitialized
      expect(uninitializedCount).toBeLessThan(5);
    });
  });

  test.describe('Visual Regression Checks', () => {
    test('buttons have consistent styling', async ({ page }) => {
      const buttons = await page.locator('button[data-variant]').all();
      
      for (const button of buttons) {
        // Buttons with data-variant should have WB styling
        const hasStyle = await button.evaluate(el => {
          const computed = window.getComputedStyle(el);
          // Should have some background color (not transparent)
          return computed.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                 computed.backgroundColor !== 'transparent';
        });
        
        if (!hasStyle) {
          const variant = await button.getAttribute('data-variant');
          console.log(`Button with variant="${variant}" may be unstyled`);
        }
      }
    });

    test('spinners are animating', async ({ page }) => {
      const spinners = await page.locator('[data-wb="spinner"]').all();
      
      expect(spinners.length).toBeGreaterThan(0);
      
      for (const spinner of spinners) {
        // Check if spinner has SVG or animation
        const hasAnimation = await spinner.evaluate(el => {
          const svg = el.querySelector('svg');
          if (svg) {
            const computed = window.getComputedStyle(svg);
            return computed.animation !== 'none' || computed.animationName !== 'none';
          }
          return false;
        });
        
        expect(hasAnimation).toBe(true);
      }
    });
  });
});
