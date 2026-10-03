import { test, expect } from '../fixtures/offline';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * John, live correction (forms.html screenshot): <div x-checkbox checked> and
 * <div x-checkbox disabled> both rendered as a plain unchecked, enabled box --
 * confirmed the code sample was correct, only the rendered visual was wrong.
 *
 * Root cause: checkbox.schema.json's $view builds a real, hidden
 * <input class="[x-checkbox]__input"> as the state driver for the visual
 * .x-checkbox__box/.x-checkbox__check pair (checkbox.css:
 * `.x-checkbox__input:checked ~ .x-checkbox__box`, entirely dependent on
 * the native :checked pseudo-class). schema-builder.js's generic $view
 * builder only ever sets STATIC part.attributes (checkbox.schema.json's
 * input view only declares `type: checkbox`) and applyVariantClasses()
 * only adds a class to the HOST element for a boolean property (e.g.
 * x-checkbox--checked) -- neither actually sets the real input's
 * checked/disabled/required DOM properties. checkbox.js explicitly skips
 * the schema-built internal input (`.x-checkbox__input` class guard,
 * "keep it hidden via CSS instead") without ever doing this reflection
 * itself -- unlike switch.js, which explicitly reflects
 * host.hasAttribute('checked')/('disabled') onto <div x-switch>'s schema-built
 * input (switch.js, "Reflect host attributes onto the real checkbox").
 * checkbox.js never had the equivalent step.
 */
test.describe('[x-checkbox] reflects checked/disabled onto its real input', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('<div x-checkbox checked> is actually checked', async ({ page }) => {
    const el = await setupTestContainer(page, '<div x-checkbox label="Checked" checked></div>');
    const input = el.locator('input[type="checkbox"]');
    await expect(input).toBeChecked();
  });

  test('<div x-checkbox disabled> is actually disabled', async ({ page }) => {
    const el = await setupTestContainer(page, '<div x-checkbox label="Disabled" disabled></div>');
    const input = el.locator('input[type="checkbox"]');
    await expect(input).toBeDisabled();
  });

  test('<div x-checkbox> with neither attribute stays unchecked and enabled', async ({ page }) => {
    const el = await setupTestContainer(page, '<div x-checkbox label="Plain"></div>');
    const input = el.locator('input[type="checkbox"]');
    await expect(input).not.toBeChecked();
    await expect(input).toBeEnabled();
  });

  test('an enabled checkbox toggles on click, on and off', async ({ page }) => {
    // The host is a <div> and the real input is hidden with pointer-events:none,
    // so without click forwarding a mouse could never tick it.
    const el = await setupTestContainer(page, '<div x-checkbox label="Toggle me"></div>');
    const input = el.locator('input[type="checkbox"]');
    await el.locator('.x-checkbox__box').click();
    await expect(input).toBeChecked();
    await el.locator('.x-checkbox__label').click();
    await expect(input).not.toBeChecked();
  });

  test('a disabled checkbox does not toggle on click', async ({ page }) => {
    const el = await setupTestContainer(page, '<div x-checkbox label="Disabled" disabled></div>');
    const input = el.locator('input[type="checkbox"]');
    // CI (Windows) failed this with "Element is outside of the viewport", twice:
    // the container sits below a 720px viewport, and the page's own scroll
    // reset can land between scrolling it in and clicking it -- after a
    // scroll-until-visible loop too (PR #1328). What is under test is that a
    // click does not toggle a disabled checkbox, not where the box is, so the
    // click is dispatched on the host itself.
    await el.dispatchEvent('click');
    await expect(input).not.toBeChecked();
  });
});
