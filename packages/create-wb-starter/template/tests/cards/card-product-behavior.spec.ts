import { test, expect } from '@playwright/test';

/**
 * Card Product Behavior
 * Tests x-cardproduct CTA click dispatches event.
 */

test.describe('Card Product Behavior', () => {

  test('should dispatch wb:cardproduct:addtocart event on CTA click', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="en" data-theme="dark">
      <head>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="/src/styles/themes.css">
        <link rel="stylesheet" href="/src/styles/site.css">
      </head>
      <body>
        <div x-cardproduct id="test-product"
          title="Test Product"
          price="$99.99"
          cta="Add to Cart">
        </div>
        <script type="module">
          import WB from '/src/core/wb-lazy.js';
          window.WB = WB;
          await WB.init({ autoInject: true });
          window.wbReady = true;
        </script>
      </body>
      </html>
    `, { waitUntil: 'networkidle' });

    await page.waitForFunction(() => (window as any).wbReady === true, { timeout: 10000 });
    await page.waitForTimeout(300);

    const card = page.locator('#test-product');
    await expect(card).toBeVisible();
    await expect(card).toHaveClass(/x-card/);

    // Setup event listener
    const eventPromise = page.evaluate(() => {
      return new Promise(resolve => {
        const el = document.querySelector('#test-product');
        if (el) {
          el.addEventListener('wb:cardproduct:addtocart', (e) => {
            resolve((e as CustomEvent).detail);
          });
        }
      });
    });

    // Click the CTA button
    const ctaBtn = card.locator('.x-card__product-cta');
    await expect(ctaBtn).toBeVisible();
    await expect(ctaBtn).toHaveAttribute('type', 'button');
    await ctaBtn.click();

    // Verify event detail
    const detail = await eventPromise;
    expect(detail).toEqual({
      title: 'Test Product',
      price: '$99.99',
      id: 'test-product'
    });

    const keyboardDetail = page.evaluate(() => new Promise(resolve => {
      document.querySelector('#test-product')?.addEventListener('wb:cardproduct:addtocart', (e) => {
        resolve((e as CustomEvent).detail);
      }, { once: true });
    }));
    await ctaBtn.press('Enter');
    expect(await keyboardDetail).toEqual({
      title: 'Test Product',
      price: '$99.99',
      id: 'test-product'
    });

    const apiDetail = page.evaluate(() => new Promise(resolve => {
      const card = document.querySelector('#test-product') as HTMLElement & {
        wbCardProduct?: { addToCart: () => unknown };
      };
      card.addEventListener('wb:cardproduct:addtocart', (e) => {
        resolve((e as CustomEvent).detail);
      }, { once: true });
      card.wbCardProduct?.addToCart();
    }));
    expect(await apiDetail).toEqual({
      title: 'Test Product',
      price: '$99.99',
      id: 'test-product'
    });
  });
});

declare global {
  interface Window {
    wbReady: boolean;
    WB: any;
  }
}
