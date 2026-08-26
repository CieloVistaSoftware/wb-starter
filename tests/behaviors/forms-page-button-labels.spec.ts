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
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    await buttons.nth(i).scrollIntoViewIfNeeded();
  }
  await page.waitForTimeout(500);

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
