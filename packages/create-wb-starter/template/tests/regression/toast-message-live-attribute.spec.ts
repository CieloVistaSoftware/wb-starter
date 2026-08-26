import { test, expect } from '@playwright/test';

/**
 * #458 — src/wb-viewmodels/feedback.js's toast() behavior read
 * message/toast-variant/duration from the element's attributes ONCE at
 * bind time (captured into the showToast() closure) instead of at each
 * click. Any caller that mutates those attributes after the element's
 * first mount -- e.g. demos/frameworks.html's React counter, whose
 * `message` prop is `` `Count is now ${count + 1}` `` and gets re-rendered
 * onto the DOM `message` attribute after every click -- got a toast frozen
 * at whatever `message` happened to be on the very first render ("Count is
 * now 1"), no matter how many times the button was actually clicked.
 * Confirmed live: 6 clicks produced 6 stacked toasts that all read "Count
 * is now 1".
 *
 * Fix: showToast() now reads element.getAttribute('message') (and
 * toast-variant/duration) fresh on every click, instead of capturing them
 * once in variables outside the click closure. The `_wbToastInit` guard
 * (unchanged) still prevents double-binding the click listener -- only the
 * VALUES read on each fire are now live, not the binding itself.
 */
test.describe('x-toast reads live attribute values on every click, not just at bind time (#458)', () => {
  test('React counter button toast reflects the current count on each click', async ({ page }) => {
    await page.goto('/demos/frameworks.html', { waitUntil: 'domcontentloaded' });

    const button = page.locator('#react-root button');
    await expect(button).toBeVisible({ timeout: 15000 });

    const expected = ['Count is now 1', 'Count is now 2', 'Count is now 3'];
    for (const text of expected) {
      await button.click();
      const toasts = page.locator('.x-toast-container .x-toast');
      await expect(toasts.last(), `toast after clicking to reach "${text}"`).toHaveText(text, { timeout: 3000 });
    }

    // All three toasts are distinct -- none of them repeat the first
    // click's message, which is exactly the bug this test guards against
    // (before the fix, all three would read "Count is now 1").
    const allTexts = await page.locator('.x-toast-container .x-toast').allTextContents();
    expect(new Set(allTexts).size, 'each toast should show a distinct, current count').toBe(3);
  });

  test('a plain element re-reads message/variant fresh on every click, not just the first', async ({ page }) => {
    await page.goto('/demos/frameworks.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });

    // Build a fresh x-toast element and scan it -- same entry point any
    // framework's re-render would use -- then mutate its `message`
    // attribute between clicks (simulating a framework re-render updating
    // props) and confirm each toast reflects the CURRENT attribute value
    // at click time rather than whatever was read the first time.
    await page.evaluate(async () => {
      const el = document.createElement('button');
      el.setAttribute('x-toast', '');
      el.setAttribute('message', 'first');
      el.id = 'toast-live-attr-test';
      document.body.appendChild(el);
      await (window as any).WB.scan(document.body, { eager: true });
    });

    const el = page.locator('#toast-live-attr-test');
    await el.click();
    await expect(page.locator('.x-toast-container .x-toast').last()).toHaveText('first');

    await page.evaluate(() => {
      document.getElementById('toast-live-attr-test')!.setAttribute('message', 'second');
    });
    await el.click();
    await expect(page.locator('.x-toast-container .x-toast').last()).toHaveText('second');
  });
});
