import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#380): <wb-cardproduct badge="Hot" ...> rendered no badge at
 * all. cardproduct() (src/wb-viewmodels/card.js) builds its own layout
 * independently of cardBase().buildStructure(), which is where the shared
 * badge-in-header logic lives -- cardproduct never calls it, and a stray
 * "// Removed duplicate badgeEl declaration" comment shows the badge that
 * used to render directly in cardproduct's own image figure was deleted as
 * a false "duplicate" of a path it never actually used.
 */
test.describe('cardproduct renders its badge (#380)', () => {
  test('badge="Hot" produces a visible .wb-card__badge with the right text', async ({ page }) => {
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.id = 'cardproduct-badge-test';
      container.innerHTML = `
        <wb-cardproduct title="Deluxe Widget" price="$79.99" image="https://picsum.photos/200/200" badge="Hot"></wb-cardproduct>
        <wb-cardproduct title="Plain Widget" price="$19.99" image="https://picsum.photos/200/200"></wb-cardproduct>
      `;
      document.body.appendChild(container);
    });
    await page.evaluate(() => (window as any).WB.scan(document.getElementById('cardproduct-badge-test'), { eager: true }));

    const cards = page.locator('#cardproduct-badge-test wb-cardproduct');
    const withBadge = cards.nth(0);
    const withoutBadge = cards.nth(1);

    const badge = withBadge.locator('.wb-card__badge');
    await expect(badge, 'badge="Hot" must render a real .wb-card__badge element').toHaveCount(1);
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('Hot');

    await expect(withoutBadge.locator('.wb-card__badge'), 'a card with no badge= must not render one').toHaveCount(0);
  });
});
