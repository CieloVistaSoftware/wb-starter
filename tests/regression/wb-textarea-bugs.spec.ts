import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * <wb-textarea> is a schema-driven host (baseClass wb-textarea) whose $view
 * builds a real <textarea> inside it. semantics/textarea.js used to assume
 * `element` WAS that real <textarea> directly -- true when dispatched via
 * nativeMap on a bare <textarea>, but false when dispatched via elementMap on
 * the <wb-textarea> HOST (element.style writes, classList, and value/attr
 * reads all landed on the wrong node), and none of rows/placeholder/variant
 * ever got reflected from the host's attributes onto the built child at all
 * (#362).
 */
test.describe('wb-textarea reflects host attributes onto its built <textarea>', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('placeholder shows when there is no body content', async ({ page }) => {
    const el = await setupTestContainer(page, '<wb-textarea placeholder="Enter text..."></wb-textarea>');
    const ta = el.locator('textarea');
    await expect(ta).toHaveAttribute('placeholder', 'Enter text...');
  });

  test('rows= is applied to the real textarea', async ({ page }) => {
    const el = await setupTestContainer(page, '<wb-textarea rows="5"></wb-textarea>');
    const ta = el.locator('textarea');
    await expect(ta).toHaveAttribute('rows', '5');
  });

  test('autosize does not block editing', async ({ page }) => {
    const el = await setupTestContainer(page, '<wb-textarea autosize></wb-textarea>');
    const ta = el.locator('textarea');
    await expect(ta).toBeEditable();
    await ta.fill('hello world');
    await expect(ta).toHaveValue('hello world');
  });

  test('variant= applies its class', async ({ page }) => {
    const el = await setupTestContainer(page, '<wb-textarea variant="success"></wb-textarea>');
    const ta = el.locator('textarea');
    await expect(ta).toHaveClass(/wb-textarea--success/);
  });
});
