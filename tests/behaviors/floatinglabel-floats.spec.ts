import { test, expect, Page } from '../fixtures/offline';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * x-floatinglabel must actually FLOAT. floatinglabel.js toggled its --active
 * class correctly, but no stylesheet existed for .x-floating-label at all, so
 * the label sat under the field as plain text in every state -- a class
 * nothing read. These tests measure where the label is drawn, not which class
 * is set: resting inside the field, risen onto its top border while focused
 * or filled, and back inside once emptied and blurred.
 *
 * Both authoring forms are covered: on the field itself, and on a container
 * holding the field and its own <label> (the Behaviors page example).
 */

/** Label's vertical centre, relative to the field's box, as a fraction of its height. */
async function labelPosition(page: Page, fieldSel: string) {
  return page.evaluate((sel) => {
    const field = document.querySelector(sel) as HTMLElement;
    const label = field.parentElement!.querySelector('.x-floating-label__label') as HTMLElement;
    const f = field.getBoundingClientRect();
    const l = label.getBoundingClientRect();
    return {
      centre: ((l.top + l.bottom) / 2 - f.top) / f.height,
      fontSize: parseFloat(getComputedStyle(label).fontSize),
    };
  }, fieldSel);
}

const RESTING = (p: { centre: number }) => p.centre > 0.3 && p.centre < 0.7;   // inside the field
const RISEN = (p: { centre: number }) => Math.abs(p.centre) < 0.15;             // on the top border

const FORMS = [
  { name: 'on the field', html: '<input type="text" id="fl-a" x-floatinglabel label="Full name">', field: '#fl-a' },
  {
    name: 'on a container with its own label',
    html: '<div x-floatinglabel><input type="text" id="fl-b" placeholder=" "><label for="fl-b">Project name</label></div>',
    field: '#fl-b',
  },
];

for (const form of FORMS) {
  test.describe(`x-floatinglabel ${form.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await setupBehaviorTest(page);
      await setupTestContainer(page, form.html);
      await expect(page.locator(`${form.field} ~ .x-floating-label__label`)).toBeAttached();
    });

    test('the label rests inside the empty field, rises when focused, and returns on blur', async ({ page }) => {
      const field = page.locator(form.field);
      await expect.poll(async () => RESTING(await labelPosition(page, form.field)), {
        message: 'resting label must sit inside the empty field, like a placeholder',
      }).toBe(true);
      const rest = await labelPosition(page, form.field);

      await field.focus();
      await expect.poll(async () => RISEN(await labelPosition(page, form.field)), {
        message: 'focused: the label must rise onto the top border',
      }).toBe(true);
      expect((await labelPosition(page, form.field)).fontSize, 'the risen label is smaller').toBeLessThan(rest.fontSize);

      await field.blur();
      await expect.poll(async () => RESTING(await labelPosition(page, form.field)), {
        message: 'blurred while empty: the label must return inside the field',
      }).toBe(true);
    });

    test('a filled field keeps the label risen after blur, and an emptied one lets it fall back', async ({ page }) => {
      const field = page.locator(form.field);
      await field.fill('Apollo');
      await field.blur();
      await expect.poll(async () => RISEN(await labelPosition(page, form.field)), {
        message: 'filled: the label must stay above the value, not over it',
      }).toBe(true);

      await field.fill('');
      await field.blur();
      await expect.poll(async () => RESTING(await labelPosition(page, form.field)), {
        message: 'emptied and blurred: the label must return inside the field',
      }).toBe(true);
    });
  });
}
