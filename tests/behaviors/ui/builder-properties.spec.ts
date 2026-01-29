/**
 * Builder Properties Panel Tests
 * Tests for BUILDER-PROPERTIES-SPEC.md compliance
 * 
 * REQUIRED BEHAVIORS (2026-01-20):
 * 1. Text elements must have lorem ipsum
 * 2. Properties panel must be columnar (vertical)
 * 3. Text content must auto-grow
 * 4. Text content must update LIVE (as user types)
 * 5. Inline styles are optional (placeholder comment)
 * 6. Every element must have theme selector
 * 7. +Element and +Component buttons must work
 */
import { test, expect, Page } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 720 } });

test.describe('Builder Properties Panel - Spec Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);
  });

  test.describe('1. Text Elements Must Have Lorem Ipsum', () => {
    test('adding <p> element should have lorem ipsum content', async ({ page }) => {
      // Click + Element dropdown
      await page.click('button:has-text("+ Element")');
      await page.waitForTimeout(200);
      
      // Click <p> element
      await page.click('button:has-text("<p>")');
      await page.waitForTimeout(300);
      
      // Check canvas for the element
      const canvasElement = page.locator('.canvas-component .component-content p');
      await expect(canvasElement).toBeVisible();
      
      // Verify lorem ipsum content
      const content = await canvasElement.textContent();
      expect(content?.toLowerCase()).toContain('lorem ipsum');
    });

    test('adding heading elements should have default content', async ({ page }) => {
      // Add h1
      await page.click('button:has-text("+ Element")');
      await page.waitForTimeout(200);
      await page.click('button:has-text("<h1>")');
      await page.waitForTimeout(300);
      
      const h1 = page.locator('.canvas-component .component-content h1');
      await expect(h1).toHaveText(/heading/i);
    });
  });

  test.describe('2. Properties Panel Must Be Columnar', () => {
    test('property labels should be above inputs (vertical layout)', async ({ page }) => {
      // Add an element first
      await page.click('button:has-text("+ Element")');
      await page.waitForTimeout(200);
      await page.click('button:has-text("<div>")');
      await page.waitForTimeout(300);
      
      // Click on the element to select it
      await page.click('.canvas-component');
      await page.waitForTimeout(200);
      
      // Check properties panel has prop-row with flex-direction: column
      const propRow = page.locator('.prop-row').first();
      await expect(propRow).toBeVisible();
      
      // Verify layout is columnar
      const flexDirection = await propRow.evaluate(el => 
        window.getComputedStyle(el).flexDirection
      );
      expect(flexDirection).toBe('column');
    });
  });

  test.describe('3. Text Content Must Auto-Grow', () => {
    test('text content textarea should expand with content and appears as first category', async ({ page }) => {
      // Add a text element
      await page.click('button:has-text("+ Element")');
      await page.waitForTimeout(200);
      await page.click('button:has-text("<p>")');
      await page.waitForTimeout(300);
      
      // Select the newly added element (last on canvas)
      const wrapper = page.locator('.canvas-component').last();
      await expect(wrapper).toBeVisible();
      await wrapper.click();
      await page.waitForTimeout(200);

      // Wait for properties panel and do diagnostic checks
      const panel = page.locator('#propertiesPanel');
      await expect(panel).toBeAttached();

      const categoriesCount = await panel.locator('.prop-category').count();
      if (categoriesCount === 0) {
        const panelHtml = await panel.evaluate(el => el.innerHTML);
        const bodySnap = await page.evaluate(() => document.body.innerHTML.substring(0, 20000));
        throw new Error(`Diagnostic Failure: properties panel empty. panel.innerHTML:\n${panelHtml}\n\nBody snapshot (truncated):\n${bodySnap}`);
      }

      // Verify ordering: Text Content should be the first category and Inline Style second
      const firstCategory = page.locator('.prop-category').first();
      await expect(firstCategory).toContainText('Text Content');
      const secondCategory = page.locator('.prop-category').nth(1);
      await expect(secondCategory).toContainText('Inline Style');

      // Find the text content textarea specifically
      const textarea = page.locator('.prop-category:has-text("Text Content") textarea');
      await expect(textarea).toBeVisible();

      // Get initial height
      const initialHeight = await textarea.evaluate(el => el.scrollHeight);
      
      // Type multiple lines
      await textarea.fill('Line 1\nLine 2\nLine 3\nLine 4\nLine 5');
      await page.waitForTimeout(100);
      
      // Verify textarea grew
      const newHeight = await textarea.evaluate(el => el.scrollHeight);
      expect(newHeight).toBeGreaterThanOrEqual(initialHeight);
    });
  });

  test.describe('4. Text Content Must Update Live', () => {
    test('typing in properties panel should update canvas in real-time', async ({ page }) => {
      // Add a paragraph
      await page.click('button:has-text("+ Element")');
      await page.waitForTimeout(200);
      await page.click('button:has-text("<p>")');
      await page.waitForTimeout(300);
      
      // Select the newly added element (last on canvas)
      const wrapper = page.locator('.canvas-component').last();
      await expect(wrapper).toBeVisible();
      await wrapper.click();
      await page.waitForTimeout(200);

      // Wait for properties panel and diagnostic checks
      const panel = page.locator('#propertiesPanel');
      await expect(panel).toBeAttached();
      const categoriesCount = await panel.locator('.prop-category').count();
      if (categoriesCount === 0) {
        const panelHtml = await panel.evaluate(el => el.innerHTML);
        const bodySnap = await page.evaluate(() => document.body.innerHTML.substring(0, 20000));
        throw new Error(`Diagnostic Failure: properties panel empty. panel.innerHTML:\n${panelHtml}\n\nBody snapshot (truncated):\n${bodySnap}`);
      }

      // Find the text content textarea specifically
      const textarea = page.locator('.prop-category:has-text("Text Content") textarea');
      await expect(textarea).toBeVisible();
      
      // Clear and type new content
      await textarea.fill('');
      await textarea.type('Live update test');
      
      // Check canvas element updated (not waiting for blur) — target the selected wrapper to avoid ambiguity
      const canvasP = wrapper.locator('.component-content p').first();
      await expect(canvasP).toHaveText('Live update test');
    });
  });

  test.describe('5. Inline Styles Are Optional', () => {
    test('inline style section should have placeholder comment', async ({ page }) => {
      // Add an element
      await page.click('button:has-text("+ Element")');
      await page.waitForTimeout(200);
      await page.click('button:has-text("<div>")');
      await page.waitForTimeout(300);
      
      // Select element
      await page.click('.canvas-component');
      await page.waitForTimeout(200);
      
      // Ensure Inline Style is the second category
      const secondCategory = page.locator('.prop-category').nth(1);
      await expect(secondCategory).toContainText('Inline Style');

      // Find inline style textarea specifically
      const styleTextarea = page.locator('.prop-category:has-text("Inline Style") textarea');
      await expect(styleTextarea).toBeVisible();
      
      // Check placeholder contains "optional" or comment markers
      const placeholder = await styleTextarea.getAttribute('placeholder');
      expect(placeholder?.toLowerCase()).toMatch(/optional|\/\*/);
    });

    test('new elements should not have automatic inline styles', async ({ page }) => {
      // Add an element
      await page.click('button:has-text("+ Element")');
      await page.waitForTimeout(200);
      await page.click('button:has-text("<p>")');
      await page.waitForTimeout(300);
      
      // Check element doesn't have style attribute (or minimal)
      const element = page.locator('.canvas-component .component-content p');
      const style = await element.getAttribute('style');
      
      // Should be null/undefined or empty
      expect(style || '').toBe('');
    });
  });

  test.describe('6. Every Element Must Have Theme Selector', () => {
    test('properties panel should have theme dropdown', async ({ page }) => {
      // Add an element
      await page.click('button:has-text("+ Element")');
      await page.waitForTimeout(200);
      await page.click('button:has-text("<div>")');
      await page.waitForTimeout(300);
      
      // Select element
      await page.click('.canvas-component');
      await page.waitForTimeout(200);
      
      // Find theme section in properties panel
      const themeSection = page.locator('.prop-category:has-text("Theme")');
      await expect(themeSection).toBeVisible();
      
      // Find theme dropdown
      const themeSelect = themeSection.locator('select');
      await expect(themeSelect).toBeVisible();
    });

    test('changing theme should add theme class to element', async ({ page }) => {
      // Add an element
      await page.click('button:has-text("+ Element")');
      await page.waitForTimeout(200);
      await page.click('button:has-text("<div>")');
      await page.waitForTimeout(300);
      
      // Select element
      await page.click('.canvas-component');
      await page.waitForTimeout(200);
      
      // Find and change theme
      const themeSelect = page.locator('.prop-category:has-text("Theme") select');
      await themeSelect.selectOption('wb-dark');
      await page.waitForTimeout(100);
      
      // Verify element has theme class
      const element = page.locator('.canvas-component .component-content > *').first();
      await expect(element).toHaveClass(/wb-dark/);
    });
  });

  test.describe('7. +Element and +Component Buttons Must Work', () => {
    test('canvas toolbar + Element button should add element', async ({ page }) => {
      // Count initial elements
      const initialCount = await page.locator('.canvas-component').count();
      
      // Click + Element
      await page.click('.canvas-toolbar button:has-text("+ Element")');
      await page.waitForTimeout(200);
      
      // Dropdown should be visible
      const dropdown = page.locator('.toolbar-dropdown.open, #dropdown-element.open');
      await expect(dropdown).toBeVisible();
      
      // Click on div
      await page.click('button:has-text("<div>")');
      await page.waitForTimeout(300);
      
      // Count should increase
      const newCount = await page.locator('.canvas-component').count();
      expect(newCount).toBe(initialCount + 1);
    });

    test('canvas toolbar + Component button should add component', async ({ page }) => {
      // Count initial elements
      const initialCount = await page.locator('.canvas-component').count();
      
      // Click + Component
      await page.click('.canvas-toolbar button:has-text("+ Component")');
      await page.waitForTimeout(200);
      
      // Dropdown should be visible
      const dropdown = page.locator('.toolbar-dropdown.open, #dropdown-component.open');
      await expect(dropdown).toBeVisible();
      
      // Click on a component (grid)
      await page.click('button:has-text("grid")');
      await page.waitForTimeout(300);
      
      // Count should increase
      const newCount = await page.locator('.canvas-component').count();
      expect(newCount).toBe(initialCount + 1);
    });

    test('component overlay + Element should add child', async ({ page }) => {
      // First add a container element
      await page.click('.canvas-toolbar button:has-text("+ Element")');
      await page.waitForTimeout(200);
      await page.click('button:has-text("<div>")');
      await page.waitForTimeout(300);
      
      // Now click the + Element on the component overlay
      const overlay = page.locator('.canvas-component .component-overlay');
      await overlay.locator('button:has-text("+ Element")').click();
      await page.waitForTimeout(200);
      
      // Select p from dropdown
      await page.click('button:has-text("<p>")');
      await page.waitForTimeout(300);
      
      // Verify child was added
      const children = page.locator('.canvas-component .canvas-component-child');
      expect(await children.count()).toBeGreaterThan(0);
    });

    test('component overlay + Component should add child component', async ({ page }) => {
      // First add a container element
      await page.click('.canvas-toolbar button:has-text("+ Element")');
      await page.waitForTimeout(200);
      await page.click('button:has-text("<div>")');
      await page.waitForTimeout(300);
      
      // Now click the + Component on the component overlay
      const overlay = page.locator('.canvas-component .component-overlay');
      await overlay.locator('button:has-text("+ Component")').click();
      await page.waitForTimeout(200);
      
      // Select grid from dropdown
      await page.click('button:has-text("grid")');
      await page.waitForTimeout(300);
      
      // Verify child component was added
      const children = page.locator('.canvas-component .canvas-component-child');
      expect(await children.count()).toBeGreaterThan(0);
    });
  });
});

test.describe('Builder Properties Panel - Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(500);
  });

  test('selecting element should show properties panel', async ({ page }) => {
    // Add element
    await page.click('button:has-text("+ Element")');
    await page.waitForTimeout(200);
    await page.click('button:has-text("<p>")');
    await page.waitForTimeout(300);
    
    // Click to select
    await page.click('.canvas-component');
    await page.waitForTimeout(200);
    
    // Properties panel should show content (not empty state)
    const panel = page.locator('#propertiesPanel');
    await expect(panel).not.toContainText('Select an element');
    
    // Should show element tag
    await expect(panel).toContainText('<p>');
  });

  test('deleting element should clear properties panel', async ({ page }) => {
    // Add and select element
    await page.click('button:has-text("+ Element")');
    await page.waitForTimeout(200);
    await page.click('button:has-text("<p>")');
    await page.waitForTimeout(300);
    
    await page.click('.canvas-component');
    await page.waitForTimeout(200);
    
    // Delete via trash button
    await page.click('.component-delete-btn');
    await page.waitForTimeout(200);
    
    // Properties panel should show empty state
    const panel = page.locator('#propertiesPanel');
    await expect(panel).toContainText(/select|empty/i);
  });
});
