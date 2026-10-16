import { test, expect } from '../fixtures/offline';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * label= on a select or textarea gives a real label, 1rem before the field.
 *
 * John, 2026-10-15, on the Behaviors docs: the textarea's label="Message"
 * showed "no label here", and the select's label="Country" sat flush against
 * the field: "Label doesn't fit our layout, which is a 1rem gap at the end of
 * the label." Both schemas declare `label`. textarea.js never read it, and
 * select.js built a <label class="x-select__label"> that no rule styled. Both
 * now use the shared label behavior (.x-label__group, gap 1rem).
 */
const CASES = [
  ['native select', `<select label="Country"><option value="us">United States</option><option value="uk">United Kingdom</option></select>`, 'Country', 'select'],
  ['select host', `<div x-select label="Country" options='[{"value":"us","label":"United States"},{"value":"uk","label":"United Kingdom"}]'></div>`, 'Country', 'select'],
  ['textarea host', `<div x-textarea label="Message" placeholder="Enter your message..."></div>`, 'Message', 'textarea'],
  ['bare textarea', `<textarea label="Message" placeholder="Enter your message..."></textarea>`, 'Message', 'textarea'],
] as const;

test.describe('label= gives a label with a 1rem gap before the field', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  for (const [name, html, text, field] of CASES) {
    test(name, async ({ page }) => {
      const el = await setupTestContainer(page, html);
      const label = page.locator('#test-container label.x-label');
      await expect(label, 'a real <label> is built').toHaveText(text);
      const control = page.locator(`#test-container ${field}`).first();
      const id = await control.getAttribute('id');
      await expect(label, 'the label names its field').toHaveAttribute('for', id!);

      const gap = await page.evaluate(([f]) => {
        const l = document.querySelector('#test-container label.x-label')!.getBoundingClientRect();
        const c = document.querySelector(`#test-container ${f}`)!.getBoundingClientRect();
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
        return { gap: c.left - l.right, rem };
      }, [field]);
      expect(Math.abs(gap.gap - gap.rem), `label-to-field gap is ${gap.gap}px, 1rem is ${gap.rem}px`).toBeLessThanOrEqual(1);
      void el;
    });
  }
});
