import { test, expect } from '@playwright/test';

test.describe('x-label behavior', () => {
  test('applies wb-label class', async ({ page }) => {
    await page.goto('index.html');
    await page.evaluate(() => {
      const el = document.createElement('label');
      el.setAttribute('x-label', '');
      el.textContent = 'Label';
      el.id = 'test-label';
      document.body.appendChild(el);
      (window as any).WB.scan(el);
    });
    const label = page.locator('#test-label');
    await expect(label).toHaveClass(/wb-label/);
  });

  test('required state applies wb-label--required', async ({ page }) => {
    await page.goto('index.html');
    await page.evaluate(() => {
      const el = document.createElement('label');
      el.setAttribute('x-label', '');
      el.setAttribute('required', '');
      el.textContent = 'Label';
      el.id = 'test-label';
      document.body.appendChild(el);
      (window as any).WB.scan(el);
    });
    const label = page.locator('#test-label');
    await expect(label).toHaveClass(/wb-label--required/);
  });

  test('optional state applies wb-label--optional', async ({ page }) => {
    await page.goto('index.html');
    await page.evaluate(() => {
      const el = document.createElement('label');
      el.setAttribute('x-label', '');
      el.setAttribute('optional', '');
      el.textContent = 'Label';
      el.id = 'test-label';
      document.body.appendChild(el);
      (window as any).WB.scan(el);
    });
    const label = page.locator('#test-label');
    await expect(label).toHaveClass(/wb-label--optional/);
  });
});
