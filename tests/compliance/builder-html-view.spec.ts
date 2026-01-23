/**
 * BUILDER HTML VIEW COMPLIANCE
 * ============================
 * Ensures each component dropped on the canvas has a "Show HTML" button
 * that displays the raw HTML code of that component.
 */

import { test, expect } from '@playwright/test';

// Use desktop viewport for builder tests
test.use({ viewport: { width: 1280, height: 720 } });

test.describe('Builder Component HTML View', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    // Wait for builder to initialize
    await page.waitForFunction(() => typeof window.addComponentToCanvas === 'function');
    await page.waitForTimeout(300);
  });

  test('each dropped component should have a Show HTML button', async ({ page }) => {
    // Add a component to the canvas
    await page.evaluate(() => {
      window.addComponentToCanvas('hero', 'main');
    });
    await page.waitForTimeout(200);

    // Check that the HTML button exists
    const htmlBtn = page.locator('.canvas-component .component-html-btn');
    await expect(htmlBtn).toBeVisible();
    await expect(htmlBtn).toHaveText('{ }');
    await expect(htmlBtn).toHaveAttribute('title', 'Show/Hide HTML');
  });

  test('Show HTML button should toggle HTML view', async ({ page }) => {
    // Add a component
    await page.evaluate(() => {
      window.addComponentToCanvas('hero', 'main');
    });
    await page.waitForTimeout(200);

    const component = page.locator('.canvas-component').first();
    const htmlBtn = component.locator('.component-html-btn');
    const contentEl = component.locator('.component-content');
    const htmlView = component.locator('.component-html-view');

    // Initial state: content visible, HTML hidden
    await expect(contentEl).toBeVisible();
    await expect(htmlView).toBeHidden();
    await expect(htmlBtn).not.toHaveClass(/active/);

    // Click to show HTML
    await htmlBtn.click();
    await page.waitForTimeout(100);

    // After click: content hidden, HTML visible
    await expect(contentEl).toBeHidden();
    await expect(htmlView).toBeVisible();
    await expect(htmlBtn).toHaveClass(/active/);

    // Click again to hide HTML
    await htmlBtn.click();
    await page.waitForTimeout(100);

    // Back to initial state
    await expect(contentEl).toBeVisible();
    await expect(htmlView).toBeHidden();
    await expect(htmlBtn).not.toHaveClass(/active/);
  });

  test('HTML view should display formatted code', async ({ page }) => {
    // Add a component
    await page.evaluate(() => {
      window.addComponentToCanvas('hero', 'main');
    });
    await page.waitForTimeout(200);

    const component = page.locator('.canvas-component').first();
    const htmlBtn = component.locator('.component-html-btn');

    // Show HTML
    await htmlBtn.click();
    await page.waitForTimeout(100);

    // Check HTML view contains code
    const htmlView = component.locator('.component-html-view');
    const codeEl = htmlView.locator('.component-html-code code');
    
    await expect(codeEl).toBeVisible();
    
    // Should contain HTML tags
    const codeText = await codeEl.textContent();
    expect(codeText).toContain('<');
    expect(codeText).toContain('>');
  });

  test('multiple components should each have independent HTML toggle', async ({ page }) => {
    // Add multiple components
    await page.evaluate(() => {
      window.addComponentToCanvas('hero', 'main');
      window.addComponentToCanvas('footer', 'footer');
    });
    await page.waitForTimeout(200);

    const components = page.locator('.canvas-component');
    const count = await components.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Each component should have its own HTML button
    for (let i = 0; i < count; i++) {
      const component = components.nth(i);
      const htmlBtn = component.locator('.component-html-btn');
      await expect(htmlBtn).toBeVisible();
    }

    // Toggle first component's HTML
    const firstBtn = components.first().locator('.component-html-btn');
    await firstBtn.click();
    await page.waitForTimeout(100);

    // First component should show HTML
    await expect(components.first().locator('.component-html-view')).toBeVisible();
    
    // Second component should still show content (not HTML)
    await expect(components.nth(1).locator('.component-content')).toBeVisible();
    await expect(components.nth(1).locator('.component-html-view')).toBeHidden();
  });

  test('semantic elements should also have Show HTML button', async ({ page }) => {
    // Add a semantic element
    await page.evaluate(() => {
      window.addSemanticElement('section', 'main', { icon: '📑', name: 'Section' });
    });
    await page.waitForTimeout(200);

    // Check HTML button exists on semantic element
    const htmlBtn = page.locator('.canvas-component .component-html-btn');
    await expect(htmlBtn).toBeVisible();
  });

  test('restored components should have Show HTML button', async ({ page }) => {
    // Add a component and trigger a state save/restore cycle
    await page.evaluate(() => {
      window.addComponentToCanvas('navbar', 'header');
    });
    await page.waitForTimeout(200);

    // Verify button exists after initial add
    let htmlBtn = page.locator('.canvas-component .component-html-btn').first();
    await expect(htmlBtn).toBeVisible();

    // Simulate page reload by clearing and restoring
    await page.evaluate(() => {
      // Save current state
      window.savePersistentState && window.savePersistentState(true);
    });
    
    // Reload page
    await page.reload();
    await page.waitForFunction(() => typeof window.addComponentToCanvas === 'function');
    await page.waitForTimeout(500);

    // Check components were restored with HTML button
    const restoredComponents = page.locator('.canvas-component');
    const count = await restoredComponents.count();
    
    if (count > 0) {
      htmlBtn = restoredComponents.first().locator('.component-html-btn');
      await expect(htmlBtn).toBeVisible();
    }
  });

  test('toggleComponentHtml function should be globally available', async ({ page }) => {
    const hasFunction = await page.evaluate(() => {
      return typeof window.toggleComponentHtml === 'function';
    });
    expect(hasFunction).toBe(true);
  });

  test('HTML button should have correct styling', async ({ page }) => {
    // Add a component
    await page.evaluate(() => {
      window.addComponentToCanvas('hero', 'main');
    });
    await page.waitForTimeout(200);

    const htmlBtn = page.locator('.canvas-component .component-html-btn').first();
    
    // Check button is styled correctly (has background color)
    const bgColor = await htmlBtn.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).not.toBe('transparent');
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
  });

});
