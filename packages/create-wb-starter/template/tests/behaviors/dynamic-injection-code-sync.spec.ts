import { test, expect } from '@playwright/test';

/**
 * demos/autoinject.html's "11. Dynamic Injection" section: clicking "Add
 * New Checkbox" appends a real checkbox to the live DOM, but the Code panel
 * stayed a static, unrelated snippet — never reflecting what was actually
 * added. (#256, Standard §16: a demo shows a working demo AND its code —
 * for a live/dynamic demo, the code must stay in sync with what renders.)
 */
test('Add New Checkbox updates the Code panel to show the added markup (#256)', async ({ page }) => {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(String(e)));

  await page.goto('/demos/autoinject.html', { waitUntil: 'domcontentloaded' });
  const addBtn = page.locator('#add-btn');
  await addBtn.scrollIntoViewIfNeeded();

  // <wb-mdhtml> is lazily rendered via IntersectionObserver — wait for it
  // to finish before clicking, or the update below has no <code> element
  // to find yet.
  await expect(page.locator('#autoinject-mdhtml-dynamic')).toHaveClass(/wb-mdhtml--loaded/, { timeout: 10000 });

  const codeEl = page.locator('#autoinject-mdhtml-dynamic code');
  await addBtn.click();
  await expect(codeEl).toContainText('New Checkbox #1');

  // Each click adds — the panel accumulates, doesn't just overwrite the
  // previous entry, and stays in sync with the actual DOM.
  await addBtn.click();
  await expect(codeEl).toContainText('New Checkbox #1');
  await expect(codeEl).toContainText('New Checkbox #2');
  await expect(page.locator('#dynamic-area input[type="checkbox"]')).toHaveCount(2);

  expect(errs, 'no page errors while clicking Add New Checkbox').toEqual([]);
});
