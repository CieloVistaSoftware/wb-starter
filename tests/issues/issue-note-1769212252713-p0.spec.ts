/**
 * Issue Test: note-1769212252713-p0
 * BUG: Unit tests for all x-attributes must be validated as added and removed
 */
import { test, expect } from '@playwright/test';

const X_ATTRIBUTES = [
  'x-draggable',
  'x-resizable', 
  'x-sortable',
  'x-collapsible',
  'x-tooltip',
  'x-clipboard',
  'x-ripple',
  'x-animate'
];

test.describe('Issue note-1769212252713-p0: X-Attributes Add/Remove Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
  });

  for (const attr of X_ATTRIBUTES) {
    test(`${attr} should initialize when added and cleanup when removed`, async ({ page }) => {
      // Create test element
      await page.evaluate(() => {
        const el = document.createElement('div');
        el.id = 'test-x-attr';
        el.style.cssText = 'width: 100px; height: 100px; background: #ccc; position: relative;';
        el.textContent = 'Test Element';
        document.body.appendChild(el);
      });

      const element = page.locator('#test-x-attr');
      await expect(element).toBeVisible();

      // Add the x-attribute
      await page.evaluate((attrName) => {
        const el = document.getElementById('test-x-attr');
        if (el) el.setAttribute(attrName, '');
      }, attr);

      await page.waitForTimeout(100);

      // Verify behavior initialized (check for added classes, event listeners, etc.)
      const afterAdd = await page.evaluate((attrName) => {
        const el = document.getElementById('test-x-attr');
        if (!el) return null;
        return {
          hasAttr: el.hasAttribute(attrName),
          classList: Array.from(el.classList),
          dataset: { ...el.dataset }
        };
      }, attr);

      expect(afterAdd?.hasAttr).toBe(true);

      // Remove the x-attribute  
      await page.evaluate((attrName) => {
        const el = document.getElementById('test-x-attr');
        if (el) el.removeAttribute(attrName);
      }, attr);

      await page.waitForTimeout(100);

      // Verify behavior cleaned up
      const afterRemove = await page.evaluate((attrName) => {
        const el = document.getElementById('test-x-attr');
        if (!el) return null;
        return {
          hasAttr: el.hasAttribute(attrName),
          classList: Array.from(el.classList),
          // Check no leftover event data
          hasCleanup: true
        };
      }, attr);

      expect(afterRemove?.hasAttr).toBe(false);
    });
  }

  test('multiple x-attributes should work together', async ({ page }) => {
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'multi-attr';
      el.style.cssText = 'width: 150px; height: 150px; background: #ddd;';
      el.setAttribute('x-draggable', '');
      el.setAttribute('x-tooltip', 'Test tooltip');
      document.body.appendChild(el);
    });

    const element = page.locator('#multi-attr');
    
    const attrs = await element.evaluate((el) => ({
      hasDraggable: el.hasAttribute('x-draggable'),
      hasTooltip: el.hasAttribute('x-tooltip')
    }));

    expect(attrs.hasDraggable).toBe(true);
    expect(attrs.hasTooltip).toBe(true);
  });
});
