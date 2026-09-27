import { test, expect } from '../fixtures/offline';

/**
 * REGRESSION (#380): <div x-cardproduct badge="Hot" ...> rendered no badge at
 * all. cardproduct() (src/wb-viewmodels/card.js) builds its own layout
 * independently of cardBase().buildStructure(), which is where the shared
 * badge-in-header logic lives -- cardproduct never calls it, and a stray
 * "// Removed duplicate badgeEl declaration" comment shows the badge that
 * used to render directly in cardproduct's own image figure was deleted as
 * a false "duplicate" of a path it never actually used.
 */
test.describe('cardproduct renders its badge (#380)', () => {
  test('badge="Hot" produces a visible badge with the right text', async ({ page }) => {
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.id = 'cardproduct-badge-test';
      container.innerHTML = `
        <div x-cardproduct title="Deluxe Widget" price="$79.99" image="https://picsum.photos/200/200" badge="Hot"></div>
        <div x-cardproduct title="Plain Widget" price="$19.99" image="https://picsum.photos/200/200"></div>
      `;
      document.body.appendChild(container);
    });
    await page.evaluate(async () => await (window as any).WB.scan(document.getElementById('cardproduct-badge-test'), { eager: true }));

    const cards = page.locator('#cardproduct-badge-test [x-cardproduct]');
    const withBadge = cards.nth(0);
    const withoutBadge = cards.nth(1);

    // The badge carries no .x-card__badge class since a8a7362e: it is the
    // <span> laid over the product figure, which is exactly what card.css
    // styles as the overlay badge (`[x-cardproduct] figure > span`).
    const BADGE = 'figure > span';
    const badge = withBadge.locator(BADGE);
    await expect(badge, 'badge="Hot" must render a real badge element over the figure').toHaveCount(1);
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('Hot');

    await expect(withoutBadge.locator(BADGE), 'a card with no badge= must not render one').toHaveCount(0);
  });
});
