import { test, expect } from '@playwright/test';

/**
 * REWRITTEN (#930). The previous version could not pass and its fixture taught
 * the wrong thing:
 *
 *  - It asserted `.x-input-wrapper` and `.x-switch__slider`. Neither is built
 *    by anything. input.js builds `.x-input__wrapper` (BEM double underscore);
 *    switch.js builds `.x-switch__track` + `.x-switch__thumb`.
 *    `.x-switch__slider` survives only in switch.css under a header reading
 *    "Legacy bare <input type=checkbox> + .x-switch__slider (back-compat)" --
 *    back-compat CSS for a structure the behavior stopped emitting. With no
 *    element and no rule, `.x-input-wrapper` computed `position: static`,
 *    which is what the failure reported.
 *
 *  - Its fixture wrote `<div x-input type="text">` and
 *    `<div x-switch type="checkbox">`, both UNCLOSED, so every later element
 *    nested inside them. `type=` is an <input> attribute and means nothing on
 *    a <div>.
 *
 * That fixture is #918 made concrete -- IntelliSense advertised
 * `<div x-input>` / `<div x-switch>` because both schemas still declare
 * `semanticElement.tagName: "div"`. Law 0 says otherwise, and so does the
 * behavior: switch.js:15 checks `host.tagName === 'INPUT' && host.type ===
 * 'checkbox'` first, so a real checkbox is the first-class host.
 */
test.describe('Input and Switch Behaviors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Input Test</title>
          <link rel="stylesheet" href="/src/styles/main.css">
        </head>
        <body>
          <!-- Semantic hosts: the element already means what the behavior enhances. -->
          <p><input type="text" x-input placeholder="Search..."></p>
          <p><input type="checkbox" x-switch id="switch1" label="Toggle Me"></p>

          <script type="module">
            import { WB } from '/src/index.js';
            window.WB = WB;
          </script>
        </body>
      </html>
    `);

    await page.waitForFunction(() => (window as any).WB, null, { timeout: 10000 });
    await page.evaluate(async () => { await (window as any).WB.scan(); });
  });

  test('input is enhanced and wrapped', async ({ page }) => {
    const input = page.locator('input[type="text"]');
    await expect(input).toHaveClass(/x-input/);

    // The wrapper the behavior actually builds (semantics/input.js:87).
    const wrapper = page.locator('.x-input__wrapper');
    await expect(wrapper).toHaveCount(1);
    await expect(wrapper).toBeVisible();
  });

  test('switch builds its track and thumb on a real checkbox', async ({ page }) => {
    const host = page.locator('[x-switch]');
    await expect(host).toHaveCount(1);

    // What switch.js:32/34 builds -- NOT `.x-switch__slider`, which nothing emits.
    // Structural, not visual: the track/thumb are styled decoration around a
    // visually-hidden checkbox, so assert they exist rather than that they paint.
    await expect(page.locator('.x-switch__track')).toHaveCount(1);
    await expect(page.locator('.x-switch__thumb')).toHaveCount(1);
  });

  test('label renders once, not once per scan (#930)', async ({ page }) => {
    // switch.js's label guard searched for a class containing the literal
    // "[x-switch]__label" -- brackets and all -- so it never matched and the
    // span was appended on every run. Scanning twice is the regression test.
    await page.evaluate(async () => { await (window as any).WB.scan(); });
    await expect(page.locator('.x-switch__label-end')).toHaveCount(1);
  });

  test('clicking toggles the underlying checkbox', async ({ page }) => {
    const checkbox = page.locator('#switch1');
    await expect(checkbox).not.toBeChecked();

    // Click the visible track; the checkbox itself is visually hidden.
    await page.locator('.x-switch__track').click();
    await expect(checkbox).toBeChecked();
  });
});
