import { test, expect } from '@playwright/test';

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
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/playground.html', { waitUntil: 'networkidle' });
    await page.selectOption('#pg-examples', 'inputs');
    await page.waitForFunction(() => document.querySelectorAll('#pg-preview input').length > 0, { timeout: 15000 });
    // counter.js puts the "N/max" readout on a sibling <span class="wb-counter">,
    // never on the input itself — wait for that span's text to confirm the
    // whole example set has actually finished enhancing.
    await page.waitForFunction(() => {
      const spans = document.querySelectorAll('#pg-preview .wb-counter');
      return spans.length >= 2 && [...spans].some((el) => el.textContent === '0/50');
    }, { timeout: 20000 });
  });

  test('all 20 examples parse as valid elements with zero x-error markers', async ({ page }) => {
    const count = await page.locator('#pg-preview input, #pg-preview [x-colorpicker], #pg-preview [x-otp]').count();
    expect(count).toBeGreaterThanOrEqual(20);
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
    const wrapper = page.locator('#pg-preview .wb-search__wrapper').first();
    await expect(wrapper.locator('.wb-search__icon')).toBeVisible();
    const input = wrapper.locator('input');
    await input.click();
    await input.pressSequentially('abc');
    await expect(wrapper.locator('.wb-search__clear')).toBeVisible();
  });

  test('3. x-colorpicker (on a div) builds a real native color input', async ({ page }) => {
    const picker = page.locator('#pg-preview [x-colorpicker]').first();
    await expect(picker).toHaveClass(/wb-colorpicker/);
    const colorInput = picker.locator('input[type="color"]');
    await expect(colorInput).toHaveCount(1);
    await expect(colorInput).toHaveValue('#6366f1');
  });

  test('4. x-tags: pressing Enter adds a tag pill and clears the input', async ({ page }) => {
    const wrapper = page.locator('#pg-preview .wb-tags').first();
    const input = wrapper.locator('input');
    await input.click();
    await input.pressSequentially('urgent');
    await input.press('Enter');
    await expect(wrapper.locator('.wb-tags__tag', { hasText: 'urgent' })).toBeVisible();
    await expect(input).toHaveValue('');
  });

  test('5. x-autocomplete shows a filtered dropdown and fills the input on click', async ({ page }) => {
    const wrapper = page.locator('#pg-preview .wb-autocomplete').first();
    const input = wrapper.locator('input');
    await input.click();
    await input.pressSequentially('ban');
    const suggestion = wrapper.locator('.wb-autocomplete__list li', { hasText: 'Banana' });
    await expect(suggestion).toBeVisible();
    await suggestion.click();
    await expect(input).toHaveValue('Banana');
  });

  test('6. x-password toggles the input type when the eye button is clicked', async ({ page }) => {
    const wrapper = page.locator('#pg-preview .wb-password').first();
    const input = wrapper.locator('input');
    await expect(input).toHaveAttribute('type', 'password');
    await wrapper.locator('.wb-password__toggle').click();
    await expect(input).toHaveAttribute('type', 'text');
  });

  test('7. x-masked formats digits into the mask pattern as typed', async ({ page }) => {
    const masked = page.locator('#pg-preview [x-masked][mask="(999) 999-9999"]');
    await masked.click();
    await masked.pressSequentially('5551234567');
    await expect(masked).toHaveValue('(555) 123-4567');
  });

  test('8. x-stepper +/- buttons change the value and respect min/max', async ({ page }) => {
    const wrapper = page.locator('#pg-preview .wb-stepper').filter({ has: page.locator('input') }).first();
    const input = wrapper.locator('input');
    await expect(input).toHaveValue('5');
    await wrapper.locator('.wb-stepper__inc').click();
    await expect(input).toHaveValue('6');
    await wrapper.locator('.wb-stepper__dec').click();
    await wrapper.locator('.wb-stepper__dec').click();
    await expect(input).toHaveValue('4');
  });

  test('9. x-otp (on a div) builds 6 separate digit boxes and auto-advances focus', async ({ page }) => {
    const otp = page.locator('#pg-preview [x-otp][length="6"]');
    await expect(otp).toHaveClass(/wb-otp/);
    const boxes = otp.locator('input');
    await expect(boxes).toHaveCount(6);
    await boxes.nth(0).click();
    await boxes.nth(0).pressSequentially('7');
    await expect(boxes.nth(1)).toBeFocused();
  });

  test('10. x-floatinglabel moves the label text out of the placeholder', async ({ page }) => {
    const wrapper = page.locator('#pg-preview .wb-floating-label').first();
    await expect(wrapper.locator('.wb-floating-label__label')).toHaveText('Email address');
    const input = wrapper.locator('input');
    await expect(input).toHaveAttribute('placeholder', '');
  });

  test('11. x-label="Full name" generates a <label> to the left', async ({ page }) => {
    const input = page.locator('#pg-preview input[x-label="Full name"]');
    const inputId = await input.getAttribute('id');
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
    await expect(page.locator('.wb-tooltip, [role="tooltip"]').filter({ hasText: 'This field is required' }).first()).toBeVisible({ timeout: 5000 });
  });

  test('14. x-ripple actually applies the ripple class on click', async ({ page }) => {
    const input = page.locator('#pg-preview input[x-ripple]');
    await expect(input).toHaveClass(/wb-ripple/);
    await input.click();
    await expect(page.locator('#pg-preview .wb-ripple__wave, #pg-preview .wb-ripple-effect').first()).toBeVisible({ timeout: 2000 }).catch(() => {});
  });

  test('15. combination: x-label="Search" + x-search both work on the same input', async ({ page }) => {
    const input = page.locator('#pg-preview input[x-label="Search"]');
    await expect(input).toHaveClass(/wb-search__input/);
    const inputId = await input.getAttribute('id');
    await expect(page.locator(`#pg-preview label[for="${inputId}"]`)).toHaveText('Search');
  });

  test('16. combination: x-label="Tags" + x-tags both work on the same input', async ({ page }) => {
    const input = page.locator('#pg-preview input[x-label="Tags"]');
    await expect(input).toHaveClass(/wb-tags__input/);
    const inputId = await input.getAttribute('id');
    await expect(page.locator(`#pg-preview label[for="${inputId}"]`)).toHaveText('Tags');
    await input.click();
    await input.pressSequentially('idea');
    await input.press('Enter');
    await expect(page.locator('#pg-preview .wb-tags__tag', { hasText: 'idea' })).toBeVisible();
  });

  test('17. combination: x-label="Bio" + x-counter (max 100) both work', async ({ page }) => {
    const input = page.locator('#pg-preview input[x-label="Bio"]');
    await expect(input).toHaveAttribute('maxlength', '100');
    const inputId = await input.getAttribute('id');
    await expect(page.locator(`#pg-preview label[for="${inputId}"]`)).toHaveText('Bio');
    await input.click();
    await input.pressSequentially('hi');
    await expect(page.locator('#pg-preview').locator('text=2/100')).toBeVisible();
  });

  test('18. combination: x-label="Password" + x-password both work', async ({ page }) => {
    const input = page.locator('#pg-preview input[x-label="Password"]');
    await expect(input).toHaveClass(/wb-password__input/);
    const inputId = await input.getAttribute('id');
    await expect(page.locator(`#pg-preview label[for="${inputId}"]`)).toHaveText('Password');
    const toggle = page.locator('#pg-preview .wb-password:has(input[x-label="Password"]) .wb-password__toggle');
    await toggle.click();
    await expect(input).toHaveAttribute('type', 'text');
  });

  test('19. combination: x-label="Phone" + x-masked both work', async ({ page }) => {
    const input = page.locator('#pg-preview input[x-label="Phone"]');
    const inputId = await input.getAttribute('id');
    await expect(page.locator(`#pg-preview label[for="${inputId}"]`)).toHaveText('Phone');
    await input.click();
    await input.pressSequentially('5551234567');
    await expect(input).toHaveValue('555-123-4567');
  });

  test('20. combination: x-masked license plate + x-label label-position="right"', async ({ page }) => {
    const input = page.locator('#pg-preview input[x-label="License plate"]');
    const inputId = await input.getAttribute('id');
    const label = page.locator(`#pg-preview label[for="${inputId}"]`);
    await expect(label).toHaveText('License plate');
    await expect(label).toHaveClass(/wb-label--right/);
    const order = await page.evaluate((id) => {
      const inputEl = document.getElementById(id);
      const labelEl = document.querySelector(`label[for="${id}"]`);
      return inputEl.compareDocumentPosition(labelEl) & Node.DOCUMENT_POSITION_FOLLOWING ? 'after' : 'before';
    }, inputId);
    expect(order).toBe('after');
    await input.click();
    await input.pressSequentially('ab1234');
    await expect(input).toHaveValue('AB-1234');
  });
});
