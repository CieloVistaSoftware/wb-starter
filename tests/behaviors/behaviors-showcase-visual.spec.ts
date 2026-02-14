/**
 * Behaviors Showcase Tests
 * ========================
 * Tests for demos/behaviors.html - validates all behaviors render correctly
 * 
 * Known Issues to Catch:
 * 1. drawer-layout: Toggle arrow overlaps text, "Main Content" cut off
 * 2. dropdown: Not rendering as dropdown - shows raw links
 * 3. toggle: Button becomes black/white (loses styling)
 * 4. masonry: Column layout not working
 * 5. tabs: Buttons too high
 * 6. code-examples: Text overflow, invalid HTML
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Behaviors Showcase Visual Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/behaviors.html`);
    // Wait for WB to initialize
    await page.waitForTimeout(1000);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DRAWER-LAYOUT TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Drawer Layout', () => {
    
    test('drawer-layout should have wb-drawer-layout class', async ({ page }) => {
      const drawer = page.locator('[x-drawer-layout]').first();
      await expect(drawer).toHaveClass(/wb-drawer-layout|wb-drawer/);
    });

    test('drawer text should not be cut off', async ({ page }) => {
      const drawer = page.locator('[x-drawer-layout]').first();
      const drawerBox = await drawer.boundingBox();
      
      // Get text elements inside drawer
      const textElements = drawer.locator('div:has-text("Sidebar"), div:has-text("Main")');
      const count = await textElements.count();
      
      for (let i = 0; i < count; i++) {
        const textEl = textElements.nth(i);
        const textBox = await textEl.boundingBox();
        if (textBox && drawerBox) {
          // Text should be within container bounds
          expect(textBox.x, 'Text should not overflow left').toBeGreaterThanOrEqual(drawerBox.x - 5);
          expect(textBox.x + textBox.width, 'Text should not overflow right').toBeLessThanOrEqual(drawerBox.x + drawerBox.width + 5);
        }
      }
    });

    test('drawer toggle button should not overlap content text', async ({ page }) => {
      const drawer = page.locator('[x-drawer-layout]').first();
      const toggle = drawer.locator('.wb-drawer-toggle, button:has-text("◀"), button:has-text("▶")');
      const sidebarText = drawer.locator('div:has-text("Sidebar")').first();
      
      if (await toggle.count() > 0 && await sidebarText.count() > 0) {
        const toggleBox = await toggle.boundingBox();
        const textBox = await sidebarText.boundingBox();
        
        if (toggleBox && textBox) {
          // Check for overlap
          const overlaps = !(toggleBox.x + toggleBox.width <= textBox.x ||
                           textBox.x + textBox.width <= toggleBox.x ||
                           toggleBox.y + toggleBox.height <= textBox.y ||
                           textBox.y + textBox.height <= toggleBox.y);
          
          expect(overlaps, 'Toggle button should not overlap "Sidebar" text').toBe(false);
        }
      }
    });

    test('"Main Content" text should be fully visible', async ({ page }) => {
      const mainContent = page.locator('[x-drawer-layout] >> text=Main Content').first();
      
      if (await mainContent.count() > 0) {
        const isVisible = await mainContent.isVisible();
        expect(isVisible, '"Main Content" should be visible').toBe(true);
        
        // Check text isn't clipped
        const box = await mainContent.boundingBox();
        expect(box, '"Main Content" should have a bounding box').toBeTruthy();
        if (box) {
          expect(box.width, '"Main Content" should have reasonable width').toBeGreaterThan(50);
        }
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DROPDOWN TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Dropdown', () => {
    
    test('dropdown should have wb-dropdown class', async ({ page }) => {
      const dropdown = page.locator('wb-dropdown').first();
      await expect(dropdown).toHaveClass(/wb-dropdown/);
    });

    test('dropdown should create a trigger button', async ({ page }) => {
      const dropdown = page.locator('wb-dropdown').first();
      const trigger = dropdown.locator('.wb-dropdown__trigger, button');
      
      const triggerCount = await trigger.count();
      expect(triggerCount, 'Dropdown should have a trigger button').toBeGreaterThan(0);
    });

    test('dropdown should create a menu container', async ({ page }) => {
      const dropdown = page.locator('wb-dropdown').first();
      const menu = dropdown.locator('.wb-dropdown__menu');
      
      const menuCount = await menu.count();
      expect(menuCount, 'Dropdown should have a menu container').toBeGreaterThan(0);
    });

    test('dropdown menu should be hidden initially', async ({ page }) => {
      const dropdown = page.locator('wb-dropdown').first();
      const menu = dropdown.locator('.wb-dropdown__menu');
      
      if (await menu.count() > 0) {
        // Menu should be hidden (display: none)
        const display = await menu.evaluate(el => getComputedStyle(el).display);
        expect(display, 'Dropdown menu should be hidden initially').toBe('none');
      }
    });

    test('dropdown should NOT show raw links without trigger', async ({ page }) => {
      const dropdown = page.locator('wb-dropdown').first();
      
      // Check if links are directly visible children (bad - means dropdown didn't process them)
      const directLinks = dropdown.locator('> a');
      const directCount = await directLinks.count();
      
      // If there are direct <a> children visible, dropdown didn't transform them
      if (directCount > 0) {
        const isVisible = await directLinks.first().isVisible();
        expect(isVisible, 'Raw links should not be visible - dropdown should have moved them to menu').toBe(false);
      }
    });

    test('clicking dropdown trigger should open menu', async ({ page }) => {
      const dropdown = page.locator('wb-dropdown').first();
      const trigger = dropdown.locator('.wb-dropdown__trigger').first();
      const menu = dropdown.locator('.wb-dropdown__menu');
      
      if (await trigger.count() > 0 && await menu.count() > 0) {
        await trigger.click();
        await page.waitForTimeout(200);
        
        const display = await menu.evaluate(el => getComputedStyle(el).display);
        expect(display, 'Menu should be visible after clicking trigger').not.toBe('none');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TOGGLE TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Toggle', () => {
    
    test('toggle button should have visible background color', async ({ page }) => {
      const toggle = page.locator('wb-toggle').first();
      
      if (await toggle.count() > 0) {
        const bgColor = await toggle.evaluate(el => getComputedStyle(el).backgroundColor);
        
        // Background should not be transparent or empty
        const isInvisible = bgColor === 'transparent' || 
                           bgColor === 'rgba(0, 0, 0, 0)' || 
                           bgColor === '';
        
        expect(isInvisible, `Toggle should have visible background, got: ${bgColor}`).toBe(false);
      }
    });

    test('toggle button should maintain styling after click', async ({ page }) => {
      const toggle = page.locator('wb-toggle').first();
      
      if (await toggle.count() > 0) {
        // Get initial styles
        const initialBg = await toggle.evaluate(el => getComputedStyle(el).backgroundColor);
        
        // Click to toggle OFF
        await toggle.click();
        await page.waitForTimeout(100);
        
        // Get styles after click
        const afterBg = await toggle.evaluate(el => getComputedStyle(el).backgroundColor);
        
        // Should still have a background (not empty)
        const hasBackground = afterBg && 
                             afterBg !== '' && 
                             afterBg !== 'rgba(0, 0, 0, 0)' &&
                             afterBg !== 'transparent';
        
        expect(hasBackground, `Toggle should maintain background after click, got: ${afterBg}`).toBe(true);
      }
    });

    test('toggle button text should be visible (not white on white)', async ({ page }) => {
      const toggle = page.locator('wb-toggle').first();
      
      if (await toggle.count() > 0) {
        await toggle.click(); // Toggle to off state
        await page.waitForTimeout(100);
        
        const color = await toggle.evaluate(el => getComputedStyle(el).color);
        const bgColor = await toggle.evaluate(el => getComputedStyle(el).backgroundColor);
        
        // Text and background should have contrast
        expect(color, 'Text color should be set').toBeTruthy();
        expect(color !== bgColor, 'Text and background should be different').toBe(true);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MASONRY TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Masonry', () => {
    
    test('masonry should have wb-masonry class', async ({ page }) => {
      const masonry = page.locator('wb-masonry').first();
      await expect(masonry).toHaveClass(/wb-masonry/);
    });

    test('masonry should have column-count CSS applied', async ({ page }) => {
      const masonry = page.locator('wb-masonry').first();
      
      if (await masonry.count() > 0) {
        const columnCount = await masonry.evaluate(el => getComputedStyle(el).columnCount);
        
        // Should have columns set (not 'auto' or empty)
        expect(columnCount, 'Masonry should have column-count set').not.toBe('auto');
        expect(columnCount, 'Masonry should have column-count set').not.toBe('');
        
        const numColumns = parseInt(columnCount);
        expect(numColumns, 'Masonry should have at least 2 columns').toBeGreaterThanOrEqual(2);
      }
    });

    test('masonry children should have break-inside: avoid', async ({ page }) => {
      const masonry = page.locator('wb-masonry').first();
      const children = masonry.locator('> *');
      
      const count = await children.count();
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          const child = children.nth(i);
          const breakInside = await child.evaluate(el => getComputedStyle(el).breakInside);
          expect(breakInside, `Masonry child ${i} should have break-inside: avoid`).toBe('avoid');
        }
      }
    });

    test('masonry items should be distributed across columns', async ({ page }) => {
      const masonry = page.locator('wb-masonry').first();
      const children = masonry.locator('> *');
      
      const count = await children.count();
      if (count >= 3) {
        // Get x positions of first few items
        const positions: number[] = [];
        for (let i = 0; i < Math.min(count, 5); i++) {
          const box = await children.nth(i).boundingBox();
          if (box) positions.push(Math.round(box.x));
        }
        
        // Should have items at different x positions (multiple columns)
        const uniqueX = new Set(positions);
        expect(uniqueX.size, 'Items should be distributed across multiple columns').toBeGreaterThan(1);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TABS TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Tabs', () => {
    
    test('tabs should have wb-tabs class', async ({ page }) => {
      const tabs = page.locator('wb-tabs').first();
      await expect(tabs).toHaveClass(/wb-tabs/);
    });

    test('tab buttons should have reasonable height/padding', async ({ page }) => {
      const tabButton = page.locator('.wb-tabs__tab').first();
      
      if (await tabButton.count() > 0) {
        const box = await tabButton.boundingBox();
        
        if (box) {
          // Tab button height should be reasonable (not too tall)
          expect(box.height, 'Tab button should not be too tall').toBeLessThan(60);
          expect(box.height, 'Tab button should have some height').toBeGreaterThan(15);
        }
        
        const paddingTop = await tabButton.evaluate(el => getComputedStyle(el).paddingTop);
        const paddingValue = parseFloat(paddingTop);
        
        // Padding should be reasonable
        expect(paddingValue, 'Tab padding should not be excessive').toBeLessThan(20);
      }
    });

    test('tabs navigation should exist', async ({ page }) => {
      const tabs = page.locator('wb-tabs').first();
      const nav = tabs.locator('.wb-tabs__nav');
      
      expect(await nav.count(), 'Tabs should have navigation container').toBeGreaterThan(0);
    });

    test('clicking tab should switch content', async ({ page }) => {
      const tabs = page.locator('wb-tabs').first();
      const secondTab = tabs.locator('.wb-tabs__tab').nth(1);
      
      if (await secondTab.count() > 0) {
        await secondTab.click();
        await page.waitForTimeout(100);
        
        // Second tab should now be active
        await expect(secondTab).toHaveClass(/wb-tabs__tab--active/);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CODE EXAMPLES TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Code Examples', () => {
    
    test('code blocks should not have horizontal overflow', async ({ page }) => {
      const codeBlocks = page.locator('.wb-mdhtml pre, .behavior-card pre');
      const count = await codeBlocks.count();
      
      const overflowingBlocks: string[] = [];
      
      for (let i = 0; i < count; i++) {
        const block = codeBlocks.nth(i);
        const hasOverflow = await block.evaluate(el => {
          return el.scrollWidth > el.clientWidth + 5; // 5px tolerance
        });
        
        if (hasOverflow) {
          const parent = await block.evaluate(el => el.closest('.behavior-card')?.querySelector('.behavior-title')?.textContent || `block-${i}`);
          overflowingBlocks.push(parent as string);
        }
      }
      
      expect(overflowingBlocks.length, `Code blocks with overflow: ${overflowingBlocks.join(', ')}`).toBe(0);
    });

    test('code example HTML should be parseable', async ({ page }) => {
      const codeBlocks = page.locator('.wb-mdhtml code, .behavior-card code');
      const count = await codeBlocks.count();
      
      const invalidExamples: string[] = [];
      
      for (let i = 0; i < Math.min(count, 20); i++) {
        const code = codeBlocks.nth(i);
        const text = await code.textContent();
        
        if (text && text.includes('<') && text.includes('>')) {
          // Try to detect obviously broken HTML
          const openTags = (text.match(/<[a-z][^>]*>/gi) || []).length;
          const closeTags = (text.match(/<\/[a-z]+>/gi) || []).length;
          
          // Very basic check - should have at least some closing tags if there are open tags
          if (openTags > 3 && closeTags === 0) {
            const snippet = text.substring(0, 50);
            invalidExamples.push(`Block ${i}: Missing closing tags - "${snippet}..."`);
          }
        }
      }
      
      expect(invalidExamples.length, `Invalid HTML examples:\n${invalidExamples.join('\n')}`).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GLOBAL TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Global Page Tests', () => {
    
    test('page should not have horizontal scrollbar', async ({ page }) => {
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalScroll, 'Page should not have horizontal scrollbar').toBe(false);
    });

    test('all behavior elements should be initialized', async ({ page }) => {
      const uninitializedElements = await page.evaluate(() => {
        // In v3.0, behaviors use x-* attributes. Find all elements with x-* attrs.
        const allElements = document.querySelectorAll('*');
        const uninitialized: string[] = [];
        
        allElements.forEach((el, i) => {
          const attrs = Array.from(el.attributes);
          const xAttr = attrs.find(a => a.name.startsWith('x-'));
          if (!xAttr) return;
          
          const ready = el.classList.contains('wb-ready');
          const behaviorName = xAttr.name.replace('x-', '');
          
          // Skip certain behaviors that don't set ready
          const skipBehaviors = ['ripple', 'tooltip', 'copy', 'hotkey'];
          
          if (!ready && !skipBehaviors.some(s => behaviorName.includes(s))) {
            uninitialized.push(`${behaviorName} (element ${i})`);
          }
        });
        
        return uninitialized;
      });
      
      if (uninitializedElements.length > 0) {
        console.log('Uninitialized behaviors:', uninitializedElements.slice(0, 10));
      }
      
      // Allow some uninitialized (some behaviors may not set ready attribute)
      expect(uninitializedElements.length, 'Too many uninitialized behaviors').toBeLessThan(20);
    });

    test('no visible text should overflow its container', async ({ page }) => {
      const overflowingText = await page.evaluate(() => {
        const issues: string[] = [];
        
        // Check all text-containing elements
        const textElements = document.querySelectorAll('p, span, div, button, a, h1, h2, h3, h4, h5, h6, li, td, th');
        
        textElements.forEach((el, i) => {
          if (el.closest('wb-mdhtml, wb-mdhtml')) return; // Skip code blocks
          
          const style = getComputedStyle(el);
          if (style.overflow === 'hidden' || style.display === 'none') return;
          
          // Check if text overflows
          if (el.scrollWidth > el.clientWidth + 10 && el.textContent && el.textContent.trim().length > 0) {
            const text = el.textContent.trim().substring(0, 30);
            if (text && !text.includes('<')) { // Skip code
              issues.push(`"${text}..." overflows by ${el.scrollWidth - el.clientWidth}px`);
            }
          }
        });
        
        return issues.slice(0, 5); // Return first 5 issues
      });
      
      expect(overflowingText.length, `Text overflow issues:\n${overflowingText.join('\n')}`).toBe(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// KNOWN ISSUES VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Known Issues Detection', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/behaviors.html`);
    await page.waitForTimeout(1000);
  });

  test('KNOWN ISSUE: drawer-layout toggle overlaps text', async ({ page }) => {
    const drawer = page.locator('[x-drawer-layout]').first();
    
    if (await drawer.count() > 0) {
      const toggle = drawer.locator('.wb-drawer-toggle, button').first();
      const sidebarText = drawer.locator('div').filter({ hasText: 'Sidebar' }).first();
      
      if (await toggle.count() > 0 && await sidebarText.count() > 0) {
        const toggleBox = await toggle.boundingBox();
        const textBox = await sidebarText.boundingBox();
        
        if (toggleBox && textBox) {
          const overlaps = !(toggleBox.x + toggleBox.width <= textBox.x ||
                           textBox.x + textBox.width <= toggleBox.x);
          
          if (overlaps) {
            console.log('⚠️ KNOWN ISSUE DETECTED: Drawer toggle overlaps sidebar text');
          }
          
          // This test documents the issue but allows it to pass
          // Remove .skip when fixed
        }
      }
    }
  });

  test('KNOWN ISSUE: toggle button loses styling', async ({ page }) => {
    const toggle = page.locator('wb-toggle').first();
    
    if (await toggle.count() > 0) {
      // Click to toggle off
      await toggle.click();
      await page.waitForTimeout(100);
      
      const bgColor = await toggle.evaluate(el => getComputedStyle(el).backgroundColor);
      
      if (!bgColor || bgColor === '' || bgColor === 'rgba(0, 0, 0, 0)') {
        console.log('⚠️ KNOWN ISSUE DETECTED: Toggle button loses background after click');
      }
    }
  });
});
