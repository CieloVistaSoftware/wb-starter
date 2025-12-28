import { test, expect } from '@playwright/test';

test.describe('Card Product Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/card.html');
  });

  test('should dispatch wb:cardproduct:addtocart event on CTA click', async ({ page }) => {
    // Inject a product card if not present or use existing one
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <script src="/src/index.js" type="module"></script>
        <link rel="stylesheet" href="/src/styles/main.css">
      </head>
      <body>
        <article id="test-product" 
          data-behavior="cardproduct" 
          data-title="Test Product" 
          data-price="$99.99"
          data-cta="Add to Cart">
        </article>
      </body>
      </html>
    `);

    // Wait for hydration
    const card = page.locator('#test-product');
    await expect(card).toHaveAttribute('data-wb-ready', /cardproduct/);

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
    await card.locator('button.wb-card__product-cta').click();

    // Verify event detail
    const detail = await eventPromise;
    expect(detail).toEqual({
      title: 'Test Product',
      price: '$99.99',
      id: 'test-product'
    });
  });
});
