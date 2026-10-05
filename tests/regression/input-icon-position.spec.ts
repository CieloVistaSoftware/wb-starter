import { test, expect } from '../fixtures/offline';

/**
 * #793 -- iconPosition renders no icon, and says nothing.
 *
 * The Behaviors page writes the schema key, `iconPosition="end"`, which lands
 * in the DOM as `iconposition`. The `<div x-input>` builder read only
 * `icon-position`, so the position never arrived and the icon always sat at
 * the start. And a position with NO icon rendered nothing and reported
 * nothing -- John: "This should be a runtime error. No Icon".
 *
 * The behavior is called directly on detached-then-attached hosts, so the
 * result does not depend on the page's scan timing.
 */
test.describe('input iconPosition (#793)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('the camelCase spelling the Behaviors page writes moves the icon to the end', async ({ page }) => {
    const order = await page.evaluate(async () => {
      const { input } = await import('/src/wb-viewmodels/semantics/input.js');
      const host = document.createElement('div');
      host.setAttribute('icon', '★');
      host.setAttribute('iconPosition', 'end');   // lands as `iconposition`
      document.body.appendChild(host);
      input(host);
      const wrapper = host.querySelector('.x-input__wrapper');
      return wrapper ? [...wrapper.children].map((c) => (c.matches('input') ? 'field' : c.textContent)) : null;
    });
    expect(order, 'the icon must follow the field when iconPosition is end').toEqual(['field', '★']);
  });

  for (const [label, markup] of [
    ['a <div> host', '<div iconPosition="start"></div>'],
    ['a native <input>', '<input iconPosition="end">'],
  ] as const) {
    test(`iconPosition with no icon is a runtime error on ${label}`, async ({ page }) => {
      const result = await page.evaluate(async (html) => {
        document.documentElement.setAttribute('data-x-expected-errors', '');
        // Same module URL input.js imports, so this is the logger it calls.
        const { getErrors } = await import('/src/core/error-logger.js');
        const { input } = await import('/src/wb-viewmodels/semantics/input.js');
        const holder = document.createElement('div');
        holder.innerHTML = html;
        const host = holder.firstElementChild as HTMLElement;
        document.body.appendChild(holder);
        input(host);
        return { marker: host.getAttribute('x-error'), heard: getErrors().map((e: any) => String(e.message)) };
      }, markup);

      expect(result.marker, 'the host must carry an x-error marker').toBe('icon-position-without-icon');
      expect(result.heard.some((m) => /iconPosition but has no icon/.test(m)), 'logError() must report it').toBe(true);
    });
  }

  test('an icon with no iconPosition is not an error', async ({ page }) => {
    const marker = await page.evaluate(async () => {
      const { input } = await import('/src/wb-viewmodels/semantics/input.js');
      const host = document.createElement('div');
      host.setAttribute('icon', '★');
      document.body.appendChild(host);
      input(host);
      return host.getAttribute('x-error');
    });
    expect(marker).toBeNull();
  });
});
