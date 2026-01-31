import { test, expect } from '@playwright/test';

test.describe('Runtime hydration markers', () => {
  test('wb-mdhtml sets hydration marker when present', async ({ page }) => {
    await page.goto('http://localhost:3000/pages/components.html');
    const md = page.locator('wb-mdhtml').first();
    const count = await md.count();
    test.skip(count === 0, 'wb-mdhtml example not present');
    // Wait for wb-mdhtml to report hydrated (fallback to class removal)
    await page.waitForFunction(sel => {
      const el = document.querySelector(sel);
      return !!el && (el.dataset.wbHydrated === '1' || !el.classList.contains('wb-mdhtml--loading'));
    }, 'wb-mdhtml', { timeout: 5000 });
    const hydrated = await md.evaluate(el => el.dataset.wbHydrated === '1' || !el.classList.contains('wb-mdhtml--loading'));
    expect(hydrated).toBe(true);
  });

  test('wb-cardstats marks hydrated when present', async ({ page }) => {
    await page.goto('http://localhost:3000/pages/components.html');
    const stats = page.locator('wb-cardstats').first();
    const count = await stats.count();
    test.skip(count === 0, 'wb-cardstats example not present');
    await page.waitForFunction(sel => {
      const el = document.querySelector(sel);
      return !!el && (el.dataset.wbHydrated === '1' || el.classList.contains('wb-stats'));
    }, 'wb-cardstats', { timeout: 4000 });
    const hydrated = await stats.evaluate(el => el.dataset.wbHydrated === '1' || el.classList.contains('wb-stats'));
    expect(hydrated).toBe(true);
  });
});
