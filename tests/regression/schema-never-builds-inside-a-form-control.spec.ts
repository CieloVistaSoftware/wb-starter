import { test, expect } from '../fixtures/offline';
import { injectAndScan } from '../helpers/inject-and-scan';

/**
 * THE SCHEMA BUILD LEAVES A FORM CONTROL'S OWN CONTENT ALONE (#1720)
 * ================================================================
 * buildStructure() wiped every host and appended its schema's $view into it.
 * A native <textarea x-textarea> lost the text written inside it (its value)
 * and got a label, a second textarea and a counter as children; an
 * <input x-input> got three hidden children that innerHTML cannot even show,
 * because input is a void element. The behaviors treat a form-control host as
 * the field itself and wrap it, so those children were only junk.
 *
 * See it by hand: on /demos/test-harness.html run
 * `WB.scan(Object.assign(document.body.appendChild(document.createElement('div')), {innerHTML: '<textarea x-textarea>hi</textarea>'}))`
 * and read the textarea's value. Before: "" and 2 children. Now: "hi", none.
 */

test.describe('schema build and form-control hosts (#1720)', () => {
  test('a textarea keeps its authored text and gets no children', async ({ page }) => {
    await injectAndScan(page, '<div id="host"><textarea x-textarea show-count maxlength="40" id="ta">hello world</textarea></div>');
    const ta = page.locator('#ta');
    await expect(ta).toHaveValue('hello world');
    expect(await ta.evaluate((el) => [...el.children].map((c) => c.outerHTML))).toEqual([]);
    // One counter, the one the behavior builds next to the field.
    await expect(page.locator('#host .x-textarea__counter')).toHaveCount(1);
  });

  for (const html of [
    '<input x-input id="fc" value="v">',
    '<input x-search id="fc">',
    '<select x-select id="fc"><option>a</option></select>',
  ]) {
    test(`${html} gets no schema-built children`, async ({ page }) => {
      await injectAndScan(page, `<div id="host">${html}</div>`);
      const fc = page.locator('#fc');
      await expect(fc).toHaveAttribute('x-ready', '');
      // A <select>'s own <option>s are its content, not schema output.
      expect(await fc.evaluate((el) => [...el.children].filter((c) => c.tagName !== 'OPTION').map((c) => c.outerHTML))).toEqual([]);
    });
  }
});
