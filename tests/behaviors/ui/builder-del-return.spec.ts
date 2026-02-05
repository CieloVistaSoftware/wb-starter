import { test, expect } from '@playwright/test';

test.describe('builder del() contract', () => {
  test('del returns true when element removed and false when missing', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    // ensure builder runtime is available
    await page.waitForTimeout(200);

    const result = await page.evaluate(() => {
      const id = 'test-del-contract-1';
      const el = document.createElement('div');
      el.id = id;
      document.body.appendChild(el);
      // call the function exposed on window
      const first = window.del ? window.del(id) : undefined;
      const second = window.del ? window.del(id) : undefined;
      return { first, second, existsAfter: !!document.getElementById(id) };
    });

    expect(result.first).toBe(true);
    expect(result.existsAfter).toBe(false);
    expect(result.second).toBe(false);
  });
});
