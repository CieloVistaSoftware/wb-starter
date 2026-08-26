import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * <select> must be a SUPERSET of <select>, not a replacement for it
 * (#360). It used to render a fake dropdown built from <button>/<div>/<ul>
 * -- no real <select> anywhere in it, so it silently lost native keyboard
 * navigation, the mobile picker UI, form submission, and screen-reader
 * semantics. semantics/select.js now builds a real <select>/<option> tree
 * for this tag and re-invokes its own native-<select> enhancement path on
 * it, so both share identical logic.
 */
test.describe('.x-select builds a real <select>, not a fake widget', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('a .x-select with options= builds a real <select> with real <option>s', async ({ page }) => {
    const el = await setupTestContainer(
      page,
      `<select label="Fruit" placeholder="Choose one" options='[{"value":"apple","label":"Apple"},{"value":"banana","label":"Banana"}]'></select>`
    );
    const select = el.locator('select');
    await expect(select).toHaveCount(1);
    await expect(select).toHaveClass('.x-select__field');
    await expect(select.locator('option')).toHaveCount(3); // placeholder + 2
    await expect(select.locator('option[value="apple"]')).toHaveText('Apple');

    // Real <select> means real native interaction works end to end.
    await select.selectOption('banana');
    await expect(select).toHaveValue('banana');
  });

  test('a plain native <select> still gets its existing enhancement unchanged', async ({ page }) => {
    const el = await setupTestContainer(
      page,
      '<select clearable><option value="">Choose...</option><option value="1">One</option></select>'
    );
    await expect(el).toHaveClass('x-select-clearable'); // the clearable wrapper div
  });

  test('reapplying clearable enhancement does not nest duplicate wrappers', async ({ page }) => {
    const el = await setupTestContainer(
      page,
      '<select clearable options="[{&quot;value&quot;:&quot;one&quot;,&quot;label&quot;:&quot;One&quot;}]\"></select>'
    );

    await page.evaluate((host) => {
      const field = host.querySelector('select');
      (window as any).WB.behaviors.select(field, { clearable: true });
    }, await el.elementHandle());

    await expect(el.locator('.x-select-clearable')).toHaveCount(1);
    await expect(el.locator('.x-select__clear')).toHaveCount(1);
    await expect(el.locator('select')).toHaveCount(1);
  });
});
