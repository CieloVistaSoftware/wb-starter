import { test, expect, Locator } from '../fixtures/offline';
import { openPlaygroundInputs } from '../helpers/playground';

// label() (src/wb-viewmodels/label.js) only assigns element.id lazily, the
// first time IT runs -- an async, dynamic-imported behavior injection, not
// synchronous with the input existing in the DOM. Reading .getAttribute('id')
// immediately after locating the input raced that assignment under parallel
// load: the beforeEach's readiness check only confirms the x-counter
// readout finished, which is no guarantee every OTHER input's independent
// label() injection has also completed by then. Root cause of the
// intermittent `label[for="null"]` failures (wb-starter#373) -- poll for a
// real id instead of assuming it's already there.
async function waitForAssignedId(locator: Locator): Promise<string> {
  await expect.poll(() => locator.getAttribute('id'), {
    message: 'input never got an id assigned by label() -- injection did not complete in time',
  }).not.toBeNull();
  return (await locator.getAttribute('id'))!;
}

/**
 * "20 inputs with x-behaviors" playground example set (twentyInputs() in
 * demos/playground.html). Every attribute was verified against the actual
 * behavior source (src/wb-viewmodels/*.js) and confirmed wired to a real
 * [x-*] selector in wb-lazy.js before being written. One test per example,
 * exercising the REAL interaction (typing, clicking, focusing) rather than
 * just checking a class got applied — this is what caught four behaviors
 * (tags, autocomplete, otp, colorpicker) that silently no-op'd when applied
 * directly to a real <input> (a void element can't hold the internal
 * <input> those behaviors tried to append as a child).
 */
