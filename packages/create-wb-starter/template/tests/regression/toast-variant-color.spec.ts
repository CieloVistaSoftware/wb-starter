import { test, expect } from '@playwright/test';

/**
 * Regression: pages/behaviors.html, pages/newbehaviors.html,
 * pages/components.html, demos/buttons.html, demos/feedback-demo.html, and
 * demos/frameworks.html all triggered toasts via `type="success"` (or, in
 * frameworks.html's React-prop object, `'type': 'info'`) -- but
 * feedback.js's toast() never reads `type` at all. Its real, documented
 * read order is `options.variant || data-type || toast-variant ||
 * variant || 'info'` (deliberately named `toast-variant` to avoid
 * colliding with the trigger element's OWN `variant` attribute, e.g. a
 * `<button variant="primary">`). With `type=` set and no `toast-variant`,
 * every one of these toasts silently fell through to reading the button's
 * own `variant` (often "primary", sometimes coincidentally matching) --
 * every Info/Success/Warning/Error toast on pages/behaviors.html rendered
 * identically. Confirmed live via click + computed background-color before
 * the fix: all four showed the same color. Fixed by changing every
 * `type="X"` toast trigger to `toast-variant="X"`.
 */
test.describe('Toast variant coloring (Behaviors page)', () => {
  test('each Toast Notifications button fires a distinctly-colored toast matching its label', async ({ page }) => {
    await page.goto('/?page=behaviors');

    const heading = page.locator('h3', { hasText: 'Toast Notifications' });
    await heading.scrollIntoViewIfNeeded();

    const cases: Array<[string, string]> = [
      ['Info Toast', 'wb-toast--info'],
      ['Success Toast', 'wb-toast--success'],
      ['Warning Toast', 'wb-toast--warning'],
      ['Error Toast', 'wb-toast--error'],
    ];

    for (const [label, expectedClass] of cases) {
      await page.locator('button', { hasText: label }).click();
      const toasts = page.locator('.wb-toast-container .wb-toast');
      const last = toasts.last();
      await expect(last).toHaveClass(new RegExp(expectedClass));
      // Clear it so the next iteration's "last toast" isn't ambiguous.
      await page.evaluate(() => document.querySelectorAll('.wb-toast-container .wb-toast').forEach(el => el.remove()));
    }
  });
});
