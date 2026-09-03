import { test, expect } from '@playwright/test';

/**
 * demos/site/forms.html's Button gallery had 30 <button> elements —
 * 11 used the unsupported label="..." attribute (button.js only reads text
 * content, per its own header comment), and 19 more were completely empty
 * (no text, no label). All rendered as invisible/blank buttons. (Found
 * while investigating #244.)
 */
test('all .x-button elements in the Button gallery render visible content', async ({ page }) => {
  await page.goto('/demos/site/forms.html', { waitUntil: 'domcontentloaded' });

  // <div x-demo> lazily builds blocks via IntersectionObserver past the first
  // few — scroll everything into view before checking.
  const buttons = page.locator('.x-button');
  // .count() does NOT retry. Called straight after goto(domcontentloaded) it
  // returned 0 before injection had added any .x-button class, so the scroll
  // loop never ran, nothing lazily built, and the evaluate below also saw 0 —
  // the failure was self-fulfilling. Verified live: this page has 73 buttons
  // ~1.5s in, 77 after scrolling, and zero blank ones, so the assertion intent
  // holds. Wait for the first one to exist before counting.
  await expect(buttons.first()).toBeAttached({ timeout: 15000 });
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    await buttons.nth(i).scrollIntoViewIfNeeded();
  }
  // Scrolling builds more lazily; wait for the count to stop growing rather
  // than sleeping for a guessed 500ms.
  await expect.poll(() => buttons.count(), { timeout: 15000 }).toBeGreaterThanOrEqual(count);

  const results = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.x-button')).map((b) => ({
      text: (b.textContent || '').trim(),
      hasIcon: !!b.querySelector('.x-button__icon'),
      width: b.getBoundingClientRect().width,
    }))
  );

  expect(results.length).toBeGreaterThan(0);
  for (const r of results) {
    // Every button demonstrates something visible: real text, or (for the
    // icon-only case) a rendered icon.
    expect(r.text !== '' || r.hasIcon, `button should show text or an icon: ${JSON.stringify(r)}`).toBe(true);
    expect(r.width, `button should have real rendered width: ${JSON.stringify(r)}`).toBeGreaterThan(0);
  }
});
