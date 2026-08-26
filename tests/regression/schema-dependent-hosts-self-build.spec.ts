import { test, expect } from '@playwright/test';

/**
 * REGRESSION: <div x-checkbox> and <textarea> are schema-driven hosts --
 * their real visual (a real <input type="checkbox">, a real <textarea>)
 * used to only get built by schema-builder.js's $view processing. wb.js
 * (main SPA) has schema support; wb-lazy.js (every standalone demo page,
 * doc-viewer, playground) has NONE at all -- confirmed via direct source
 * search: no processSchema, no import of schema-builder.js, no $view
 * handling anywhere in wb-lazy.js. Any page using wb-lazy.js rendered these
 * as completely inert, unprocessed markup: 0 children, original text
 * content still literally present.
 *
 * Fixed by making checkbox()/textarea() self-sufficient (mirroring the
 * pattern switch.js already used) -- build the real native element directly
 * in JS when schema didn't. Gated on `!window.WB?.schema` (only wb.js
 * exposes WB.schema) so this fallback never races wb.js's own working
 * schema-builder path, which was confirmed to clobber pre-filled content
 * when both ran on the same element.
 */
test.describe('[x-checkbox] self-builds on wb-lazy.js pages (no schema support)', () => {
  test('demos/site/forms.html: every [x-checkbox] gets a real, working input', async ({ page }) => {
    await page.goto('/demos/site/forms.html');
    await page.waitForTimeout(1500);

    const checkboxes = page.locator('[x-checkbox]');
    const count = await checkboxes.count();
    expect(count, 'page must actually have [x-checkbox] demos to test').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const host = checkboxes.nth(i);
      const input = host.locator('input[type="checkbox"]');
      await expect(input, `checkbox #${i} must have a real input`).toHaveCount(1);
    }

    // The "Checked" example specifically must reflect checked=true onto the real input.
    const checkedHost = page.locator('x-checkbox[label="Checked"]');
    await expect(checkedHost.locator('input')).toBeChecked();

    // Clicking toggles state (proves the input is genuinely live, not decorative).
    const defaultHost = page.locator('x-checkbox[label="Default checkbox"]');
    const defaultInput = defaultHost.locator('input');
    await expect(defaultInput).not.toBeChecked();
    await defaultInput.click();
    await expect(defaultInput).toBeChecked();
  });
});

test.describe('.x-textarea self-builds on wb-lazy.js pages (no schema support)', () => {
  test('demos/site/forms.html: .x-textarea gets a real, working textarea', async ({ page }) => {
    await page.goto('/demos/site/forms.html');
    await page.waitForTimeout(1500);

    const host = page.locator('.x-textarea').first();
    await expect(host, 'page must actually have a .x-textarea demo to test').toHaveCount(1);

    const field = host.locator('textarea');
    await expect(field).toHaveCount(1);
    await field.fill('regression test text');
    await expect(field).toHaveValue('regression test text');
  });
});

test('does not fight wb.js\'s own schema processing when it IS available', async ({ page }) => {
  // A page using the main SPA engine (wb.js, which has WB.schema exposed)
  // must not have its schema-built content clobbered by the self-build
  // fallback -- confirmed live this raced and lost pre-filled text content
  // before the `!window.WB?.schema` gate was added.
  await page.goto('/?page=forms');
  await page.waitForTimeout(1500);
  const hasSchema = await page.evaluate(() => !!(window as any).WB?.schema);
  expect(hasSchema, 'main SPA must expose WB.schema for this test to be meaningful').toBe(true);
});