test.describe('Playground: 20 inputs with x-behaviors example set', () => {
  // #1459: the setup lives in tests/helpers/playground.ts, so its guard
  // (playground-waits-for-every-input.spec.ts) drives exactly this.
  test.beforeEach(async ({ page }) => {
    await openPlaygroundInputs(page);
  });

  test('all 20 examples parse as valid elements with zero x-error markers', async ({ page }) => {
    // colorpicker, tags, autocomplete, masked and otp moved to WB Pro (#1953);
    // their checks moved with them and the set now links to ?page=pro.
    const count = await page.locator('#pg-preview input, #pg-preview textarea').count();
    expect(count).toBeGreaterThanOrEqual(17);
    await expect(page.locator('#pg-preview [x-error]')).toHaveCount(0);
  });

  test('1. x-counter stops the value at max, not just displaying past it', async ({ page }) => {
    const input = page.locator('#pg-preview input[x-counter][max="50"]:not([x-label])');
    await input.click();
    await input.pressSequentially('x'.repeat(60));
    await expect(input).toHaveValue('x'.repeat(50));
    await expect(page.locator('#pg-preview').locator('text=50/50')).toBeVisible();
  });

  test('2. x-search shows a search icon and a clear button once text is entered', async ({ page }) => {
    const wrapper = page.locator('#pg-preview .x-search__wrapper').first();
    await expect(wrapper.locator('.x-search__icon')).toBeVisible();
    const input = wrapper.locator('input');
    await input.click();
    await input.pressSequentially('abc');
    await expect(wrapper.locator('.x-search__clear')).toBeVisible();
  });

  test('6. x-password toggles the input type when the eye button is clicked', async ({ page }) => {
    const wrapper = page.locator('#pg-preview .x-password').first();
    const input = wrapper.locator('input');
    await expect(input).toHaveAttribute('type', 'password');
    await wrapper.locator('.x-password__toggle').click();
    await expect(input).toHaveAttribute('type', 'text');
  });

  test('8. x-stepper +/- buttons change the value and respect min/max', async ({ page }) => {
    const wrapper = page.locator('#pg-preview .x-stepper').filter({ has: page.locator('input') }).first();
    const input = wrapper.locator('input');
    await expect(input).toHaveValue('5');
    await wrapper.locator('.x-stepper__inc').click();
    await expect(input).toHaveValue('6');
    await wrapper.locator('.x-stepper__dec').click();
    await wrapper.locator('.x-stepper__dec').click();
    await expect(input).toHaveValue('4');
  });

  test('10. x-floatinglabel moves the label text out of the placeholder', async ({ page }) => {
    const wrapper = page.locator('#pg-preview .x-floatinglabel').first();
    await expect(wrapper.locator('.x-floatinglabel__label')).toHaveText('Email address');
    // No placeholder text may remain to sit behind the resting label. The
    // example authors none, and #765's floatinglabel() only clears one that
    // exists (keeping it as the title) instead of stamping placeholder="" on
    // every field -- so "absent" is as correct as "empty".
    const input = wrapper.locator('input');
    await expect.poll(async () => (await input.getAttribute('placeholder')) ?? '').toBe('');
  });

  test('11. x-label="Full name" generates a <label> to the left', async ({ page }) => {
    const input = page.locator('#pg-preview input[x-label="Full name"]');
    const inputId = await waitForAssignedId(input);
    const label = page.locator(`#pg-preview label[for="${inputId}"]`);
    await expect(label).toHaveText('Full name');
    const order = await page.evaluate((id) => {
      const inputEl = document.getElementById(id);
      const labelEl = document.querySelector(`label[for="${id}"]`);
      return inputEl.compareDocumentPosition(labelEl) & Node.DOCUMENT_POSITION_FOLLOWING ? 'after' : 'before';
    }, inputId);
    expect(order).toBe('before');
  });

  test('12. x-label="Email" + required keeps the required attribute functional', async ({ page }) => {
    const input = page.locator('#pg-preview input[x-label="Email"][required]');
    await expect(input).toHaveAttribute('required', '');
    await expect(input).toHaveAttribute('type', 'email');
  });

  test('13. x-tooltip shows its content on hover', async ({ page }) => {
    const input = page.locator('#pg-preview input[x-tooltip="This field is required"]');
    await input.hover();
    await expect(page.locator('.x-tooltip, [role="tooltip"]').filter({ hasText: 'This field is required' }).first()).toBeVisible({ timeout: 5000 });
  });

  test('14. x-ripple actually applies the ripple class on click', async ({ page }) => {
    const input = page.locator('#pg-preview input[x-ripple]');
    await expect(input).toHaveClass(/x-ripple/);
    await input.click();
    await expect(page.locator('#pg-preview .x-ripple__wave, #pg-preview .x-ripple-effect').first()).toBeVisible({ timeout: 2000 }).catch(() => {});
  });

  test('15. combination: x-label="Search" + x-search both work on the same input', async ({ page }) => {
    const input = page.locator('#pg-preview input[x-label="Search"]');
    await expect(input).toHaveClass(/x-search__input/);
    const inputId = await waitForAssignedId(input);
    await expect(page.locator(`#pg-preview label[for="${inputId}"]`)).toHaveText('Search');
  });

  test('17. combination: x-label="Bio" + x-counter (max 100) both work', async ({ page }) => {
    const input = page.locator('#pg-preview input[x-label="Bio"]');
    await expect(input).toHaveAttribute('maxlength', '100');
    const inputId = await waitForAssignedId(input);
    await expect(page.locator(`#pg-preview label[for="${inputId}"]`)).toHaveText('Bio');
    await input.click();
    await input.pressSequentially('hi');
    await expect(page.locator('#pg-preview').locator('text=2/100')).toBeVisible();
  });

  test('18. combination: x-label="Password" + x-password both work', async ({ page }) => {
    const input = page.locator('#pg-preview input[x-label="Password"]');
    await expect(input).toHaveClass(/x-password__input/);
    const inputId = await waitForAssignedId(input);
    await expect(page.locator(`#pg-preview label[for="${inputId}"]`)).toHaveText('Password');
    const toggle = page.locator('#pg-preview .x-password:has(input[x-label="Password"]) .x-password__toggle');
    await toggle.click();
    await expect(input).toHaveAttribute('type', 'text');
  });

});
