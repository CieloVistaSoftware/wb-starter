import { test, expect } from '@playwright/test';

test.describe('x-label behavior (value on a form control)', () => {
  test('x-label="text" on an <input> generates an associated <label> with that text', async ({ page }) => {
    await page.goto('index.html');
    await page.evaluate(() => {
      const el = document.createElement('input');
      el.setAttribute('x-label', 'Label for input:');
      el.id = 'test-input';
      document.body.appendChild(el);
      (window as any).WB.scan(el);
    });
    const input = page.locator('#test-input');
    const label = page.locator(`label[for="test-input"]`);
    await expect(label).toHaveText('Label for input:');
    await expect(label).toHaveClass(/wb-label/);
    // The label renders before the control (to its left), not after it.
    const order = await page.evaluate(() => {
      const input = document.getElementById('test-input')!;
      const label = document.querySelector('label[for="test-input"]')!;
      return input.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING ? 'after' : 'before';
    });
    expect(order).toBe('before');
    void input;
  });

  test('x-label="text" + required generates wb-label--required on the new <label>', async ({ page }) => {
    await page.goto('index.html');
    await page.evaluate(() => {
      const el = document.createElement('input');
      el.setAttribute('x-label', 'Name:');
      el.setAttribute('required', '');
      el.id = 'test-input-req';
      document.body.appendChild(el);
      (window as any).WB.scan(el);
    });
    const label = page.locator(`label[for="test-input-req"]`);
    await expect(label).toHaveClass(/wb-label--required/);
  });

  test('label-position="right" puts the <label> after the control, with wb-label--right', async ({ page }) => {
    await page.goto('index.html');
    await page.evaluate(() => {
      const el = document.createElement('input');
      el.setAttribute('x-label', 'שם מלא');
      el.setAttribute('label-position', 'right');
      el.id = 'test-input-rtl';
      document.body.appendChild(el);
      (window as any).WB.scan(el);
    });
    const label = page.locator(`label[for="test-input-rtl"]`);
    await expect(label).toHaveClass(/wb-label--right/);
    const order = await page.evaluate(() => {
      const input = document.getElementById('test-input-rtl')!;
      const label = document.querySelector('label[for="test-input-rtl"]')!;
      return input.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING ? 'after' : 'before';
    });
    expect(order).toBe('after');
  });
});

test.describe('x-label behavior (legacy: bare attribute on a <label>)', () => {
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
