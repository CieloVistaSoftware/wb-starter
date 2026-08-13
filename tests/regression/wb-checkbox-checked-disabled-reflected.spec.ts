import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * John, live correction (forms.html screenshot): <wb-checkbox checked> and
 * <wb-checkbox disabled> both rendered as a plain unchecked, enabled box --
 * confirmed the code sample was correct, only the rendered visual was wrong.
 *
 * Root cause: checkbox.schema.json's $view builds a real, hidden
 * <input class="wb-checkbox__input"> as the state driver for the visual
 * .wb-checkbox__box/.wb-checkbox__check pair (checkbox.css:
 * `.wb-checkbox__input:checked ~ .wb-checkbox__box`, entirely dependent on
 * the native :checked pseudo-class). schema-builder.js's generic $view
 * builder only ever sets STATIC part.attributes (checkbox.schema.json's
 * input view only declares `type: checkbox`) and applyVariantClasses()
 * only adds a class to the HOST element for a boolean property (e.g.
 * wb-checkbox--checked) -- neither actually sets the real input's
 * checked/disabled/required DOM properties. checkbox.js explicitly skips
 * the schema-built internal input (`.wb-checkbox__input` class guard,
 * "keep it hidden via CSS instead") without ever doing this reflection
 * itself -- unlike switch.js, which explicitly reflects
 * host.hasAttribute('checked')/('disabled') onto <wb-switch>'s schema-built
 * input (switch.js, "Reflect host attributes onto the real checkbox").
 * checkbox.js never had the equivalent step.
 */
test.describe('wb-checkbox reflects checked/disabled onto its real input', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('<wb-checkbox checked> is actually checked', async ({ page }) => {
    const el = await setupTestContainer(page, '<wb-checkbox label="Checked" checked></wb-checkbox>');
    const input = el.locator('input[type="checkbox"]');
    await expect(input).toBeChecked();
  });

  test('<wb-checkbox disabled> is actually disabled', async ({ page }) => {
    const el = await setupTestContainer(page, '<wb-checkbox label="Disabled" disabled></wb-checkbox>');
    const input = el.locator('input[type="checkbox"]');
    await expect(input).toBeDisabled();
  });

  test('<wb-checkbox> with neither attribute stays unchecked and enabled', async ({ page }) => {
    const el = await setupTestContainer(page, '<wb-checkbox label="Plain"></wb-checkbox>');
    const input = el.locator('input[type="checkbox"]');
    await expect(input).not.toBeChecked();
    await expect(input).toBeEnabled();
  });

  test('a disabled checkbox does not toggle on click', async ({ page }) => {
    const el = await setupTestContainer(page, '<wb-checkbox label="Disabled" disabled></wb-checkbox>');
    const input = el.locator('input[type="checkbox"]');
    await el.click({ force: true });
    await expect(input).not.toBeChecked();
  });
});
