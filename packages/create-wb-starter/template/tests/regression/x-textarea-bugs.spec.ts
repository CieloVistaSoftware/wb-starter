import { test, expect } from '../fixtures/offline';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * <textarea> is a schema-driven host (baseClass x-textarea) whose $view
 * builds a real <textarea> inside it. semantics/textarea.js used to assume
 * `element` WAS that real <textarea> directly -- true when dispatched via
 * nativeMap on a bare <textarea>, but false when dispatched via elementMap on
 * the <textarea> HOST (element.style writes, classList, and value/attr
 * reads all landed on the wrong node), and none of rows/placeholder/variant
 * ever got reflected from the host's attributes onto the built child at all
 * (#362).
 */
// The fixtures below used to be written `<textarea ...></textarea>` -- the
// 4.0.0 tag removal rewrote the old <wb-textarea> host to the bare native
// tag, which IS the field and has no <textarea> child to find, so every
// locator('textarea') matched nothing. The host form this spec is about is
// the container: <div x-textarea>.
test.describe('.x-textarea reflects host attributes onto its built <textarea>', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('placeholder shows when there is no body content', async ({ page }) => {
    const el = await setupTestContainer(page, '<div x-textarea placeholder="Enter text..."></div>');
    const ta = el.locator('textarea');
    await expect(ta).toHaveAttribute('placeholder', 'Enter text...');
  });

  test('rows= is applied to the real textarea', async ({ page }) => {
    const el = await setupTestContainer(page, '<div x-textarea rows="5"></div>');
    const ta = el.locator('textarea');
    await expect(ta).toHaveAttribute('rows', '5');
  });

  test('autosize does not block editing', async ({ page }) => {
    const el = await setupTestContainer(page, '<div x-textarea autosize></div>');
    const ta = el.locator('textarea');
    await expect(ta).toBeEditable();
    await ta.fill('hello world');
    await expect(ta).toHaveValue('hello world');
  });

  test('variant= applies its class', async ({ page }) => {
    const el = await setupTestContainer(page, '<div x-textarea variant="success"></div>');
    const ta = el.locator('textarea');
    await expect(ta).toHaveClass(/x-textarea--success/);
  });
});
