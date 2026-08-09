import { test, expect } from '@playwright/test';

/**
 * search() (search.js) dispatched native-named 'focus'/'blur'/'input'
 * CustomEvents from INSIDE the element's own onfocus/onblur/oninput
 * handlers -- e.g. `element.onfocus = () => element.dispatchEvent(new
 * CustomEvent('focus', ...))`. Dispatching that SAME event type from
 * within its own handler re-triggers the handler again, forever: an
 * uncaught RangeError ("Maximum call stack size exceeded") the instant a
 * real user clicked into (focus/blur) or typed in (input) any x-search
 * input -- confirmed live via console errors, hundreds of recursive
 * onfocus/onblur/oninput frames. Fixed by renaming the focus/blur
 * broadcasts to namespaced wb:search:focus/wb:search:blur events, and by
 * only re-dispatching a synthetic 'input' event for PROGRAMMATIC callers
 * (setValue()/search() API methods) -- never from inside real typing's own
 * oninput handler, which already got a real 'input' event to reach there.
 */
test.describe('x-search focus/blur/input do not recurse (Behaviors page)', () => {
  test('focusing, typing, and blurring an x-search input never throws', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('http://localhost:3000/?page=behaviors');
    const input = page.locator('input[x-search]').first();
    await expect(input).toHaveClass(/wb-search__input/, { timeout: 10_000 });

    await input.click();
    await input.fill('hello world');
    await page.locator('body').click({ position: { x: 5, y: 5 } }); // blur via clicking elsewhere

    expect(pageErrors).toEqual([]);
    await expect(input).toHaveValue('hello world');
  });
});
