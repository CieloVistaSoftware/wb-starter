import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * <div x-input> is a schema-driven host whose $view already builds a full
 * structure (label, wrapper div, icon spans, clear button, and the real
 * <input>) declaratively. tag-map.js dispatches the 'input' behavior on
 * BOTH the host (elementMap['[x-input]']) and the real child (nativeMap
 * ['input']), but semantics/input.js has NO guard for which one it's
 * looking at (unlike switch.js/select.js/textarea.js) -- confirmed live:
 * dispatched on the host, it wraps the ENTIRE already-built <div x-input>
 * component in a second bogus wrapper div's worth of classes/inline styles
 * applied directly to the host tag itself (x-input__field class, width/
 * flex/padding inline styles meant for a bare text input). Separately, the
 * $view's "input" node never bound placeholder/value/name/type at all, so
 * the real built <input> rendered completely empty regardless. (#367)
 */
test.describe('[x-input] does not double-wrap its host and reflects its attributes', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('the host is not wrapped/styled as if it were a bare input', async ({ page }) => {
    const el = await setupTestContainer(
      page,
      '<div x-input label="Name" placeholder="Enter text..." value="hello" name="foo" input-type="email"></div>'
    );
    await expect(el).not.toHaveClass(/x-input__field/);
    const style = await el.getAttribute('style');
    expect(style, 'host should not get bare-input inline styles').toBeFalsy();
  });

  test('placeholder/value/name/type reach the real built <input>', async ({ page }) => {
    const el = await setupTestContainer(
      page,
      '<div x-input label="Name" placeholder="Enter text..." value="hello" name="foo" input-type="email"></div>'
    );
    const input = el.locator('input');
    await expect(input).toHaveCount(1);
    await expect(input).toHaveAttribute('placeholder', 'Enter text...');
    await expect(input).toHaveAttribute('name', 'foo');
    await expect(input).toHaveAttribute('type', 'email');
    await expect(input).toHaveValue('hello');
  });

  test('exactly one clear button renders when clearable is set', async ({ page }) => {
    const el = await setupTestContainer(page, '<div x-input label="Search" clearable value="x"></div>');
    const clearButtons = el.locator('button.x-input__clear');
    await expect(clearButtons).toHaveCount(1);
  });
});
