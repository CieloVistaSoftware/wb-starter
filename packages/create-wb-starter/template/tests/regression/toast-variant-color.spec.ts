import { test, expect } from '../fixtures/offline';

/**
 * Regression: pages/behaviors.html, pages/newbehaviors.html,
 * pages/behaviors.html, demos/buttons.html, demos/feedback-demo.html, and
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
/*
 * The Behaviors page no longer has a "Toast Notifications" section of fixed
 * buttons: it is a catalogue (#666) where each toast variant is a row under
 * the x-toast group, and picking a row renders the catalogue example with that
 * variant applied. The test drives the page that way now. Doing so found a
 * real defect: the row wrote its value to the example button's own `variant`
 * instead of its `toast-variant`, so every row fired the same success toast
 * (fixed in pages/behaviors.html's withOption()).
 */
test.describe('Toast variant coloring (Behaviors page)', () => {
  test('each Toast Notifications button fires a distinctly-colored toast matching its label', async ({ page }) => {
    await page.goto('/?page=behaviors');
    await expect(page.locator('.behaviors-search-results__row').first()).toBeVisible({ timeout: 25000 });
    // A query opens the collapsed x-toast group (#995) so its rows can be picked.
    await page.locator('#behaviors-search').fill('x-toast');

    const cases = ['info', 'success', 'warning', 'error'];
    for (const variant of cases) {
      const row = page.locator(`.behaviors-search-results__row[data-browse-token="x-toast"][data-variant="${variant}"]`).first();
      await row.scrollIntoViewIfNeeded();
      await row.click();

      const trigger = page.locator(`#behaviors-live [x-toast][toast-variant="${variant}"]`).first();
      await trigger.scrollIntoViewIfNeeded();
      await expect(trigger).toHaveAttribute('x-ready', '', { timeout: 10000 });
      // Picking the row raised its own site-wide click confirmation (#456);
      // clear it so the only toast left is the one the trigger fires.
      await page.evaluate(() => document.querySelectorAll('.x-toast-container .x-toast').forEach((el) => el.remove()));

      await trigger.click();
      const toasts = page.locator('.x-toast-container .x-toast');
      await expect(toasts).toHaveCount(1);
      await expect(toasts.first()).toHaveClass(new RegExp(`x-toast--${variant}\\b`));
      await page.evaluate(() => document.querySelectorAll('.x-toast-container .x-toast').forEach((el) => el.remove()));
    }
  });
});
