/**
 * ADD TO CART IS REMEMBERED (#463)
 * ================================
 * John: "we need to support add to cart clicks." x-cardproduct's Add to Cart
 * fired `wb:cardproduct:addtocart` and nothing listened, so every click was
 * forgotten the moment it happened.
 *
 * x-cart is the listener: clicks accumulate, the count shows, the list can be
 * opened and changed, and it all survives a reload. These run against the
 * real shop page (demos/site/shop-now.html) and against a page with two
 * carts, which must not each add the same click.
 *
 * See it by hand: open /demos/site/shop-now.html, click Add to Cart on the
 * tee twice and on the hat once, open the cart, reload.
 * Before: nothing kept the clicks. Now: 3 items, the tee at x 2, $96.00,
 * still there after the reload.
 */
import { test, expect, type Page } from '../fixtures/offline';

const SHOP = '/demos/site/shop-now.html';

async function addToCart(page: Page, title: string) {
  await page.locator('[x-cardproduct]', { hasText: title }).locator('.x-card__product-cta').click();
}

async function openShop(page: Page) {
  await page.goto(SHOP);
  await expect(page.locator('[x-cart]')).toHaveAttribute('x-ready', '', { timeout: 15_000 });
  await expect(page.locator('[x-cardproduct] .x-card__product-cta')).toHaveCount(3, { timeout: 15_000 });
}

test.describe('x-cart remembers Add to Cart (#463)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/fixtures/blank.html');
    await page.evaluate(() => localStorage.clear());
  });

  test('clicks accumulate, the same product counts up, and the total adds up', async ({ page }) => {
    await openShop(page);
    const cart = page.locator('[x-cart]');
    await expect(cart.locator('.x-cart__count')).toHaveText('0');

    await addToCart(page, 'Bold Print Tee');
    await addToCart(page, 'Bold Print Tee');
    await addToCart(page, 'Wide Brim Hat');

    await expect(cart.locator('.x-cart__count')).toHaveText('3');
    await cart.locator('.x-cart__summary').click();
    const rows = cart.locator('.x-cart__item');
    await expect(rows).toHaveCount(2);
    await expect(rows.filter({ hasText: 'Bold Print Tee' }).locator('.x-cart__item-qty')).toHaveText('× 2');
    await expect(cart.locator('.x-cart__total')).toHaveText('$96.00'); // 2 x $34 + $28
  });

  test('the cart survives a reload', async ({ page }) => {
    await openShop(page);
    await addToCart(page, 'Linen Shorts');
    await addToCart(page, 'Wide Brim Hat');
    await expect(page.locator('[x-cart] .x-cart__count')).toHaveText('2');

    await openShop(page);
    await expect(page.locator('[x-cart] .x-cart__count')).toHaveText('2');
    await page.locator('[x-cart] .x-cart__summary').click();
    await expect(page.locator('[x-cart] .x-cart__item-title')).toHaveText(['Linen Shorts', 'Wide Brim Hat']);
  });

  test('remove takes one product out, and Clear empties the cart', async ({ page }) => {
    await openShop(page);
    await addToCart(page, 'Bold Print Tee');
    await addToCart(page, 'Linen Shorts');
    const cart = page.locator('[x-cart]');
    await cart.locator('.x-cart__summary').click();

    await cart.getByRole('button', { name: 'Remove Bold Print Tee' }).click();
    await expect(cart.locator('.x-cart__count')).toHaveText('1');
    await expect(cart.locator('.x-cart__item-title')).toHaveText(['Linen Shorts']);

    await cart.getByRole('button', { name: 'Clear' }).click();
    await expect(cart.locator('.x-cart__count')).toHaveText('0');
    await expect(cart.locator('.x-cart__empty')).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('wb-cart') || 'null'))).toEqual([]);
  });

  test('two carts on one page show the same contents and do not each add the click', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="en" data-theme="dark">
      <head>
        <link rel="stylesheet" href="/src/styles/themes.css">
        <link rel="stylesheet" href="/src/styles/site.css">
      </head>
      <body>
        <div x-cart id="cart-a"></div>
        <div x-cart id="cart-b"></div>
        <div x-cart id="cart-other" key="wishlist"></div>
        <div x-cardproduct id="p1" title="Desk Lamp" price="$20"></div>
        <script type="module">
          import WB from '/src/core/wb-lazy.js';
          window.WB = WB;
          await WB.init({ autoInject: true });
        </script>
      </body>
      </html>
    `);
    await expect(page.locator('#p1 .x-card__product-cta')).toBeVisible({ timeout: 15_000 });
    for (const id of ['#cart-a', '#cart-b', '#cart-other']) {
      await expect(page.locator(id)).toHaveAttribute('x-ready', '', { timeout: 15_000 });
    }

    await page.locator('#p1 .x-card__product-cta').click();

    // One click, one item -- in every cart listening, not one per cart.
    await expect(page.locator('#cart-a .x-cart__count')).toHaveText('1');
    await expect(page.locator('#cart-b .x-cart__count')).toHaveText('1');
    await expect(page.locator('#cart-other .x-cart__count')).toHaveText('1');

    // Changing one cart shows in the other with the same key, not in the one kept apart.
    await page.locator('#cart-a .x-cart__summary').click();
    await page.locator('#cart-a').getByRole('button', { name: 'Clear' }).click();
    await expect(page.locator('#cart-b .x-cart__count')).toHaveText('0');
    await expect(page.locator('#cart-other .x-cart__count')).toHaveText('1');
  });
});
