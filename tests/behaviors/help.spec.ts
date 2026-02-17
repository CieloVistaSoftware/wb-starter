import { test, expect } from '@playwright/test';

/**
 * x-help Behavior Compliance Tests
 * - Applies wb-help class
 * - Sets role="note"
 * - Renders help text
 * - Accessible
 */

test.describe('x-help behavior', () => {
  test('applies wb-help class and role', async ({ page }) => {
    await page.goto('index.html');
    await page.evaluate(() => {
      const el = document.createElement('span');
      el.setAttribute('x-help', '');
      el.textContent = 'This is help text';
      document.body.appendChild(el);
      (window as any).WB.scan(el);
    });
    const help = page.locator('span[x-help]');
    await expect(help).toHaveClass(/wb-help/);
    await expect(help).toHaveAttribute('role', 'note');
    await expect(help).toHaveText('This is help text');
  });

  test('works with different help texts', async ({ page }) => {
    await page.goto('index.html');
    const texts = ['Short help', 'Longer help text for input', 'Help!'];
    for (const txt of texts) {
      await page.evaluate((t) => {
        const el = document.createElement('div');
        el.setAttribute('x-help', '');
        el.textContent = t;
        document.body.appendChild(el);
        (window as any).WB.scan(el);
      }, txt);
      const help = page.locator('div[x-help]', { hasText: txt });
      await expect(help).toHaveClass(/wb-help/);
      await expect(help).toHaveAttribute('role', 'note');
      await expect(help).toHaveText(txt);
      await help.evaluate((el) => el.remove());
    }
  });

  test('is accessible (role=note)', async ({ page }) => {
    await page.goto('index.html');
    await page.evaluate(() => {
      const el = document.createElement('span');
      el.setAttribute('x-help', '');
      el.textContent = 'Accessible help';
      document.body.appendChild(el);
      (window as any).WB.scan(el);
    });
    const help = page.locator('span[x-help]');
    await expect(help).toHaveAttribute('role', 'note');
  });
});
