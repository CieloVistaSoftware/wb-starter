import { test, expect, Page } from '@playwright/test';

test.describe('Product Card (integration)', () => {
  test('should render all product properties', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-product';
      el.setAttribute('data-wb', 'cardproduct');
      el.setAttribute('data-image', 'https://picsum.photos/200/200');
      el.setAttribute('data-title', 'Test Product');
      el.setAttribute('data-price', '$99.99');
      el.setAttribute('data-original-price', '$149.99');
      el.setAttribute('data-badge', 'SALE');
      el.setAttribute('data-rating', '4.5');
      el.setAttribute('data-reviews', '128');
      el.setAttribute('data-cta', 'Buy Now');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const card = page.locator('#test-product');
    await expect(card).toHaveClass(/wb-card/);
    await expect(card).toHaveClass(/wb-card--product/);

    // Check title is rendered
    const title = card.locator('.wb-card__product-title');
    await expect(title).toHaveText('Test Product');
    
    // Check price is rendered
    const price = card.locator('.wb-card__price-current');
    await expect(price).toHaveText('$99.99');
    
    // Check original price (strikethrough)
    const originalPrice = card.locator('.wb-card__price-original');
    await expect(originalPrice).toHaveText('$149.99');
    
    // Check badge is rendered
    const badge = card.locator('.wb-card__badge');
    await expect(badge).toHaveText('SALE');
    
    // Check rating stars exist
    const rating = card.locator('.wb-card__product-rating');
    await expect(rating).toBeVisible();
    const ratingText = await rating.textContent();
    expect(ratingText).toContain('4.5');
    expect(ratingText).toContain('128');
    
    // Check CTA button
    const cta = card.locator('.wb-card__product-cta');
    await expect(cta).toHaveText('Buy Now');
  });

  test('should render image', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-product-img';
      el.setAttribute('data-wb', 'cardproduct');
      el.setAttribute('data-image', 'https://picsum.photos/200/200');
      el.setAttribute('data-title', 'Product With Image');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const img = page.locator('#test-product-img img');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('src', 'https://picsum.photos/200/200');
  });
});
