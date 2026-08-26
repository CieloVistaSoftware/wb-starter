import { test, expect } from '@playwright/test';

/**
 * demos/site/forms.html (the Form Controls category page, superseding the
 * now-retired demos/buttons.html — itself consolidated from
 * button-composition-demo.html + button-variants-demo.html +
 * button-variants-simple.html + button-variants-tags-demo.html per x-demo
 * standards). The hand-written "composition, not configuration" .x-compare
 * before/after code panels from the old button-composition-demo.html and
 * button-variants-tags-demo.html were dropped entirely rather than carried
 * over — they bypassed <div x-demo> for exactly the content <div x-demo> already
 * renders live + formats automatically, a real Standard §1 violation. The
 * one surviving hand-authored element, .x-behaviors (a plain descriptive
 * list, not a code sample), is still checked here.
 */
const URL = '/demos/site/forms.html';

test.describe('buttons demo: behavior list layout', () => {
  test('behavior tags render as a vertical list', async ({ page }) => {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    const list = page.locator('.x-behaviors');
    await expect(list).toBeVisible();
    const dir = await list.evaluate((el) => getComputedStyle(el).flexDirection);
    expect(dir, 'behavior tags should be listed vertically, one per line').toBe('column');
  });
});
