/**
 * ═══════════════════════════════════════════════════════════════════════════
 * x-validator: submit focuses the first invalid field, and the options are
 * plain attributes (#1844)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Two defects in src/wb-viewmodels/validator.js:
 *
 *   1. errorClass defaulted to the literal '[x-error]'. That is not a class
 *      name: classList.add put a class called "[x-error]" on the field, and on
 *      submit querySelector(`.${errorClass}`) built '.[x-error]', an invalid
 *      selector, so the handler threw instead of focusing the first invalid
 *      field.
 *   2. The host's options were read only off element.dataset, and the fields
 *      checked were only the data- spelling of `validate`. The repo forbids
 *      data- attributes (no-data-attributes), so the markup the schema and
 *      docs teach -- `<input validate="required">`, `validateOn="input"` --
 *      did nothing: the form submitted with every rule broken.
 *
 * Each case below renders the documented markup through WB.scan, exactly as
 * a page would, and asserts what the reader sees.
 */

import { test, expect, Page } from '../fixtures/offline';
import { settlePage } from '../base';

async function render(page: Page, html: string, errors: string[]) {
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
  await page.evaluate(async (markup) => {
    const area = document.createElement('div');
    area.id = 'validator-area';
    area.innerHTML = markup;
    document.body.appendChild(area);
    // A submit that gets past the validator must not navigate the harness away;
    // it is counted, so the test can tell a blocked submit from an allowed one.
    (window as any).__submits = 0;
    document.addEventListener('submit', (e) => { (window as any).__submits++; e.preventDefault(); });
    await (window as any).WB.scan(area, { eager: true });
  }, html);
  await settlePage(page, { timeout: 10000 });
}

test.describe('x-validator (#1844)', () => {
  test('submit with the default error class does not throw and focuses the first invalid field', async ({ page }) => {
    const errors: string[] = [];
    await render(page, `
      <form id="f" x-validator>
        <input id="name" name="name" validate="required" value="Ada">
        <input id="email" name="email" validate="required email" value="not-an-email">
        <input id="age" name="age" validate="required number">
        <button id="send" type="submit">Send</button>
      </form>`, errors);

    await page.click('#send');

    expect(errors, 'submitting must not throw').toEqual([]);
    expect(await page.evaluate(() => (window as any).__submits), 'an invalid form must not submit').toBe(0);
    // The first FAILING field, not the first field: #name passes.
    await expect(page.locator('#email')).toBeFocused();

    const state = await page.evaluate(() => {
      const field = document.getElementById('email')!;
      const cls = Array.from(field.classList);
      // Every class the validator put on the field must be usable as a selector.
      const selectable = cls.every((c) => { try { document.querySelector('.' + c); return true; } catch { return false; } });
      // What validator.css's rule resolves to on this page, token and all.
      const probe = document.createElement('span');
      probe.style.borderTopColor = 'var(--danger-color, #ef4444)';
      document.body.appendChild(probe);
      const danger = getComputedStyle(probe).borderTopColor;
      probe.remove();
      return { cls, selectable, invalid: field.getAttribute('aria-invalid'), border: getComputedStyle(field).borderTopColor, danger };
    });
    expect(state.cls).toContain('x-validator__field--invalid');
    expect(state.selectable, `field classes ${state.cls.join(' ')} must all be valid class names`).toBe(true);
    expect(state.invalid).toBe('true');
    // The default error class is styled (validator.css), so the state shows.
    expect(state.border).toBe(state.danger);
    await expect(page.locator('#email + .x-validator__error')).toHaveText('Invalid email address');

    // Fixing every field lets the submit through.
    await page.fill('#email', 'ada@example.com');
    await page.fill('#age', '36');
    await page.click('#send');
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => (window as any).__submits), 'a valid form submits').toBe(1);
    await expect(page.locator('#email')).toHaveClass(/x-validator__field--valid/);
  });

  test('host options are read from plain attributes (camelCase and dashed)', async ({ page }) => {
    const errors: string[] = [];
    await render(page, `
      <form id="camel" x-validator validateOn="input" showErrors="false" errorClass="is-bad" successClass="is-good">
        <input id="c" name="c" validate="required minLength:3">
      </form>
      <form id="dashed" x-validator validate-on="input" show-errors="false" error-class="is-bad" success-class="is-good">
        <input id="d" name="d" validate="required minLength:3">
      </form>`, errors);

    for (const id of ['#c', '#d']) {
      // validateOn="input": typing checks the field, no blur needed.
      await page.locator(id).pressSequentially('ab');
      await expect(page.locator(id), `${id}: errorClass applied on input`).toHaveClass(/\bis-bad\b/);
      await expect(page.locator(id)).toHaveAttribute('aria-invalid', 'true');
      // showErrors="false": marked, but no message.
      await expect(page.locator(`${id} + .x-validator__error`), `${id}: showErrors=false shows no message`).toHaveCount(0);

      await page.locator(id).pressSequentially('c');
      await expect(page.locator(id), `${id}: successClass applied once valid`).toHaveClass(/\bis-good\b/);
      await expect(page.locator(id)).not.toHaveClass(/\bis-bad\b/);
    }
    expect(errors).toEqual([]);
  });

  test('fields are found by their plain validate attribute', async ({ page }) => {
    const errors: string[] = [];
    await render(page, `
      <form id="f" x-validator>
        <input id="pw" name="pw" validate="required minLength:8">
        <input id="pw2" name="pw2" validate="match:pw">
        <input id="free" name="free">
      </form>`, errors);

    const first = await page.evaluate(() => (document.getElementById('f') as any).wbValidator.validate());
    expect(first, 'an empty required field fails validate()').toBe(false);
    await expect(page.locator('#pw')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#pw + .x-validator__error')).toHaveText('This field is required');
    // A field with no validate attribute is not checked.
    await expect(page.locator('#free')).not.toHaveAttribute('aria-invalid');

    // Default validateOn is blur: leaving the field re-checks it.
    await page.fill('#pw', 'longenough');
    await page.locator('#pw').blur();
    await expect(page.locator('#pw')).not.toHaveAttribute('aria-invalid');

    await page.fill('#pw2', 'longenough');
    const second = await page.evaluate(() => (document.getElementById('f') as any).wbValidator.validate());
    expect(second, 'every rule passing makes validate() true').toBe(true);
    expect(errors).toEqual([]);
  });
});
